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
const REVIEW_PATH = resolve(REVIEW_DIR, "chapter-five-supplemental-photos.json");
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "MiMundoDePalabras/0.1 (https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo)";
const REQUEST_GAP_MS = 1200;
let lastRequestAt = 0;

const SPECS = [
  { category: "Casa", word: "TOALLA", title: "File:White towel (23403430576).jpg", difficulty: 3, license: "CC0-1.0" },
  { category: "Casa", word: "COLCHÓN", title: "File:Mattress.jpg", difficulty: 3, license: "PUBLIC-DOMAIN" },
  { category: "Casa", word: "ARMARIO", title: "File:Napoleon's Wardrobe.jpg", difficulty: 4, license: "CC0-1.0" },
  { category: "Casa", word: "ESCRITORIO", title: "File:Full view of desk.jpg", difficulty: 4, license: "CC0-1.0" },
  { category: "Casa", word: "HORNO", title: "File:High End Double Oven 1.jpg", difficulty: 3, license: "CC0-1.0" },
  { category: "Casa", word: "VENTILADOR", title: "File:HK 電風扇 electric fan white 日本 Plus Minus Zero Co 中國製造 made in China 卓領亞太 觀塘 Kwun Tong 入口 家福送贈 Hong Kong Family Welfare sponsor June 2026 N13P 01.jpg", difficulty: 4, license: "CC0-1.0" },
  { category: "Comida", word: "YUCA", title: "File:PeeLawPeeNam Cassava root Yuca Manioc.jpg", difficulty: 3, license: "CC0-1.0" },
  { category: "Comida", word: "PAPAYA", title: "File:PAPAYA.jpg", difficulty: 3, license: "CC0-1.0" },
  { category: "Comida", word: "LENTEJA", title: "File:Lentil.jpg", difficulty: 3, license: "CC0-1.0" },
  { category: "Comida", word: "HARINA", title: "File:Wheat flour 01.jpg", difficulty: 3, license: "CC0-1.0" },
] as const;

type AcceptedLicense = "CC0-1.0" | "PUBLIC-DOMAIN";
type Candidate = {
  title: string;
  sourceUrl: string;
  downloadUrl: string;
  author: string;
  license: AcceptedLicense;
  attributionRequired: boolean;
  attributionText: string;
};
type ReviewEntry = {
  id: string; word: string; category: string; selected_title: string; source_url: string; download_url: string; author: string;
  license: AssetLicenseId; asset_path: string; thumbnail_path: string; source_sha256: string; asset_sha256: string;
  thumbnail_sha256: string; visual_review: "pending";
};

function delay(ms: number) { return new Promise<void>((resolveDelay) => setTimeout(resolveDelay, ms)); }
function strip(value: string | undefined) {
  return (value ?? "").replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}
function bool(value: string | undefined) { return ["true", "1", "yes"].includes(strip(value).toLowerCase()); }
function licenseOf(metadata: Record<string, { value?: string }> | undefined): AcceptedLicense | null {
  const raw = `${strip(metadata?.LicenseShortName?.value)} ${strip(metadata?.UsageTerms?.value)}`.toLowerCase();
  if (raw.includes("cc0") || raw.includes("creative commons zero")) return "CC0-1.0";
  if (raw.includes("public domain") || raw.includes("released into the public domain")) return "PUBLIC-DOMAIN";
  return null;
}
async function fetchRetry(url: string, label: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const wait = REQUEST_GAP_MS - (Date.now() - lastRequestAt);
    if (wait > 0) await delay(wait);
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      lastRequestAt = Date.now();
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
async function fetchExact(title: string): Promise<Candidate> {
  const params = new URLSearchParams({
    action: "query", format: "json", origin: "*", prop: "imageinfo", iiprop: "url|mime|extmetadata", iiurlwidth: "1400", titles: title,
    iiextmetadatafilter: "LicenseShortName|UsageTerms|Artist|Credit|Attribution|AttributionRequired|Restrictions|NonFree",
  });
  const response = await fetchRetry(`${COMMONS_API}?${params}`, `Commons ${title}`);
  if (!response.ok) throw new Error(`${title}: Commons API HTTP ${response.status}`);
  const payload = await response.json() as { query?: { pages?: Record<string, { missing?: string; title: string; imageinfo?: Array<{ url?: string; thumburl?: string; mime?: string; extmetadata?: Record<string, { value?: string }> }> }> } };
  const page = Object.values(payload.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!page || page.missing !== undefined || !info) throw new Error(`${title}: exact Commons file not found`);
  if (info.mime && !/^image\/(?:jpeg|png|webp)$/i.test(info.mime)) throw new Error(`${title}: unsupported MIME ${info.mime}`);
  const metadata = info.extmetadata;
  if (bool(metadata?.NonFree?.value) || strip(metadata?.Restrictions?.value)) throw new Error(`${title}: restricted/non-free source`);
  const license = licenseOf(metadata);
  if (!license) throw new Error(`${title}: not explicitly CC0/Public Domain`);
  const downloadUrl = info.thumburl ?? info.url;
  if (!downloadUrl) throw new Error(`${title}: no image URL`);
  const author = strip(metadata?.Artist?.value) || strip(metadata?.Credit?.value) || "Wikimedia Commons contributor";
  const attributionRequired = bool(metadata?.AttributionRequired?.value);
  const customAttribution = strip(metadata?.Attribution?.value);
  return {
    title: page.title,
    sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
    downloadUrl,
    author,
    license,
    attributionRequired,
    attributionText: customAttribution || `${author} · Wikimedia Commons · ${license === "CC0-1.0" ? "CC0 1.0" : "Public Domain"}`,
  };
}
function sha256(bytes: Buffer) { return createHash("sha256").update(bytes).digest("hex"); }
function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[char] ?? char));
}
async function buildSheet(entries: ReviewEntry[], category: string, output: string) {
  const selected = entries.filter((entry) => entry.category === category);
  const cols = 3; const rows = Math.ceil(selected.length / cols); const cellW = 320; const cellH = 245;
  const overlays: sharp.OverlayOptions[] = [];
  for (let i = 0; i < selected.length; i += 1) {
    const item = selected[i]; const x = (i % cols) * cellW; const y = Math.floor(i / cols) * cellH;
    const thumb = await sharp(resolve(PUBLIC_ROOT, item.thumbnail_path)).resize({ width: 270, height: 180, fit: "contain", background: "white" }).png().toBuffer();
    overlays.push({ input: thumb, left: x + 25, top: y + 10 });
    const title = item.selected_title.replace(/^File:/, "").slice(0, 48);
    const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="48"><rect width="300" height="48" fill="white"/><text x="150" y="19" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="700">${escapeXml(item.word)}</text><text x="150" y="38" text-anchor="middle" font-family="Arial,sans-serif" font-size="9">${escapeXml(title)}</text></svg>`);
    overlays.push({ input: label, left: x + 10, top: y + 190 });
  }
  await sharp({ create: { width: cols * cellW, height: rows * cellH, channels: 3, background: "white" } }).composite(overlays).webp({ quality: 88 }).toFile(resolve(REVIEW_DIR, output));
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const before = validateAssetCatalog(catalog);
  if (!before.valid) throw new Error(before.errors.join("\n"));
  const byId = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  const now = new Date().toISOString();
  const reviews: ReviewEntry[] = [];

  for (const spec of SPECS) {
    const world = worldForCategory(spec.category);
    if (!world) throw new Error(`No world for ${spec.category}`);
    const id = `${contentSlug(spec.category)}.${contentSlug(spec.word)}`;
    const previous = byId.get(id);
    if (previous?.review_status === "approved") throw new Error(`${id}: refuses to replace approved content`);
    const candidate = await fetchExact(spec.title);
    if (candidate.title !== spec.title) throw new Error(`${id}: Commons title changed to ${candidate.title}`);
    if (candidate.license !== spec.license) throw new Error(`${id}: expected ${spec.license}, got ${candidate.license}`);
    const download = await fetchRetry(candidate.downloadUrl, `download ${id}`);
    if (!download.ok) throw new Error(`${id}: download HTTP ${download.status}`);
    const sourceBytes = Buffer.from(await download.arrayBuffer());
    const categorySlug = contentSlug(spec.category); const wordSlug = contentSlug(spec.word);
    const assetPath = `photos/${categorySlug}/${wordSlug}.webp`; const thumbnailPath = `photos/${categorySlug}/${wordSlug}.thumb.webp`;
    const assetTarget = resolve(PUBLIC_ROOT, assetPath); const thumbTarget = resolve(PUBLIC_ROOT, thumbnailPath);
    await mkdir(dirname(assetTarget), { recursive: true });
    const assetBytes = await sharp(sourceBytes).rotate().resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer();
    const thumbBytes = await sharp(sourceBytes).rotate().resize({ width: 320, height: 320, fit: "inside", withoutEnlargement: true }).webp({ quality: 76, effort: 4 }).toBuffer();
    await writeFile(assetTarget, assetBytes); await writeFile(thumbTarget, thumbBytes);
    const record: AssetRecord = {
      id, word: spec.word, normalized_word: normalizeAssetWord(spec.word), category: spec.category, world: world.id, difficulty: spec.difficulty,
      asset_type: "photo", asset_path: assetPath, source: "Wikimedia Commons", source_url: candidate.sourceUrl, download_url: candidate.downloadUrl,
      author: candidate.author, license: candidate.license as AssetLicenseId, attribution_required: candidate.attributionRequired,
      attribution_text: candidate.attributionText, verified: true, downloaded_at: now, review_status: "pending_review", emoji_unicode: null,
      thumbnail_path: thumbnailPath, notes: ["Chapter-five supplemental staging: exact pinned CC0/Public Domain photo; visual approval remains separate.", `Pinned Wikimedia source: ${candidate.title}`],
    };
    if (previous) Object.assign(previous, record); else { catalog.assets.push(record); byId.set(id, record); }
    reviews.push({ id, word: spec.word, category: spec.category, selected_title: candidate.title, source_url: candidate.sourceUrl, download_url: candidate.downloadUrl,
      author: candidate.author, license: candidate.license as AssetLicenseId, asset_path: assetPath, thumbnail_path: thumbnailPath,
      source_sha256: sha256(sourceBytes), asset_sha256: sha256(assetBytes), thumbnail_sha256: sha256(thumbBytes), visual_review: "pending" });
    console.log(`Staged supplemental pending photo: ${id} <- ${candidate.title} [${candidate.license}]`);
  }

  if (reviews.length !== 10) throw new Error(`Expected 10 supplemental photos, got ${reviews.length}`);
  const counts = reviews.reduce<Record<string, number>>((acc, item) => { acc[item.category] = (acc[item.category] ?? 0) + 1; return acc; }, {});
  if (counts.Casa !== 6 || counts.Comida !== 4) throw new Error(`Unexpected category counts ${JSON.stringify(counts)}`);
  catalog.generated_at = now;
  const after = validateAssetCatalog(catalog);
  if (!after.valid) throw new Error(after.errors.join("\n"));
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await mkdir(REVIEW_DIR, { recursive: true });
  await writeFile(REVIEW_PATH, `${JSON.stringify({ generated_at: now, status: "pending_visual_review", assets: reviews }, null, 2)}\n`, "utf8");
  await buildSheet(reviews, "Casa", "chapter-five-supplemental-casa-contact.webp");
  await buildSheet(reviews, "Comida", "chapter-five-supplemental-comida-contact.webp");
  console.log("Staged 10 supplemental chapter-five photos; all remain pending visual review.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
