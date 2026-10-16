import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";
import { validateAssetCatalog, type AssetCatalogDocument, type AssetLicenseId } from "../packages/core/src/assets";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const REVIEW_PATH = resolve("content/asset-reviews/space-chapter-four.json");
const CONTACT_PATH = resolve("content/asset-reviews/space-chapter-four-contact.webp");
const PUBLIC_ROOT = resolve("apps/web/public/content");
const USER_AGENT = "MiMundoDePalabras/0.1 (https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo)";

const replacements = [
  { id: "espacio.mercurio", title: "File:Mercury in true color.jpg" },
  { id: "espacio.marte", title: "File:Mars Valles Marineris.jpeg" },
  { id: "espacio.saturno", title: "File:Saturn during Equinox.jpg" },
  { id: "espacio.pluton", title: "File:Pluto in True Color - High-Res.jpg" },
  { id: "espacio.estacion", title: "File:International Space Station after undocking of STS-132.jpg" },
] as const;

interface ReviewAsset {
  id: string; word: string; query: string; selected_title: string; source_url: string; download_url: string;
  author: string; license: AssetLicenseId; asset_path: string; thumbnail_path: string;
  source_sha256: string; asset_sha256: string; thumbnail_sha256: string; visual_review: "pending" | "approved" | "rejected";
}
interface ReviewDocument { generated_at: string; status: string; assets: ReviewAsset[]; }
function hash(buffer: Buffer) { return createHash("sha256").update(buffer).digest("hex"); }
function stripHtml(value: string | undefined) { return (value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim(); }
function licenseFromMetadata(metadata: Record<string, { value?: string }>): AssetLicenseId {
  const raw = `${metadata.LicenseShortName?.value ?? ""} ${metadata.UsageTerms?.value ?? ""}`.toLowerCase();
  if (raw.includes("cc0") || raw.includes("creative commons zero")) return "CC0-1.0";
  if (raw.includes("public domain")) return "PUBLIC-DOMAIN";
  throw new Error(`Source is not explicitly CC0/Public Domain: ${raw || "missing license metadata"}`);
}
async function fetchRetry(url: string, attempts = 5) {
  let last: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (response.ok) return response;
      if (response.status !== 429 && response.status < 500) throw new Error(`HTTP ${response.status} for ${url}`);
      last = new Error(`HTTP ${response.status} for ${url}`);
    } catch (error) { last = error; }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1200 * attempt));
  }
  throw last instanceof Error ? last : new Error(`Failed to fetch ${url}`);
}
async function fetchCommonsFile(title: string) {
  const params = new URLSearchParams({ action: "query", format: "json", prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "1920", titles: title, origin: "*" });
  const response = await fetchRetry(`https://commons.wikimedia.org/w/api.php?${params}`);
  const payload = await response.json() as { query?: { pages?: Record<string, { missing?: string; imageinfo?: Array<{ url: string; thumburl?: string; extmetadata?: Record<string, { value?: string }> }> }> } };
  const page = Object.values(payload.query?.pages ?? {})[0]; const info = page?.imageinfo?.[0];
  if (!page || page.missing !== undefined || !info) throw new Error(`${title}: Wikimedia file not found`);
  const metadata = info.extmetadata ?? {}; const license = licenseFromMetadata(metadata);
  return { downloadUrl: info.thumburl ?? info.url, sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`, author: stripHtml(metadata.Artist?.value) || "Wikimedia Commons contributor", license };
}
function escapeXml(value: string) { return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[char] ?? char)); }
async function rebuildContact(review: ReviewDocument) {
  if (review.assets.length !== 16) throw new Error(`Expected 16 review entries, got ${review.assets.length}`);
  const overlays: sharp.OverlayOptions[] = []; const cellW = 300, cellH = 235;
  for (let i = 0; i < review.assets.length; i += 1) {
    const a = review.assets[i]; const x = (i % 4) * cellW; const y = Math.floor(i / 4) * cellH;
    const thumb = await sharp(resolve(PUBLIC_ROOT, a.thumbnail_path)).resize({ width: 260, height: 175, fit: "contain", background: "white" }).png().toBuffer();
    overlays.push({ input: thumb, left: x + 20, top: y + 10 });
    const title = a.selected_title.replace(/^File:/, "").slice(0, 42);
    const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="48"><rect width="280" height="48" fill="white"/><text x="140" y="19" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="700">${escapeXml(a.word)}</text><text x="140" y="38" text-anchor="middle" font-family="Arial,sans-serif" font-size="10">${escapeXml(title)}</text></svg>`);
    overlays.push({ input: label, left: x + 10, top: y + 184 });
  }
  await sharp({ create: { width: 1200, height: 940, channels: 3, background: "white" } }).composite(overlays).webp({ quality: 88 }).toFile(CONTACT_PATH);
}
async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const review = JSON.parse(await readFile(REVIEW_PATH, "utf8")) as ReviewDocument;
  if (review.status !== "pending_visual_review") throw new Error(`Expected pending review, got ${review.status}`);
  const byId = new Map(catalog.assets.map((asset) => [asset.id, asset])); const reviewById = new Map(review.assets.map((asset) => [asset.id, asset]));
  const now = new Date().toISOString();
  for (const replacement of replacements) {
    const asset = byId.get(replacement.id); const entry = reviewById.get(replacement.id);
    if (!asset || !entry) throw new Error(`${replacement.id}: staged record missing`);
    if (asset.review_status !== "pending_review" || entry.visual_review !== "pending") throw new Error(`${replacement.id}: refinement refuses approved content`);
    for (const relative of [asset.asset_path, asset.thumbnail_path]) if (relative) await rm(resolve(PUBLIC_ROOT, relative), { force: true });
    const source = await fetchCommonsFile(replacement.title); const response = await fetchRetry(source.downloadUrl); const sourceBuffer = Buffer.from(await response.arrayBuffer());
    const assetBuffer = await sharp(sourceBuffer).rotate().resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const thumbBuffer = await sharp(sourceBuffer).rotate().resize({ width: 320, height: 320, fit: "inside", withoutEnlargement: true }).webp({ quality: 76 }).toBuffer();
    if (!asset.asset_path || !asset.thumbnail_path) throw new Error(`${replacement.id}: local paths missing`);
    for (const [relative, buffer] of [[asset.asset_path, assetBuffer], [asset.thumbnail_path, thumbBuffer]] as const) { const target = resolve(PUBLIC_ROOT, relative); await mkdir(dirname(target), { recursive: true }); await writeFile(target, buffer); }
    asset.source_url = source.sourceUrl; asset.download_url = source.downloadUrl; asset.author = source.author; asset.license = source.license; asset.attribution_required = false;
    asset.attribution_text = `${source.author} · Wikimedia Commons · ${source.license === "CC0-1.0" ? "CC0 1.0" : "Public Domain"}`; asset.downloaded_at = now;
    asset.notes = [...(asset.notes ?? []), `Space chapter-four visual refinement: replaced weak candidate with exact source ${replacement.title}.`];
    entry.selected_title = replacement.title; entry.source_url = source.sourceUrl; entry.download_url = source.downloadUrl; entry.author = source.author; entry.license = source.license;
    entry.source_sha256 = hash(sourceBuffer); entry.asset_sha256 = hash(assetBuffer); entry.thumbnail_sha256 = hash(thumbBuffer);
    console.log(`Refined ${replacement.id} -> ${replacement.title} [${source.license}]`);
  }
  catalog.generated_at = now; review.generated_at = now;
  const validation = validateAssetCatalog(catalog); if (!validation.valid) throw new Error(`Refinement produced invalid catalog:\n${validation.errors.join("\n")}`);
  if (review.assets.some((entry) => entry.visual_review !== "pending")) throw new Error("Refinement must not approve Space photos");
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8"); await writeFile(REVIEW_PATH, `${JSON.stringify(review, null, 2)}\n`, "utf8"); await rebuildContact(review);
  console.log("Refined five weak Space chapter-four candidates; all 16 remain pending review.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
