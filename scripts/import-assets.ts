import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";
import { enqueueMissingAssetRecords } from "../packages/core/src/asset-queue";
import {
  validateAssetCatalog,
  type AssetCatalogDocument,
  type AssetLicenseId,
  type AssetRecord,
} from "../packages/core/src/assets";
import { automaticEmojiForWord, contentSlug } from "../packages/core/src/asset-production";
import { CANDIDATE_WORDS } from "../packages/core/src/candidate.words";
import { twemojiCodepointCandidates } from "../packages/core/src/twemoji";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const PUBLIC_ROOT = resolve("apps/web/public/content");
const TWEMOJI_REF = "b6b55fef1e8636b540a6d016a4729ca8cdf2e60b";
const TWEMOJI_BASE = `https://raw.githubusercontent.com/jdecked/twemoji/${TWEMOJI_REF}/assets/svg`;
const TWEMOJI_SOURCE = "https://github.com/jdecked/twemoji";
const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";
const IMPORTER_USER_AGENT = "MiMundoDePalabras/0.1 (https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo)";
const WIKIMEDIA_REQUEST_GAP_MS = 1500;
const MAX_FETCH_ATTEMPTS = 5;
let lastWikimediaRequestAt = 0;

const PHOTO_QUERY_OVERRIDES: Record<string, string> = {
  MESA: "wood table",
  "RÍO": "river landscape",
  PUERTA: "wooden door",
  VASO: "empty drinking glass",
};

interface WikimediaCandidate {
  sourceUrl: string;
  downloadUrl: string;
  author: string;
  license: AssetLicenseId;
  attributionRequired: boolean;
  attributionText: string;
}

function argValue(name: string) {
  const prefix = `${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value?.slice(prefix.length);
}

const dryRun = process.argv.includes("--dry-run");
const noQueue = process.argv.includes("--no-queue");
const limit = Number(argValue("--limit") ?? "12");
const batchLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 12;
const selectedIds = new Set((argValue("--ids") ?? "").split(",").map((value) => value.trim()).filter(Boolean));

function delay(ms: number) {
  return new Promise<void>((resolveDelay) => setTimeout(resolveDelay, ms));
}

function retryAfterMs(response: Response, attempt: number) {
  const header = response.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 30_000);
    const date = Date.parse(header);
    if (Number.isFinite(date)) return Math.min(Math.max(0, date - Date.now()), 30_000);
  }
  return Math.min(1500 * 2 ** attempt, 12_000);
}

async function fetchWithRetry(url: string, init: RequestInit = {}, label = "asset request") {
  const isWikimedia = /(?:wikimedia\.org|wikipedia\.org)/i.test(url);

  for (let attempt = 0; attempt < MAX_FETCH_ATTEMPTS; attempt += 1) {
    if (isWikimedia) {
      const wait = WIKIMEDIA_REQUEST_GAP_MS - (Date.now() - lastWikimediaRequestAt);
      if (wait > 0) await delay(wait);
    }

    const headers = new Headers(init.headers);
    headers.set("User-Agent", IMPORTER_USER_AGENT);

    try {
      const response = await fetch(url, { ...init, headers });
      if (isWikimedia) lastWikimediaRequestAt = Date.now();

      const retryable = response.status === 429 || response.status === 408 || response.status >= 500;
      if (!retryable || attempt === MAX_FETCH_ATTEMPTS - 1) return response;

      const waitMs = retryAfterMs(response, attempt);
      console.warn(`${label}: HTTP ${response.status}; retrying in ${waitMs}ms (${attempt + 1}/${MAX_FETCH_ATTEMPTS}).`);
      await delay(waitMs);
    } catch (error) {
      if (attempt === MAX_FETCH_ATTEMPTS - 1) throw error;
      const waitMs = Math.min(1500 * 2 ** attempt, 12_000);
      console.warn(`${label}: network error; retrying in ${waitMs}ms (${attempt + 1}/${MAX_FETCH_ATTEMPTS}).`);
      await delay(waitMs);
    }
  }

  throw new Error(`${label}: exhausted retries`);
}

function stripHtml(value: string | undefined) {
  if (!value) return "";
  return value
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}


function licenseFromMetadata(metadata: Record<string, { value?: string }> | undefined): AssetLicenseId | null {
  const shortName = stripHtml(metadata?.LicenseShortName?.value).toLocaleLowerCase("en");
  const usageTerms = stripHtml(metadata?.UsageTerms?.value).toLocaleLowerCase("en");
  const copyrighted = stripHtml(metadata?.Copyrighted?.value).toLocaleLowerCase("en");
  if (shortName.includes("cc0") || usageTerms.includes("cc0")) return "CC0-1.0";
  if (shortName.includes("public domain") || usageTerms.includes("public domain") || copyrighted === "false") {
    return "PUBLIC-DOMAIN";
  }
  return null;
}

function booleanMetadata(value: string | undefined) {
  const normalized = stripHtml(value).toLocaleLowerCase("en");
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

async function searchWikimedia(asset: AssetRecord): Promise<WikimediaCandidate | null> {
  const searchTerm = PHOTO_QUERY_OVERRIDES[asset.word] ?? asset.word.toLocaleLowerCase("es");
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: "10",
    gsrsearch: `filetype:bitmap ${searchTerm}`,
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1200",
    iiextmetadatafilter: "LicenseShortName|LicenseUrl|UsageTerms|Artist|Credit|Attribution|AttributionRequired|Copyrighted|Restrictions|NonFree",
  });
  const response = await fetchWithRetry(`${WIKIMEDIA_API}?${params}`, {}, `Wikimedia search for ${asset.id}`);
  if (!response.ok) throw new Error(`Wikimedia search failed (${response.status}) for ${asset.id}`);
  const payload = await response.json() as {
    query?: {
      pages?: Record<string, {
        title: string;
        imageinfo?: Array<{
          url?: string;
          thumburl?: string;
          extmetadata?: Record<string, { value?: string }>;
        }>;
      }>;
    };
  };

  for (const page of Object.values(payload.query?.pages ?? {})) {
    const info = page.imageinfo?.[0];
    const metadata = info?.extmetadata;
    if (!info) continue;
    if (booleanMetadata(metadata?.NonFree?.value)) continue;
    if (stripHtml(metadata?.Restrictions?.value)) continue;
    const license = licenseFromMetadata(metadata);
    if (license !== "CC0-1.0" && license !== "PUBLIC-DOMAIN") continue;
    const downloadUrl = info.thumburl ?? info.url;
    if (!downloadUrl) continue;
    const author = stripHtml(metadata?.Artist?.value) || stripHtml(metadata?.Credit?.value) || "Wikimedia Commons contributor";
    const attributionRequired = booleanMetadata(metadata?.AttributionRequired?.value);
    const customAttribution = stripHtml(metadata?.Attribution?.value);
    const sourceUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`;
    const attributionText = customAttribution || `${author} · Wikimedia Commons · ${license === "CC0-1.0" ? "CC0 1.0" : "Public Domain"}`;
    return { sourceUrl, downloadUrl, author, license, attributionRequired, attributionText };
  }
  return null;
}

async function materializeEmoji(asset: AssetRecord) {
  const unicode = asset.emoji_unicode ?? automaticEmojiForWord(asset.word);
  if (!unicode) return false;

  let resolved: { codepoints: string; relativePath: string; downloadUrl: string; svg: string } | null = null;
  const attempted: string[] = [];
  for (const codepoints of twemojiCodepointCandidates(unicode)) {
    const relativePath = `emoji/twemoji/${codepoints}.svg`;
    const downloadUrl = `${TWEMOJI_BASE}/${codepoints}.svg`;
    attempted.push(codepoints);
    const response = await fetchWithRetry(downloadUrl, {}, `Twemoji download for ${asset.word}`);
    if (response.status === 404) continue;
    if (!response.ok) throw new Error(`Twemoji download failed (${response.status}) for ${asset.word}`);
    const svg = await response.text();
    if (!/^\s*<svg\b/i.test(svg)) throw new Error(`Twemoji response was not SVG for ${asset.word}`);
    resolved = { codepoints, relativePath, downloadUrl, svg };
    break;
  }
  if (!resolved) throw new Error(`Twemoji asset not found for ${asset.word}; tried ${attempted.join(", ")}`);

  if (!dryRun) {
    const target = resolve(PUBLIC_ROOT, resolved.relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, resolved.svg, "utf8");
  }

  asset.asset_type = "emoji";
  asset.asset_path = resolved.relativePath;
  asset.source = "Twemoji";
  asset.source_url = `${TWEMOJI_SOURCE}/blob/${TWEMOJI_REF}/assets/svg/${resolved.codepoints}.svg`;
  asset.download_url = resolved.downloadUrl;
  asset.author = "Twemoji contributors";
  asset.license = "CC-BY-4.0";
  asset.attribution_required = true;
  asset.attribution_text = "Twemoji graphics © Twitter, Inc. and other contributors, licensed CC-BY 4.0.";
  asset.verified = true;
  asset.downloaded_at = new Date().toISOString();
  asset.review_status = "pending_review";
  asset.emoji_unicode = unicode;
  asset.thumbnail_path = null;
  asset.notes = [...new Set([...(asset.notes ?? []), "Materialized automatically; pedagogical approval still required."])];
  return true;
}

async function materializePhoto(asset: AssetRecord) {
  let candidate: WikimediaCandidate | null = null;
  if (asset.download_url && asset.source_url && (asset.license === "CC0-1.0" || asset.license === "PUBLIC-DOMAIN")) {
    candidate = {
      sourceUrl: asset.source_url,
      downloadUrl: asset.download_url,
      author: asset.author ?? "Unknown",
      license: asset.license,
      attributionRequired: asset.attribution_required,
      attributionText: asset.attribution_text ?? `${asset.author ?? "Unknown"} · ${asset.license}`,
    };
  } else {
    candidate = await searchWikimedia(asset);
  }
  if (!candidate) return false;

  const relativePath = asset.asset_path ?? `photos/${contentSlug(asset.category)}/${contentSlug(asset.word)}.webp`;
  const thumbnailPath = asset.thumbnail_path ?? relativePath.replace(/\.webp$/i, ".thumb.webp");
  const target = resolve(PUBLIC_ROOT, relativePath);
  const thumbnailTarget = resolve(PUBLIC_ROOT, thumbnailPath);
  const response = await fetchWithRetry(candidate.downloadUrl, {}, `Photo download for ${asset.id}`);
  if (!response.ok) throw new Error(`Photo download failed (${response.status}) for ${asset.id}`);
  const bytes = Buffer.from(await response.arrayBuffer());

  if (!dryRun) {
    await mkdir(dirname(target), { recursive: true });
    await sharp(bytes)
      .rotate()
      .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(target);
    await sharp(bytes)
      .rotate()
      .resize({ width: 320, height: 320, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 76, effort: 4 })
      .toFile(thumbnailTarget);
  }

  asset.asset_type = "photo";
  asset.asset_path = relativePath;
  asset.thumbnail_path = thumbnailPath;
  asset.source = "Wikimedia Commons";
  asset.source_url = candidate.sourceUrl;
  asset.download_url = candidate.downloadUrl;
  asset.author = candidate.author;
  asset.license = candidate.license;
  asset.attribution_required = candidate.attributionRequired;
  asset.attribution_text = candidate.attributionText;
  asset.verified = true;
  asset.downloaded_at = new Date().toISOString();
  asset.review_status = "pending_review";
  asset.emoji_unicode = null;
  asset.notes = [...new Set([...(asset.notes ?? []), "Downloaded and optimized automatically; never auto-approved."])];
  return true;
}

async function resolveMissing(asset: AssetRecord) {
  const emoji = automaticEmojiForWord(asset.word);
  if (emoji) {
    asset.emoji_unicode = emoji;
    return materializeEmoji(asset);
  }
  return materializePhoto(asset);
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const before = validateAssetCatalog(catalog);
  if (!before.valid) throw new Error(`Invalid input catalog:\n${before.errors.join("\n")}`);

  const queued = noQueue ? [] : enqueueMissingAssetRecords(CANDIDATE_WORDS, catalog.assets, {
    limit: batchLimit,
    selectedIds,
  });
  catalog.assets.push(...queued);
  for (const asset of queued) {
    console.log(`${dryRun ? "Would queue" : "Queued"}: ${asset.id}`);
  }

  const candidates = catalog.assets.filter((asset) => {
    if (selectedIds.size && !selectedIds.has(asset.id)) return false;
    if (asset.review_status === "approved" || asset.review_status === "rejected") return false;
    return asset.review_status === "missing" || asset.review_status === "pending_review";
  }).slice(0, batchLimit);

  let processed = 0;
  for (const asset of candidates) {
    try {
      let changed = false;
      if (asset.asset_type === "emoji") changed = await materializeEmoji(asset);
      else if (asset.asset_type === "photo") changed = await materializePhoto(asset);
      else if (asset.asset_type === "missing") changed = await resolveMissing(asset);
      if (changed) {
        processed += 1;
        console.log(`${dryRun ? "Would import" : "Imported"}: ${asset.id} -> ${asset.asset_path} [pending_review]`);
      } else {
        console.warn(`No safe candidate found: ${asset.id}; leaving unresolved.`);
      }
    } catch (error) {
      console.warn(`${asset.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const after = validateAssetCatalog(catalog);
  if (!after.valid) throw new Error(`Importer produced invalid catalog:\n${after.errors.join("\n")}`);
  if (!dryRun) {
    catalog.generated_at = new Date().toISOString();
    await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  }
  console.log(`${dryRun ? "Dry run" : "Import"} complete: ${queued.length} queued, ${processed}/${candidates.length} materialized. No asset was auto-approved.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
