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
const REVIEW_DIR = resolve("content/asset-reviews");
const REVIEW_PATH = resolve(REVIEW_DIR, "chapter-five-photos.json");
const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "MiMundoDePalabras/0.1 (https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo)";
const REQUEST_GAP_MS = 1200;
let lastWikimediaRequestAt = 0;

const SPECS = [
  // Casa 5 — exact reviewed source targets, never first-search-hit.
  { category: "Casa", word: "NEVERA", exactTitle: "File:Refrigeradora en casa.jpg", difficulty: 3 },
  { category: "Casa", word: "CAFETERA", exactTitle: "File:Coffee maker 2024.jpg", difficulty: 3 },
  { category: "Casa", word: "MICROONDAS", exactTitle: "File:Microwave oven \"Erisson\".jpg", difficulty: 4 },
  { category: "Casa", word: "LAVADORA", exactTitle: "File:Washing machine (23745702205).jpg", difficulty: 3 },
  { category: "Casa", word: "SARTÉN", exactTitle: "File:Cooking frying pan.jpg", difficulty: 3 },

  // Comida 5 — exact CC0 food photographs.
  { category: "Comida", word: "PESCADO", exactTitle: "File:Fried Fish Fillet.JPG", difficulty: 3 },
  { category: "Comida", word: "SALCHICHA", exactTitle: "File:Sausage links.jpg", difficulty: 3 },
  { category: "Comida", word: "HUMMUS", exactTitle: "File:Hummus dish on a plate.jpg", difficulty: 3 },
  { category: "Comida", word: "CHURRO", exactTitle: "File:Churros 001.jpg", difficulty: 3 },

  // Naturaleza 5 — controlled discovery, then separate visual review.
  { category: "Naturaleza", word: "LAGO", query: "lake landscape photograph", difficulty: 3 },
  { category: "Naturaleza", word: "ARENA", query: "sand beach closeup photograph", difficulty: 3 },
  { category: "Naturaleza", word: "BOSQUE", query: "forest landscape photograph", difficulty: 3 },
  { category: "Naturaleza", word: "CUEVA", query: "cave interior photograph", difficulty: 3 },
  { category: "Naturaleza", word: "CASCADA", query: "waterfall landscape photograph", difficulty: 3 },
  { category: "Naturaleza", word: "VALLE", query: "valley landscape photograph", difficulty: 3 },
  { category: "Naturaleza", word: "SELVA", query: "tropical rainforest landscape photograph", difficulty: 3 },
  { category: "Naturaleza", word: "PRADO", query: "meadow landscape photograph", difficulty: 3 },
  { category: "Naturaleza", word: "ACANTILADO", query: "sea cliff landscape photograph", difficulty: 4 },
  { category: "Naturaleza", word: "CAÑÓN", query: "canyon landscape photograph", difficulty: 3 },
  { category: "Naturaleza", word: "GLACIAR", query: "glacier landscape photograph", difficulty: 3 },
  { category: "Naturaleza", word: "ICEBERG", query: "iceberg ocean photograph", difficulty: 3 },
  { category: "Naturaleza", word: "CRÁTER", query: "meteor crater landscape photograph", difficulty: 3 },
  { category: "Naturaleza", word: "GEISER", query: "geyser eruption photograph", difficulty: 3 },
  { category: "Naturaleza", word: "BARRO", query: "mud ground closeup photograph", difficulty: 3 },
  { category: "Naturaleza", word: "CUARZO", query: "quartz crystal photograph", difficulty: 3 },
] as const;

const REJECT_TITLE = /(map|diagram|illustrat|drawing|painting|poster|stamp|coin|logo|icon|artist|concept|render|animation|chart|comparison|scheme|sketch|engraving|lithograph)/i;

type AcceptedLicense = "CC0-1.0" | "PUBLIC-DOMAIN";
interface Candidate { title: string; sourceUrl: string; downloadUrl: string; author: string; license: AcceptedLicense; attributionRequired: boolean; attributionText: string; }
interface ReviewEntry {
  id: string; word: string; category: string; query: string | null; selected_title: string; source_url: string; download_url: string;
  author: string; license: AssetLicenseId; asset_path: string; thumbnail_path: string;
  source_sha256: string; asset_sha256: string; thumbnail_sha256: string; visual_review: "pending";
}

function delay(ms: number) { return new Promise<void>((resolveDelay) => setTimeout(resolveDelay, ms)); }
function stripHtml(value: string | undefined) {
  return (value ?? "").replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}
function explicitLicense(metadata: Record<string, { value?: string }> | undefined): AcceptedLicense | null {
  const raw = `${stripHtml(metadata?.LicenseShortName?.value)} ${stripHtml(metadata?.UsageTerms?.value)}`.toLowerCase();
  if (raw.includes("cc0") || raw.includes("creative commons zero")) return "CC0-1.0";
  if (raw.includes("public domain") || raw.includes("released into the public domain")) return "PUBLIC-DOMAIN";
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
function candidateFromInfo(title: string, info: { url?: string; thumburl?: string; mime?: string; extmetadata?: Record<string, { value?: string }> }): Candidate {
  if (info.mime && !/^image\/(?:jpeg|png|webp)$/i.test(info.mime)) throw new Error(`${title}: exact source is not a supported bitmap (${info.mime})`);
  const metadata = info.extmetadata;
  if (booleanMetadata(metadata?.NonFree?.value) || stripHtml(metadata?.Restrictions?.value)) throw new Error(`${title}: source carries non-free/restriction metadata`);
  const license = explicitLicense(metadata);
  if (!license) throw new Error(`${title}: source is not explicitly CC0/Public Domain`);
  const downloadUrl = info.thumburl ?? info.url;
  if (!downloadUrl) throw new Error(`${title}: no downloadable image URL`);
  const author = stripHtml(metadata?.Artist?.value) || stripHtml(metadata?.Credit?.value) || "Wikimedia Commons contributor";
  const attributionRequired = booleanMetadata(metadata?.AttributionRequired?.value);
  const customAttribution = stripHtml(metadata?.Attribution?.value);
  return {
    title,
    sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
    downloadUrl,
    author,
    license,
    attributionRequired,
    attributionText: customAttribution || `${author} · Wikimedia Commons · ${license === "CC0-1.0" ? "CC0 1.0" : "Public Domain"}`,
  };
}
async function fetchExactCandidate(title: string): Promise<Candidate> {
  const params = new URLSearchParams({ action: "query", format: "json", origin: "*", prop: "imageinfo", iiprop: "url|mime|extmetadata", iiurlwidth: "1400", titles: title,
    iiextmetadatafilter: "LicenseShortName|UsageTerms|Artist|Credit|Attribution|AttributionRequired|Restrictions|NonFree" });
  const response = await fetchWithRetry(`${WIKIMEDIA_API}?${params}`, `Exact Wikimedia file: ${title}`);
  if (!response.ok) throw new Error(`${title}: Wikimedia API returned HTTP ${response.status}`);
  const payload = await response.json() as { query?: { pages?: Record<string, { missing?: string; title: string; imageinfo?: Array<{ url?: string; thumburl?: string; mime?: string; extmetadata?: Record<string, { value?: string }> }> }> } };
  const page = Object.values(payload.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!page || page.missing !== undefined || !info) throw new Error(`${title}: exact Wikimedia file not found`);
  return candidateFromInfo(page.title, info);
}
async function findCandidate(query: string): Promise<Candidate> {
  const params = new URLSearchParams({ action: "query", format: "json", origin: "*", generator: "search", gsrnamespace: "6", gsrlimit: "40", gsrsearch: `filetype:bitmap ${query}`,
    prop: "imageinfo", iiprop: "url|mime|extmetadata", iiurlwidth: "1400", iiextmetadatafilter: "LicenseShortName|UsageTerms|Artist|Credit|Attribution|AttributionRequired|Restrictions|NonFree" });
  const response = await fetchWithRetry(`${WIKIMEDIA_API}?${params}`, `Wikimedia search: ${query}`);
  if (!response.ok) throw new Error(`Wikimedia search returned HTTP ${response.status} for ${query}`);
  const payload = await response.json() as { query?: { pages?: Record<string, { title: string; imageinfo?: Array<{ url?: string; thumburl?: string; mime?: string; extmetadata?: Record<string, { value?: string }> }> }> } };
  for (const page of Object.values(payload.query?.pages ?? {})) {
    if (REJECT_TITLE.test(page.title)) continue;
    const info = page.imageinfo?.[0];
    if (!info) continue;
    try { return candidateFromInfo(page.title, info); } catch { /* try next legal bitmap */ }
  }
  throw new Error(`No acceptable explicitly CC0/Public Domain bitmap candidate found for ${query}`);
}
function sha256(bytes: Buffer) { return createHash("sha256").update(bytes).digest("hex"); }
function escapeXml(value: string) { return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[char] ?? char)); }
async function buildContactSheet(entries: ReviewEntry[], category: string, outputName: string) {
  const selected = entries.filter((entry) => entry.category === category);
  const cols = 4, rows = Math.ceil(selected.length / cols), cellW = 300, cellH = 235;
  const overlays: sharp.OverlayOptions[] = [];
  for (let i = 0; i < selected.length; i += 1) {
    const asset = selected[i], x = (i % cols) * cellW, y = Math.floor(i / cols) * cellH;
    const thumb = await sharp(resolve(PUBLIC_ROOT, asset.thumbnail_path)).resize({ width: 260, height: 175, fit: "contain", background: "white" }).png().toBuffer();
    overlays.push({ input: thumb, left: x + 20, top: y + 10 });
    const title = asset.selected_title.replace(/^File:/, "").slice(0, 42);
    const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="48"><rect width="280" height="48" fill="white"/><text x="140" y="19" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="700">${escapeXml(asset.word)}</text><text x="140" y="38" text-anchor="middle" font-family="Arial,sans-serif" font-size="10">${escapeXml(title)}</text></svg>`);
    overlays.push({ input: label, left: x + 10, top: y + 184 });
  }
  await sharp({ create: { width: cols * cellW, height: rows * cellH, channels: 3, background: "white" } }).composite(overlays).webp({ quality: 88 }).toFile(resolve(REVIEW_DIR, outputName));
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const validation = validateAssetCatalog(catalog);
  if (!validation.valid) throw new Error(`Invalid input catalog:\n${validation.errors.join("\n")}`);
  const byId = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  const now = new Date().toISOString();
  const reviewEntries: ReviewEntry[] = [];

  for (const spec of SPECS) {
    const world = worldForCategory(spec.category);
    if (!world) throw new Error(`No world configured for ${spec.category}`);
    const id = `${contentSlug(spec.category)}.${contentSlug(spec.word)}`;
    const previous = byId.get(id);
    if (previous?.review_status === "approved") throw new Error(`${id}: staging refuses to replace approved content`);
    const candidate = "exactTitle" in spec ? await fetchExactCandidate(spec.exactTitle) : await findCandidate(spec.query);
    const response = await fetchWithRetry(candidate.downloadUrl, `Photo download: ${id}`);
    if (!response.ok) throw new Error(`Photo download returned HTTP ${response.status} for ${id}`);
    const sourceBytes = Buffer.from(await response.arrayBuffer());
    const categorySlug = contentSlug(spec.category), wordSlug = contentSlug(spec.word);
    const assetPath = `photos/${categorySlug}/${wordSlug}.webp`, thumbnailPath = `photos/${categorySlug}/${wordSlug}.thumb.webp`;
    const target = resolve(PUBLIC_ROOT, assetPath), thumbTarget = resolve(PUBLIC_ROOT, thumbnailPath);
    await mkdir(dirname(target), { recursive: true });
    const assetBytes = await sharp(sourceBytes).rotate().resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer();
    const thumbBytes = await sharp(sourceBytes).rotate().resize({ width: 320, height: 320, fit: "inside", withoutEnlargement: true }).webp({ quality: 76, effort: 4 }).toBuffer();
    await writeFile(target, assetBytes); await writeFile(thumbTarget, thumbBytes);
    const query = "query" in spec ? spec.query : null;
    const record: AssetRecord = {
      id, word: spec.word, normalized_word: normalizeAssetWord(spec.word), category: spec.category, world: world.id, difficulty: spec.difficulty,
      asset_type: "photo", asset_path: assetPath, source: "Wikimedia Commons", source_url: candidate.sourceUrl, download_url: candidate.downloadUrl,
      author: candidate.author, license: candidate.license as AssetLicenseId, attribution_required: candidate.attributionRequired, attribution_text: candidate.attributionText,
      verified: true, downloaded_at: now, review_status: "pending_review", emoji_unicode: null, thumbnail_path: thumbnailPath,
      notes: ["Chapter-five staging: explicit CC0/Public Domain metadata verified; visual approval remains a separate guarded step.",
        "exactTitle" in spec ? `Pinned Wikimedia source: ${candidate.title}` : `Controlled Wikimedia query: ${query}`],
    };
    if (previous) Object.assign(previous, record); else { catalog.assets.push(record); byId.set(id, record); }
    reviewEntries.push({ id, word: spec.word, category: spec.category, query, selected_title: candidate.title, source_url: candidate.sourceUrl,
      download_url: candidate.downloadUrl, author: candidate.author, license: candidate.license as AssetLicenseId, asset_path: assetPath, thumbnail_path: thumbnailPath,
      source_sha256: sha256(sourceBytes), asset_sha256: sha256(assetBytes), thumbnail_sha256: sha256(thumbBytes), visual_review: "pending" });
    console.log(`Staged pending photo: ${id} <- ${candidate.title} [${candidate.license}]`);
  }

  if (reviewEntries.length !== 25) throw new Error(`Expected 25 chapter-five photos, got ${reviewEntries.length}`);
  const categoryCounts = reviewEntries.reduce<Record<string, number>>((acc, item) => { acc[item.category] = (acc[item.category] ?? 0) + 1; return acc; }, {});
  if (categoryCounts.Casa !== 5 || categoryCounts.Comida !== 4 || categoryCounts.Naturaleza !== 16) throw new Error(`Unexpected category counts: ${JSON.stringify(categoryCounts)}`);
  catalog.generated_at = now;
  const after = validateAssetCatalog(catalog);
  if (!after.valid) throw new Error(`Chapter-five staging produced invalid catalog:\n${after.errors.join("\n")}`);
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await mkdir(REVIEW_DIR, { recursive: true });
  await writeFile(REVIEW_PATH, `${JSON.stringify({ generated_at: now, status: "pending_visual_review", assets: reviewEntries }, null, 2)}\n`, "utf8");
  await buildContactSheet(reviewEntries, "Casa", "chapter-five-casa-contact.webp");
  await buildContactSheet(reviewEntries, "Comida", "chapter-five-comida-contact.webp");
  await buildContactSheet(reviewEntries, "Naturaleza", "chapter-five-naturaleza-contact.webp");
  console.log("Staged 25 chapter-five photo candidates; all remain pending visual review.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
