import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";
import { normalizeAssetWord } from "../packages/core/src/asset-queue";
import { contentSlug } from "../packages/core/src/asset-production";
import { validateAssetCatalog, type AssetCatalogDocument, type AssetLicenseId, type AssetRecord } from "../packages/core/src/assets";
import { worldForCategory } from "../packages/core/src/worlds";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const PUBLIC_ROOT = resolve("apps/web/public/content");
const REVIEW_PATH = resolve("content/asset-reviews/space-chapter-four.json");
const CONTACT_PATH = resolve("content/asset-reviews/space-chapter-four-contact.webp");
const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "MiMundoDePalabras/0.1 (https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo)";
const REQUEST_GAP_MS = 1200;
let lastWikimediaRequestAt = 0;

const SPECS = [
  { word: "MERCURIO", query: "Mercury planet MESSENGER NASA", difficulty: 4 },
  { word: "VENUS", query: "Venus planet NASA", difficulty: 3 },
  { word: "MARTE", query: "Mars planet NASA", difficulty: 2 },
  { word: "JÚPITER", query: "Jupiter planet NASA", difficulty: 3 },
  { word: "SATURNO", query: "Saturn planet Cassini NASA", difficulty: 3 },
  { word: "URANO", query: "Uranus planet Voyager NASA", difficulty: 3 },
  { word: "NEPTUNO", query: "Neptune planet Voyager NASA", difficulty: 3 },
  { word: "PLUTÓN", query: "Pluto New Horizons NASA", difficulty: 3 },
  { word: "CERES", query: "Ceres Dawn NASA", difficulty: 3 },
  { word: "ANDRÓMEDA", query: "Andromeda galaxy NASA", difficulty: 4 },
  { word: "NEBULOSA", query: "Orion Nebula Hubble NASA", difficulty: 4 },
  { word: "ROVER", query: "Curiosity rover Mars NASA", difficulty: 3 },
  { word: "ESTACIÓN", query: "International Space Station NASA photograph", difficulty: 3 },
  { word: "TRANSBORDADOR", query: "Space Shuttle Discovery NASA photograph", difficulty: 4 },
  { word: "AURORA", query: "aurora borealis NASA photograph", difficulty: 3 },
  { word: "SUPERNOVA", query: "supernova remnant NASA photograph", difficulty: 4 },
] as const;

const REJECT_TITLE = /(map|diagram|illustrat|drawing|painting|poster|stamp|coin|logo|icon|artist|concept|render|animation|chart|comparison|scheme|sketch)/i;

interface Candidate {
  title: string;
  sourceUrl: string;
  downloadUrl: string;
  author: string;
  license: "CC0-1.0" | "PUBLIC-DOMAIN";
  attributionRequired: boolean;
  attributionText: string;
}

function delay(ms: number) { return new Promise<void>((resolveDelay) => setTimeout(resolveDelay, ms)); }
function stripHtml(value: string | undefined) {
  return (value ?? "").replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}
function explicitLicense(metadata: Record<string, { value?: string }> | undefined): Candidate["license"] | null {
  const raw = `${stripHtml(metadata?.LicenseShortName?.value)} ${stripHtml(metadata?.UsageTerms?.value)}`.toLowerCase();
  if (raw.includes("cc0") || raw.includes("creative commons zero")) return "CC0-1.0";
  if (raw.includes("public domain")) return "PUBLIC-DOMAIN";
  return null;
}
function booleanMetadata(value: string | undefined) {
  const normalized = stripHtml(value).toLowerCase();
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
  const params = new URLSearchParams({ action: "query", format: "json", origin: "*", generator: "search", gsrnamespace: "6", gsrlimit: "30",
    gsrsearch: `filetype:bitmap ${query}`, prop: "imageinfo", iiprop: "url|mime|extmetadata", iiurlwidth: "1400",
    iiextmetadatafilter: "LicenseShortName|UsageTerms|Artist|Credit|Attribution|AttributionRequired|Restrictions|NonFree" });
  const response = await fetchWithRetry(`${WIKIMEDIA_API}?${params}`, `Wikimedia search: ${query}`);
  if (!response.ok) throw new Error(`Wikimedia search returned HTTP ${response.status} for ${query}`);
  const payload = await response.json() as { query?: { pages?: Record<string, { title: string; imageinfo?: Array<{ url?: string; thumburl?: string; mime?: string; extmetadata?: Record<string, { value?: string }> }> }> } };
  for (const page of Object.values(payload.query?.pages ?? {})) {
    if (REJECT_TITLE.test(page.title)) continue;
    const info = page.imageinfo?.[0];
    if (!info || (info.mime && !/^image\/(?:jpeg|png|webp)$/i.test(info.mime))) continue;
    const metadata = info.extmetadata;
    if (booleanMetadata(metadata?.NonFree?.value) || stripHtml(metadata?.Restrictions?.value)) continue;
    const license = explicitLicense(metadata);
    if (!license) continue;
    const downloadUrl = info.thumburl ?? info.url;
    if (!downloadUrl) continue;
    const author = stripHtml(metadata?.Artist?.value) || stripHtml(metadata?.Credit?.value) || "Wikimedia Commons contributor";
    const attributionRequired = booleanMetadata(metadata?.AttributionRequired?.value);
    const customAttribution = stripHtml(metadata?.Attribution?.value);
    const sourceUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`;
    return { title: page.title, sourceUrl, downloadUrl, author, license, attributionRequired,
      attributionText: customAttribution || `${author} · Wikimedia Commons · ${license === "CC0-1.0" ? "CC0 1.0" : "Public Domain"}` };
  }
  throw new Error(`No acceptable explicitly CC0/Public Domain bitmap candidate found for ${query}`);
}
function sha256(bytes: Buffer) { return createHash("sha256").update(bytes).digest("hex"); }
function escapeXml(value: string) { return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[char] ?? char)); }

async function buildContactSheet(entries: Array<{ word: string; thumbnail_path: string; selected_title: string }>) {
  const overlays: sharp.OverlayOptions[] = [];
  const cellW = 300, cellH = 235;
  for (let i = 0; i < entries.length; i += 1) {
    const asset = entries[i]; const x = (i % 4) * cellW; const y = Math.floor(i / 4) * cellH;
    const thumb = await sharp(resolve(PUBLIC_ROOT, asset.thumbnail_path)).resize({ width: 260, height: 175, fit: "contain", background: "white" }).png().toBuffer();
    overlays.push({ input: thumb, left: x + 20, top: y + 10 });
    const title = asset.selected_title.replace(/^File:/, "").slice(0, 42);
    const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="48"><rect width="280" height="48" fill="white"/><text x="140" y="19" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="black">${escapeXml(asset.word)}</text><text x="140" y="38" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="black">${escapeXml(title)}</text></svg>`);
    overlays.push({ input: label, left: x + 10, top: y + 184 });
  }
  await sharp({ create: { width: 1200, height: 940, channels: 3, background: "white" } }).composite(overlays).webp({ quality: 88 }).toFile(CONTACT_PATH);
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const validation = validateAssetCatalog(catalog);
  if (!validation.valid) throw new Error(`Invalid input catalog:\n${validation.errors.join("\n")}`);
  const byId = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  const world = worldForCategory("Espacio");
  if (!world) throw new Error("Espacio world is not configured");
  const now = new Date().toISOString();
  const reviewEntries: Array<Record<string, unknown>> = [];
  for (const spec of SPECS) {
    const id = `${contentSlug("Espacio")}.${contentSlug(spec.word)}`;
    const previous = byId.get(id);
    if (previous?.review_status === "approved") throw new Error(`${id} is already approved; staging refuses to replace reviewed content`);
    const candidate = await findCandidate(spec.query);
    const response = await fetchWithRetry(candidate.downloadUrl, `Photo download: ${id}`);
    if (!response.ok) throw new Error(`Photo download returned HTTP ${response.status} for ${id}`);
    const sourceBytes = Buffer.from(await response.arrayBuffer());
    const assetPath = `photos/espacio/${contentSlug(spec.word)}.webp`;
    const thumbnailPath = `photos/espacio/${contentSlug(spec.word)}.thumb.webp`;
    const target = resolve(PUBLIC_ROOT, assetPath); const thumbTarget = resolve(PUBLIC_ROOT, thumbnailPath);
    await mkdir(dirname(target), { recursive: true });
    await sharp(sourceBytes).rotate().resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toFile(target);
    await sharp(sourceBytes).rotate().resize({ width: 320, height: 320, fit: "inside", withoutEnlargement: true }).webp({ quality: 76, effort: 4 }).toFile(thumbTarget);
    const assetBytes = await readFile(target); const thumbBytes = await readFile(thumbTarget);
    const record: AssetRecord = { id, word: spec.word, normalized_word: normalizeAssetWord(spec.word), category: "Espacio", world: world.id,
      difficulty: spec.difficulty, asset_type: "photo", asset_path: assetPath, source: "Wikimedia Commons", source_url: candidate.sourceUrl,
      download_url: candidate.downloadUrl, author: candidate.author, license: candidate.license as AssetLicenseId,
      attribution_required: candidate.attributionRequired, attribution_text: candidate.attributionText, verified: true, downloaded_at: now,
      review_status: "pending_review", emoji_unicode: null, thumbnail_path: thumbnailPath,
      notes: ["Space chapter-four staging: explicit CC0/Public Domain metadata verified; visual concept review still required.", `Wikimedia search query: ${spec.query}`] };
    if (previous) Object.assign(previous, record); else { catalog.assets.push(record); byId.set(id, record); }
    reviewEntries.push({ id, word: spec.word, query: spec.query, selected_title: candidate.title, source_url: candidate.sourceUrl,
      download_url: candidate.downloadUrl, author: candidate.author, license: candidate.license, asset_path: assetPath, thumbnail_path: thumbnailPath,
      source_sha256: sha256(sourceBytes), asset_sha256: sha256(assetBytes), thumbnail_sha256: sha256(thumbBytes), visual_review: "pending" });
    console.log(`Staged pending space photo: ${id} <- ${candidate.title} [${candidate.license}]`);
  }
  catalog.generated_at = now;
  const after = validateAssetCatalog(catalog);
  if (!after.valid) throw new Error(`Space photo staging produced invalid catalog:\n${after.errors.join("\n")}`);
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await mkdir(dirname(REVIEW_PATH), { recursive: true });
  await writeFile(REVIEW_PATH, `${JSON.stringify({ generated_at: now, status: "pending_visual_review", assets: reviewEntries }, null, 2)}\n`, "utf8");
  await buildContactSheet(reviewEntries as Array<{ word: string; thumbnail_path: string; selected_title: string }>);
  console.log(`Staged ${reviewEntries.length} Space chapter-four photo candidates; none were auto-approved.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
