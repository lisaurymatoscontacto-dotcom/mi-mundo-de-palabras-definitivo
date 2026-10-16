import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { canPublishAsset, validateAssetCatalog, type AssetCatalogDocument, type AssetLicenseId } from "../packages/core/src/assets";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const REVIEW_PATH = resolve("content/asset-reviews/chapter-five-supplemental-photos.json");
const PUBLIC_ROOT = resolve("apps/web/public/content");
const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "MiMundoDePalabras/0.1 (https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo)";
const REQUEST_GAP_MS = 900;
let lastRequestAt = 0;

const EXPECTED = new Map<string, { title: string; license: AssetLicenseId }>([
  ["casa.toalla", { title: "File:White towel (23403430576).jpg", license: "CC0-1.0" }],
  ["casa.colchon", { title: "File:Mattress.jpg", license: "PUBLIC-DOMAIN" }],
  ["casa.armario", { title: "File:Wardrobe MET DP235305.jpg", license: "CC0-1.0" }],
  ["casa.escritorio", { title: "File:Full view of desk.jpg", license: "CC0-1.0" }],
  ["casa.horno", { title: "File:High End Double Oven 1.jpg", license: "CC0-1.0" }],
  ["casa.ventilador", { title: "File:HK 電風扇 electric fan white 日本 Plus Minus Zero Co 中國製造 made in China 卓領亞太 觀塘 Kwun Tong 入口 家福送贈 Hong Kong Family Welfare sponsor June 2026 N13P 01.jpg", license: "CC0-1.0" }],
  ["comida.yuca", { title: "File:PeeLawPeeNam Cassava root Yuca Manioc.jpg", license: "CC0-1.0" }],
  ["comida.papaya", { title: "File:PAPAYA.jpg", license: "CC0-1.0" }],
  ["comida.lenteja", { title: "File:Lentil.jpg", license: "CC0-1.0" }],
  ["comida.harina", { title: "File:Wheat flour 01.jpg", license: "CC0-1.0" }],
]);

type Metadata = Record<string, { value?: string }>;
type ReviewEntry = {
  id: string; word: string; category: string; selected_title: string; source_url: string; download_url: string;
  author: string; license: AssetLicenseId; asset_path: string; thumbnail_path: string; source_sha256: string;
  asset_sha256: string; thumbnail_sha256: string; source_canonical_sha1?: string;
  visual_review: "pending" | "approved" | "rejected"; review_note?: string;
};
type ReviewDocument = { generated_at: string; status: "pending_visual_review" | "approved"; assets: ReviewEntry[] };

function delay(ms: number) { return new Promise<void>((resolveDelay) => setTimeout(resolveDelay, ms)); }
function sha256(bytes: Buffer) { return createHash("sha256").update(bytes).digest("hex"); }
function stripHtml(value: string | undefined) {
  return (value ?? "").replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}
function explicitLicense(metadata: Metadata | undefined): "CC0-1.0" | "PUBLIC-DOMAIN" | null {
  const raw = `${stripHtml(metadata?.LicenseShortName?.value)} ${stripHtml(metadata?.UsageTerms?.value)}`.toLowerCase();
  if (raw.includes("cc0") || raw.includes("creative commons zero")) return "CC0-1.0";
  if (raw.includes("public domain") || raw.includes("released into the public domain")) return "PUBLIC-DOMAIN";
  return null;
}
function truthy(value: string | undefined) {
  const normalized = stripHtml(value).toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}
async function fetchWithRetry(url: string, label: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const wait = REQUEST_GAP_MS - (Date.now() - lastRequestAt);
    if (wait > 0) await delay(wait);
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      lastRequestAt = Date.now();
      const retryable = response.status === 429 || response.status === 408 || response.status >= 500;
      if (!retryable || attempt === 4) return response;
      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      await delay(retryAfter > 0 ? Math.min(retryAfter * 1000, 30_000) : Math.min(1400 * 2 ** attempt, 12_000));
    } catch (error) {
      if (attempt === 4) throw error;
      await delay(Math.min(1400 * 2 ** attempt, 12_000));
    }
  }
  throw new Error(`${label}: retries exhausted`);
}
async function verifyCanonical(entry: ReviewEntry, expected: { title: string; license: AssetLicenseId }) {
  const params = new URLSearchParams({
    action: "query", format: "json", origin: "*", prop: "imageinfo", iiprop: "sha1|mime|extmetadata",
    iiextmetadatafilter: "LicenseShortName|UsageTerms|Restrictions|NonFree", titles: expected.title,
  });
  const response = await fetchWithRetry(`${WIKIMEDIA_API}?${params}`, entry.id);
  if (!response.ok) throw new Error(`${entry.id}: Wikimedia HTTP ${response.status}`);
  const payload = await response.json() as { query?: { pages?: Record<string, { missing?: string; title: string; imageinfo?: Array<{ sha1?: string; mime?: string; extmetadata?: Metadata }> }> } };
  const page = Object.values(payload.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!page || page.missing !== undefined || !info) throw new Error(`${entry.id}: canonical source disappeared`);
  if (page.title !== expected.title || entry.selected_title !== expected.title) throw new Error(`${entry.id}: exact source title changed`);
  if (!/^image\/(?:jpeg|png|webp)$/i.test(info.mime ?? "")) throw new Error(`${entry.id}: source MIME changed`);
  if (truthy(info.extmetadata?.NonFree?.value) || stripHtml(info.extmetadata?.Restrictions?.value)) throw new Error(`${entry.id}: source became restricted/non-free`);
  const license = explicitLicense(info.extmetadata);
  if (license !== expected.license || entry.license !== expected.license) throw new Error(`${entry.id}: source license changed`);
  if (!entry.source_canonical_sha1 || info.sha1?.toLowerCase() !== entry.source_canonical_sha1.toLowerCase()) throw new Error(`${entry.id}: canonical Wikimedia SHA-1 changed`);
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const review = JSON.parse(await readFile(REVIEW_PATH, "utf8")) as ReviewDocument;
  const before = validateAssetCatalog(catalog);
  if (!before.valid) throw new Error(`Invalid input catalog:\n${before.errors.join("\n")}`);
  if (EXPECTED.size !== 10 || review.status !== "pending_visual_review" || review.assets.length !== 10) throw new Error("Expected exactly 10 pending supplemental photos");
  if (review.assets.some((entry) => entry.visual_review !== "pending")) throw new Error("Supplemental approval refuses a partially reviewed batch");
  const ids = new Set(review.assets.map((entry) => entry.id));
  if (ids.size !== 10 || [...EXPECTED.keys()].some((id) => !ids.has(id))) throw new Error("Supplemental IDs do not match guarded manifest");
  const byId = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  const approvedBefore = catalog.assets.filter((asset) => asset.review_status === "approved").length;

  for (const entry of review.assets) {
    const expected = EXPECTED.get(entry.id)!;
    const asset = byId.get(entry.id);
    if (!asset || asset.asset_type !== "photo" || asset.review_status !== "pending_review") throw new Error(`${entry.id}: catalog asset is not pending photo`);
    if (asset.word !== entry.word || asset.category !== entry.category || asset.license !== expected.license) throw new Error(`${entry.id}: identity/license drift`);
    if (asset.source_url !== entry.source_url || asset.download_url !== entry.download_url || asset.asset_path !== entry.asset_path || asset.thumbnail_path !== entry.thumbnail_path) throw new Error(`${entry.id}: provenance/path drift`);
    if (!/^[a-f0-9]{64}$/.test(entry.asset_sha256) || !/^[a-f0-9]{64}$/.test(entry.thumbnail_sha256) || !/^[a-f0-9]{40}$/.test(entry.source_canonical_sha1 ?? "")) throw new Error(`${entry.id}: malformed integrity metadata`);
    const localAsset = await readFile(resolve(PUBLIC_ROOT, entry.asset_path));
    const localThumb = await readFile(resolve(PUBLIC_ROOT, entry.thumbnail_path));
    if (sha256(localAsset) !== entry.asset_sha256) throw new Error(`${entry.id}: local WebP changed after review`);
    if (sha256(localThumb) !== entry.thumbnail_sha256) throw new Error(`${entry.id}: local thumbnail changed after review`);
    await verifyCanonical(entry, expected);
    console.log(`Verified canonical source + local hashes: ${entry.id}`);
  }

  const approvedAt = new Date().toISOString();
  const reviewNote = "Chapter-five supplemental editorial approval: exact Wikimedia title, CC0/Public Domain license, canonical source SHA-1, local WebP and thumbnail hashes were revalidated; the photo directly represents the written concept under the one-word/one-concept policy.";
  for (const entry of review.assets) {
    const asset = byId.get(entry.id)!;
    entry.visual_review = "approved";
    entry.review_note = reviewNote;
    asset.review_status = "approved";
    asset.verified = true;
    asset.notes = [...(asset.notes ?? []), reviewNote];
    if (!canPublishAsset(asset)) throw new Error(`${entry.id}: not publishable after approval`);
  }
  review.status = "approved";
  review.generated_at = approvedAt;
  catalog.generated_at = approvedAt;
  const after = validateAssetCatalog(catalog);
  if (!after.valid) throw new Error(`Approved catalog invalid:\n${after.errors.join("\n")}`);
  const approvedAfter = catalog.assets.filter((asset) => asset.review_status === "approved").length;
  if (approvedAfter !== approvedBefore + 10) throw new Error(`Approval count mismatch: ${approvedBefore} -> ${approvedAfter}`);
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await writeFile(REVIEW_PATH, `${JSON.stringify(review, null, 2)}\n`, "utf8");
  console.log(`Approved 10 supplemental chapter-five photos: ${approvedBefore} -> ${approvedAfter} total approved assets.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
