import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";
import { normalizeAssetWord } from "../packages/core/src/asset-queue";
import { contentSlug } from "../packages/core/src/asset-production";
import {
  validateAssetCatalog,
  type AssetCatalogDocument,
  type AssetLicenseId,
  type AssetRecord,
} from "../packages/core/src/assets";
import { worldForCategory } from "../packages/core/src/worlds";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const PUBLIC_ROOT = resolve("apps/web/public/content");
const REVIEW_PATH = resolve("content/asset-reviews/ocean-chapter-four.json");
const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "MiMundoDePalabras/0.1 (https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo)";
const REQUEST_GAP_MS = 1100;
let lastWikimediaRequestAt = 0;

const SPECS = [
  { word: "ORCA", query: "orca killer whale", difficulty: 3 },
  { word: "NARVAL", query: "narwhal Monodon monoceros", difficulty: 3 },
  { word: "MORSA", query: "walrus Odobenus rosmarus", difficulty: 3 },
  { word: "MANTA", query: "manta ray Manta", difficulty: 3 },
  { word: "RAYA", query: "stingray ray fish", difficulty: 2 },
  { word: "ANGUILA", query: "eel Anguilla fish", difficulty: 3 },
  { word: "ATÚN", query: "tuna fish", difficulty: 3 },
  { word: "SARDINA", query: "sardine fish", difficulty: 3 },
  { word: "PEZESPADA", query: "swordfish Xiphias gladius", difficulty: 4 },
  { word: "PEZPAYASO", query: "clownfish Amphiprion", difficulty: 4 },
  { word: "ALMEJA", query: "clam bivalve shell", difficulty: 3 },
  { word: "MEJILLÓN", query: "mussel Mytilus shell", difficulty: 3 },
  { word: "ANÉMONA", query: "sea anemone", difficulty: 4 },
  { word: "ESTRELLA", query: "starfish sea star", difficulty: 3 },
  { word: "ERIZODEMAR", query: "sea urchin", difficulty: 4 },
  { word: "PELICANO", query: "pelican bird", difficulty: 3 },
] as const;

interface Candidate {
  title: string;
  sourceUrl: string;
  downloadUrl: string;
  author: string;
  license: "CC0-1.0" | "PUBLIC-DOMAIN";
  attributionRequired: boolean;
  attributionText: string;
}

function delay(ms: number) {
  return new Promise<void>((resolveDelay) => setTimeout(resolveDelay, ms));
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

function explicitLicense(metadata: Record<string, { value?: string }> | undefined): Candidate["license"] | null {
  const shortName = stripHtml(metadata?.LicenseShortName?.value).toLocaleLowerCase("en");
  const usageTerms = stripHtml(metadata?.UsageTerms?.value).toLocaleLowerCase("en");
  if (shortName.includes("cc0") || usageTerms.includes("cc0")) return "CC0-1.0";
  if (shortName.includes("public domain") || usageTerms.includes("public domain")) return "PUBLIC-DOMAIN";
  return null;
}

function booleanMetadata(value: string | undefined) {
  const normalized = stripHtml(value).toLocaleLowerCase("en");
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

async function fetchWithRetry(url: string, label: string) {
  const isWikimedia = /wikimedia\.org/i.test(url);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (isWikimedia) {
      const wait = REQUEST_GAP_MS - (Date.now() - lastWikimediaRequestAt);
      if (wait > 0) await delay(wait);
    }
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (isWikimedia) lastWikimediaRequestAt = Date.now();
      const retryable = response.status === 429 || response.status === 408 || response.status >= 500;
      if (!retryable || attempt === 4) return response;
      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      await delay(retryAfter > 0 ? Math.min(retryAfter * 1000, 30_000) : Math.min(1500 * 2 ** attempt, 12_000));
    } catch (error) {
      if (attempt === 4) throw error;
      await delay(Math.min(1500 * 2 ** attempt, 12_000));
    }
  }
  throw new Error(`${label}: exhausted retries`);
}

async function findCandidate(query: string): Promise<Candidate> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: "20",
    gsrsearch: `filetype:bitmap ${query}`,
    prop: "imageinfo",
    iiprop: "url|mime|extmetadata",
    iiurlwidth: "1400",
    iiextmetadatafilter: "LicenseShortName|UsageTerms|Artist|Credit|Attribution|AttributionRequired|Restrictions|NonFree",
  });
  const response = await fetchWithRetry(`${WIKIMEDIA_API}?${params}`, `Wikimedia search: ${query}`);
  if (!response.ok) throw new Error(`Wikimedia search returned HTTP ${response.status} for ${query}`);
  const payload = await response.json() as {
    query?: {
      pages?: Record<string, {
        title: string;
        imageinfo?: Array<{
          url?: string;
          thumburl?: string;
          mime?: string;
          extmetadata?: Record<string, { value?: string }>;
        }>;
      }>;
    };
  };

  for (const page of Object.values(payload.query?.pages ?? {})) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    if (info.mime && !/^image\/(?:jpeg|png|webp)$/i.test(info.mime)) continue;
    const metadata = info.extmetadata;
    if (booleanMetadata(metadata?.NonFree?.value)) continue;
    if (stripHtml(metadata?.Restrictions?.value)) continue;
    const license = explicitLicense(metadata);
    if (!license) continue;
    const downloadUrl = info.thumburl ?? info.url;
    if (!downloadUrl) continue;
    const author = stripHtml(metadata?.Artist?.value) || stripHtml(metadata?.Credit?.value) || "Wikimedia Commons contributor";
    const attributionRequired = booleanMetadata(metadata?.AttributionRequired?.value);
    const customAttribution = stripHtml(metadata?.Attribution?.value);
    const sourceUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`;
    const attributionText = customAttribution || `${author} · Wikimedia Commons · ${license === "CC0-1.0" ? "CC0 1.0" : "Public Domain"}`;
    return { title: page.title, sourceUrl, downloadUrl, author, license, attributionRequired, attributionText };
  }
  throw new Error(`No explicitly CC0/Public Domain bitmap candidate found for ${query}`);
}

function sha256(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const validation = validateAssetCatalog(catalog);
  if (!validation.valid) throw new Error(`Invalid input catalog:\n${validation.errors.join("\n")}`);

  const byId = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  const world = worldForCategory("Océano");
  if (!world) throw new Error("Océano world is not configured.");
  const now = new Date().toISOString();
  const reviewEntries: Array<Record<string, unknown>> = [];

  for (const spec of SPECS) {
    const id = `${contentSlug("Océano")}.${contentSlug(spec.word)}`;
    const previous = byId.get(id);
    if (previous?.review_status === "approved") {
      throw new Error(`${id} is already approved; staging refuses to replace reviewed content.`);
    }

    const candidate = await findCandidate(spec.query);
    const response = await fetchWithRetry(candidate.downloadUrl, `Photo download: ${id}`);
    if (!response.ok) throw new Error(`Photo download returned HTTP ${response.status} for ${id}`);
    const sourceBytes = Buffer.from(await response.arrayBuffer());

    const relativePath = `photos/oceano/${contentSlug(spec.word)}.webp`;
    const thumbnailPath = `photos/oceano/${contentSlug(spec.word)}.thumb.webp`;
    const target = resolve(PUBLIC_ROOT, relativePath);
    const thumbnailTarget = resolve(PUBLIC_ROOT, thumbnailPath);
    await mkdir(dirname(target), { recursive: true });

    await sharp(sourceBytes)
      .rotate()
      .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(target);
    await sharp(sourceBytes)
      .rotate()
      .resize({ width: 320, height: 320, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 76, effort: 4 })
      .toFile(thumbnailTarget);

    const localBytes = await readFile(target);
    const thumbBytes = await readFile(thumbnailTarget);
    const record: AssetRecord = {
      id,
      word: spec.word,
      normalized_word: normalizeAssetWord(spec.word),
      category: "Océano",
      world: world.id,
      difficulty: spec.difficulty,
      asset_type: "photo",
      asset_path: relativePath,
      source: "Wikimedia Commons",
      source_url: candidate.sourceUrl,
      download_url: candidate.downloadUrl,
      author: candidate.author,
      license: candidate.license as AssetLicenseId,
      attribution_required: candidate.attributionRequired,
      attribution_text: candidate.attributionText,
      verified: true,
      downloaded_at: now,
      review_status: "pending_review",
      emoji_unicode: null,
      thumbnail_path: thumbnailPath,
      notes: [
        "Ocean chapter-four staging: explicit CC0/Public Domain metadata verified; visual concept review still required.",
        `Wikimedia search query: ${spec.query}`,
      ],
    };

    if (previous) Object.assign(previous, record);
    else {
      catalog.assets.push(record);
      byId.set(id, record);
    }

    reviewEntries.push({
      id,
      word: spec.word,
      query: spec.query,
      selected_title: candidate.title,
      source_url: candidate.sourceUrl,
      download_url: candidate.downloadUrl,
      author: candidate.author,
      license: candidate.license,
      asset_path: relativePath,
      thumbnail_path: thumbnailPath,
      source_sha256: sha256(sourceBytes),
      asset_sha256: sha256(localBytes),
      thumbnail_sha256: sha256(thumbBytes),
      visual_review: "pending",
    });
    console.log(`Staged pending photo: ${id} <- ${candidate.title} [${candidate.license}]`);
  }

  catalog.generated_at = now;
  const after = validateAssetCatalog(catalog);
  if (!after.valid) throw new Error(`Photo staging produced invalid catalog:\n${after.errors.join("\n")}`);
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await mkdir(dirname(REVIEW_PATH), { recursive: true });
  await writeFile(REVIEW_PATH, `${JSON.stringify({ generated_at: now, status: "pending_visual_review", assets: reviewEntries }, null, 2)}\n`, "utf8");
  console.log(`Staged ${reviewEntries.length} ocean photo candidates. None were auto-approved.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
