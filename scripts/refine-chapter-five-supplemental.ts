import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";
import { validateAssetCatalog, type AssetCatalogDocument, type AssetLicenseId } from "../packages/core/src/assets";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const REVIEW_PATH = resolve("content/asset-reviews/chapter-five-supplemental-photos.json");
const CONTACT_PATH = resolve("content/asset-reviews/chapter-five-supplemental-casa-contact.webp");
const PUBLIC_ROOT = resolve("apps/web/public/content");
const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "MiMundoDePalabras/0.1 (https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo)";
const ARMARIO_OLD_TITLE = "File:Napoleon's Wardrobe.jpg";
const ARMARIO_NEW_TITLE = "File:Wardrobe MET DP235305.jpg";
const REQUEST_GAP_MS = 1000;
let lastRequestAt = 0;

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
  source_canonical_sha1?: string;
  visual_review: "pending" | "approved" | "rejected";
  review_note?: string;
};
type ReviewDocument = { generated_at: string; status: "pending_visual_review" | "approved"; assets: ReviewEntry[] };
type Metadata = Record<string, { value?: string }>;
type ImageInfo = { url?: string; thumburl?: string; mime?: string; sha1?: string; extmetadata?: Metadata };

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
      await delay(retryAfter > 0 ? Math.min(retryAfter * 1000, 30_000) : Math.min(1500 * 2 ** attempt, 12_000));
    } catch (error) {
      if (attempt === 4) throw error;
      await delay(Math.min(1500 * 2 ** attempt, 12_000));
    }
  }
  throw new Error(`${label}: retries exhausted`);
}
async function exactInfo(title: string) {
  const params = new URLSearchParams({
    action: "query", format: "json", origin: "*", prop: "imageinfo",
    iiprop: "url|mime|sha1|extmetadata", iiurlwidth: "1400",
    iiextmetadatafilter: "LicenseShortName|UsageTerms|Artist|Credit|Attribution|AttributionRequired|Restrictions|NonFree",
    titles: title,
  });
  const response = await fetchWithRetry(`${WIKIMEDIA_API}?${params}`, title);
  if (!response.ok) throw new Error(`${title}: Wikimedia HTTP ${response.status}`);
  const payload = await response.json() as { query?: { pages?: Record<string, { missing?: string; title: string; imageinfo?: ImageInfo[] }> } };
  const page = Object.values(payload.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!page || page.missing !== undefined || !info) throw new Error(`${title}: exact file not found`);
  if (!/^image\/(?:jpeg|png|webp)$/i.test(info.mime ?? "")) throw new Error(`${title}: unsupported MIME ${info.mime}`);
  if (!/^[a-f0-9]{40}$/i.test(info.sha1 ?? "")) throw new Error(`${title}: missing canonical SHA-1`);
  const metadata = info.extmetadata;
  if (truthy(metadata?.NonFree?.value) || stripHtml(metadata?.Restrictions?.value)) throw new Error(`${title}: non-free/restricted metadata`);
  const license = explicitLicense(metadata);
  if (!license) throw new Error(`${title}: not explicitly CC0/Public Domain`);
  const downloadUrl = info.thumburl ?? info.url;
  if (!downloadUrl) throw new Error(`${title}: no image URL`);
  const author = stripHtml(metadata?.Artist?.value) || stripHtml(metadata?.Credit?.value) || "Wikimedia Commons contributor";
  const attributionRequired = truthy(metadata?.AttributionRequired?.value);
  const customAttribution = stripHtml(metadata?.Attribution?.value);
  return {
    title: page.title, downloadUrl, author, license, sha1: info.sha1!.toLowerCase(), attributionRequired,
    attributionText: customAttribution || `${author} · Wikimedia Commons · ${license === "CC0-1.0" ? "CC0 1.0" : "Public Domain"}`,
    sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
  };
}
function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[char] ?? char));
}
async function rebuildCasaContact(entries: ReviewEntry[]) {
  const selected = entries.filter((entry) => entry.category === "Casa");
  const cols = 3, cellW = 320, cellH = 245, rows = Math.ceil(selected.length / cols);
  const overlays: sharp.OverlayOptions[] = [];
  for (let i = 0; i < selected.length; i += 1) {
    const entry = selected[i], x = (i % cols) * cellW, y = Math.floor(i / cols) * cellH;
    const thumb = await sharp(resolve(PUBLIC_ROOT, entry.thumbnail_path)).resize({ width: 280, height: 180, fit: "contain", background: "white" }).png().toBuffer();
    overlays.push({ input: thumb, left: x + 20, top: y + 10 });
    const title = entry.selected_title.replace(/^File:/, "").slice(0, 45);
    const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="50"><rect width="300" height="50" fill="white"/><text x="150" y="20" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="700">${escapeXml(entry.word)}</text><text x="150" y="40" text-anchor="middle" font-family="Arial,sans-serif" font-size="10">${escapeXml(title)}</text></svg>`);
    overlays.push({ input: label, left: x + 10, top: y + 190 });
  }
  await mkdir(dirname(CONTACT_PATH), { recursive: true });
  await sharp({ create: { width: cols * cellW, height: rows * cellH, channels: 3, background: "white" } }).composite(overlays).webp({ quality: 88 }).toFile(CONTACT_PATH);
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const review = JSON.parse(await readFile(REVIEW_PATH, "utf8")) as ReviewDocument;
  const before = validateAssetCatalog(catalog);
  if (!before.valid) throw new Error(`Invalid input catalog:\n${before.errors.join("\n")}`);
  if (review.status !== "pending_visual_review" || review.assets.length !== 10 || review.assets.some((entry) => entry.visual_review !== "pending")) {
    throw new Error("Expected the exact untouched 10-photo pending supplemental batch");
  }
  const armario = review.assets.find((entry) => entry.id === "casa.armario");
  if (!armario || armario.selected_title !== ARMARIO_OLD_TITLE) throw new Error("ARMARIO is not at the expected pre-refinement source");
  const byId = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  const armarioAsset = byId.get("casa.armario");
  if (!armarioAsset || armarioAsset.review_status !== "pending_review" || armarioAsset.asset_type !== "photo") throw new Error("casa.armario must still be a pending photo");

  const replacement = await exactInfo(ARMARIO_NEW_TITLE);
  if (replacement.title !== ARMARIO_NEW_TITLE || replacement.license !== "CC0-1.0") throw new Error("Replacement wardrobe source failed exact-title/CC0 gate");
  const response = await fetchWithRetry(replacement.downloadUrl, "ARMARIO replacement download");
  if (!response.ok) throw new Error(`ARMARIO replacement download HTTP ${response.status}`);
  const sourceBytes = Buffer.from(await response.arrayBuffer());
  const assetTarget = resolve(PUBLIC_ROOT, armario.asset_path), thumbTarget = resolve(PUBLIC_ROOT, armario.thumbnail_path);
  const assetBytes = await sharp(sourceBytes).rotate().resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer();
  const thumbBytes = await sharp(sourceBytes).rotate().resize({ width: 320, height: 320, fit: "inside", withoutEnlargement: true }).webp({ quality: 76, effort: 4 }).toBuffer();
  await mkdir(dirname(assetTarget), { recursive: true });
  await writeFile(assetTarget, assetBytes); await writeFile(thumbTarget, thumbBytes);
  Object.assign(armario, {
    selected_title: replacement.title,
    source_url: replacement.sourceUrl,
    download_url: replacement.downloadUrl,
    author: replacement.author,
    license: replacement.license,
    source_sha256: sha256(sourceBytes),
    asset_sha256: sha256(assetBytes),
    thumbnail_sha256: sha256(thumbBytes),
    source_canonical_sha1: replacement.sha1,
  });
  Object.assign(armarioAsset, {
    source: "Wikimedia Commons", source_url: replacement.sourceUrl, download_url: replacement.downloadUrl,
    author: replacement.author, license: replacement.license, attribution_required: replacement.attributionRequired,
    attribution_text: replacement.attributionText, verified: true,
    notes: [...(armarioAsset.notes ?? []), "Supplemental refinement: replaced ornate historical wardrobe candidate with a clearer full-object CC0 MET wardrobe photograph; visual approval remains pending."],
  });

  for (const entry of review.assets) {
    if (entry.id === "casa.armario") continue;
    const info = await exactInfo(entry.selected_title);
    if (info.title !== entry.selected_title || info.license !== entry.license) throw new Error(`${entry.id}: exact title/license changed during canonical audit`);
    entry.source_canonical_sha1 = info.sha1;
    const asset = byId.get(entry.id);
    if (!asset || asset.review_status !== "pending_review" || asset.asset_type !== "photo") throw new Error(`${entry.id}: must remain a pending photo`);
    if (asset.source_url !== entry.source_url || asset.asset_path !== entry.asset_path || asset.thumbnail_path !== entry.thumbnail_path) throw new Error(`${entry.id}: catalog/review provenance drift`);
  }

  const now = new Date().toISOString();
  review.generated_at = now;
  catalog.generated_at = now;
  const after = validateAssetCatalog(catalog);
  if (!after.valid) throw new Error(`Refined catalog invalid:\n${after.errors.join("\n")}`);
  await rebuildCasaContact(review.assets);
  await writeFile(REVIEW_PATH, `${JSON.stringify(review, null, 2)}\n`, "utf8");
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log("Refined ARMARIO and recorded canonical Wikimedia SHA-1 for all 10 supplemental photos; all remain pending.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
