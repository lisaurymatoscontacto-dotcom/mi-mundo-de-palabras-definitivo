import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";
import { validateAssetCatalog, type AssetCatalogDocument, type AssetLicenseId } from "../packages/core/src/assets";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const REVIEW_PATH = resolve("content/asset-reviews/chapter-five-photos.json");
const REVIEW_DIR = resolve("content/asset-reviews");
const PUBLIC_ROOT = resolve("apps/web/public/content");
const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "MiMundoDePalabras/0.1 (https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo)";
const REQUEST_GAP_MS = 1200;
let lastWikimediaRequestAt = 0;

const REPLACEMENTS = [
  { id: "naturaleza.cueva", exactTitle: "File:Deep Cave (51202093762).jpg" },
  { id: "naturaleza.cascada", exactTitle: "File:Buttermilk Falls, on the New Jersey side of the Delaware River. (4e60164f-1dd8-b71b-0bcd-a1953bd6a54a).jpg" },
  { id: "naturaleza.iceberg", exactTitle: "File:Front row Iceberg-Chugach-KK-005 (52503186215).jpg" },
  { id: "naturaleza.geiser", exactTitle: "File:Riverside Geyser eruption (38396853531).jpg" },
  { id: "naturaleza.cuarzo", exactTitle: "File:Quartz (GeoDIL number - 2254).jpg" },
] as const;

type AcceptedLicense = "CC0-1.0" | "PUBLIC-DOMAIN";
type ReviewEntry = {
  id: string;
  word: string;
  category: string;
  query: string | null;
  selected_title: string;
  source_url: string;
  download_url: string;
  author: string;
  license: AssetLicenseId;
  asset_path: string;
  thumbnail_path: string;
  source_sha256: string;
  asset_sha256: string;
  thumbnail_sha256: string;
  visual_review: "pending";
};
type ReviewDocument = {
  generated_at: string;
  status: "pending_visual_review";
  assets: ReviewEntry[];
};
type Candidate = {
  title: string;
  sourceUrl: string;
  downloadUrl: string;
  author: string;
  license: AcceptedLicense;
  attributionRequired: boolean;
  attributionText: string;
};

function delay(ms: number) {
  return new Promise<void>((resolveDelay) => setTimeout(resolveDelay, ms));
}
function stripHtml(value: string | undefined) {
  return (value ?? "")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
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
async function fetchExactCandidate(title: string): Promise<Candidate> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    prop: "imageinfo",
    iiprop: "url|mime|extmetadata",
    iiurlwidth: "1400",
    titles: title,
    iiextmetadatafilter: "LicenseShortName|UsageTerms|Artist|Credit|Attribution|AttributionRequired|Restrictions|NonFree",
  });
  const response = await fetchWithRetry(`${WIKIMEDIA_API}?${params}`, `Exact Wikimedia file: ${title}`);
  if (!response.ok) throw new Error(`${title}: Wikimedia API returned HTTP ${response.status}`);
  const payload = await response.json() as {
    query?: { pages?: Record<string, {
      missing?: string;
      title: string;
      imageinfo?: Array<{ url?: string; thumburl?: string; mime?: string; extmetadata?: Record<string, { value?: string }> }>;
    }> };
  };
  const page = Object.values(payload.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!page || page.missing !== undefined || !info) throw new Error(`${title}: exact Wikimedia file not found`);
  if (info.mime && !/^image\/(?:jpeg|png|webp)$/i.test(info.mime)) throw new Error(`${title}: unsupported MIME ${info.mime}`);
  const metadata = info.extmetadata;
  if (booleanMetadata(metadata?.NonFree?.value) || stripHtml(metadata?.Restrictions?.value)) throw new Error(`${title}: restricted/non-free source`);
  const license = explicitLicense(metadata);
  if (!license) throw new Error(`${title}: source is not explicitly CC0/Public Domain`);
  const downloadUrl = info.thumburl ?? info.url;
  if (!downloadUrl) throw new Error(`${title}: no downloadable image URL`);
  const author = stripHtml(metadata?.Artist?.value) || stripHtml(metadata?.Credit?.value) || "Wikimedia Commons contributor";
  const attributionRequired = booleanMetadata(metadata?.AttributionRequired?.value);
  const customAttribution = stripHtml(metadata?.Attribution?.value);
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
function sha256(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}
function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[char] ?? char));
}
async function rebuildNatureSheet(entries: ReviewEntry[]) {
  const selected = entries.filter((entry) => entry.category === "Naturaleza");
  if (selected.length !== 16) throw new Error(`Expected 16 Naturaleza review entries, got ${selected.length}`);
  const cols = 4;
  const rows = 4;
  const cellW = 300;
  const cellH = 235;
  const overlays: sharp.OverlayOptions[] = [];
  for (let i = 0; i < selected.length; i += 1) {
    const asset = selected[i];
    const x = (i % cols) * cellW;
    const y = Math.floor(i / cols) * cellH;
    const thumb = await sharp(resolve(PUBLIC_ROOT, asset.thumbnail_path))
      .resize({ width: 260, height: 175, fit: "contain", background: "white" })
      .png()
      .toBuffer();
    overlays.push({ input: thumb, left: x + 20, top: y + 10 });
    const title = asset.selected_title.replace(/^File:/, "").slice(0, 42);
    const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="48"><rect width="280" height="48" fill="white"/><text x="140" y="19" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="700">${escapeXml(asset.word)}</text><text x="140" y="38" text-anchor="middle" font-family="Arial,sans-serif" font-size="10">${escapeXml(title)}</text></svg>`);
    overlays.push({ input: label, left: x + 10, top: y + 184 });
  }
  await sharp({ create: { width: cols * cellW, height: rows * cellH, channels: 3, background: "white" } })
    .composite(overlays)
    .webp({ quality: 88 })
    .toFile(resolve(REVIEW_DIR, "chapter-five-naturaleza-contact.webp"));
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const review = JSON.parse(await readFile(REVIEW_PATH, "utf8")) as ReviewDocument;
  const inputValidation = validateAssetCatalog(catalog);
  if (!inputValidation.valid) throw new Error(`Invalid input catalog:\n${inputValidation.errors.join("\n")}`);
  if (review.status !== "pending_visual_review" || review.assets.length !== 25) {
    throw new Error("Chapter-five review batch is not the expected 25-item pending batch.");
  }
  if (review.assets.some((entry) => entry.visual_review !== "pending")) {
    throw new Error("Refinement refuses to touch a chapter-five batch that already contains a visual decision.");
  }

  const byAssetId = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  const byReviewId = new Map(review.assets.map((entry) => [entry.id, entry]));
  const now = new Date().toISOString();

  for (const replacement of REPLACEMENTS) {
    const asset = byAssetId.get(replacement.id);
    const reviewEntry = byReviewId.get(replacement.id);
    if (!asset || !reviewEntry) throw new Error(`${replacement.id}: missing from staged batch`);
    if (asset.review_status !== "pending_review" || asset.asset_type !== "photo") {
      throw new Error(`${replacement.id}: refinement requires a pending photo asset`);
    }
    if (reviewEntry.visual_review !== "pending") throw new Error(`${replacement.id}: review is no longer pending`);

    const candidate = await fetchExactCandidate(replacement.exactTitle);
    const response = await fetchWithRetry(candidate.downloadUrl, `Photo download: ${replacement.id}`);
    if (!response.ok) throw new Error(`${replacement.id}: photo download returned HTTP ${response.status}`);
    const sourceBytes = Buffer.from(await response.arrayBuffer());
    const assetPath = reviewEntry.asset_path;
    const thumbnailPath = reviewEntry.thumbnail_path;
    const target = resolve(PUBLIC_ROOT, assetPath);
    const thumbTarget = resolve(PUBLIC_ROOT, thumbnailPath);
    await mkdir(dirname(target), { recursive: true });
    const assetBytes = await sharp(sourceBytes).rotate().resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer();
    const thumbBytes = await sharp(sourceBytes).rotate().resize({ width: 320, height: 320, fit: "inside", withoutEnlargement: true }).webp({ quality: 76, effort: 4 }).toBuffer();
    await writeFile(target, assetBytes);
    await writeFile(thumbTarget, thumbBytes);

    asset.source = "Wikimedia Commons";
    asset.source_url = candidate.sourceUrl;
    asset.download_url = candidate.downloadUrl;
    asset.author = candidate.author;
    asset.license = candidate.license as AssetLicenseId;
    asset.attribution_required = candidate.attributionRequired;
    asset.attribution_text = candidate.attributionText;
    asset.verified = true;
    asset.downloaded_at = now;
    asset.review_status = "pending_review";
    asset.notes = [
      "Chapter-five staging: explicit CC0/Public Domain metadata verified; visual approval remains a separate guarded step.",
      `Pinned replacement Wikimedia source: ${candidate.title}`,
      "Editorial refinement replaced an earlier legally valid but visually weaker candidate.",
    ];

    reviewEntry.query = null;
    reviewEntry.selected_title = candidate.title;
    reviewEntry.source_url = candidate.sourceUrl;
    reviewEntry.download_url = candidate.downloadUrl;
    reviewEntry.author = candidate.author;
    reviewEntry.license = candidate.license as AssetLicenseId;
    reviewEntry.source_sha256 = sha256(sourceBytes);
    reviewEntry.asset_sha256 = sha256(assetBytes);
    reviewEntry.thumbnail_sha256 = sha256(thumbBytes);
    reviewEntry.visual_review = "pending";
    console.log(`Refined pending photo: ${replacement.id} <- ${candidate.title} [${candidate.license}]`);
  }

  catalog.generated_at = now;
  review.generated_at = now;
  const outputValidation = validateAssetCatalog(catalog);
  if (!outputValidation.valid) throw new Error(`Refined catalog is invalid:\n${outputValidation.errors.join("\n")}`);
  for (const entry of review.assets) {
    const asset = byAssetId.get(entry.id);
    if (!asset || asset.review_status !== "pending_review") throw new Error(`${entry.id}: all 25 photos must remain pending_review`);
  }
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await writeFile(REVIEW_PATH, `${JSON.stringify(review, null, 2)}\n`, "utf8");
  await rebuildNatureSheet(review.assets);
  console.log("Refined 5 Nature chapter-five photos; all 25 chapter-five photos remain pending visual review.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
