import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { validateAssetCatalog, type AssetCatalogDocument, type AssetLicenseId } from "../packages/core/src/assets";

const REPO = "https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo";
const TITLE = "File:Rotunda in Mammoth Cave, NPS Photo (2649cd25-059e-442a-a255-329df533ee5f).jpg";
const ID = "naturaleza.cueva";
const CATALOG_PATH = resolve("content/assets.catalog.json");
const REVIEW_PATH = resolve("content/asset-reviews/chapter-five-photos.json");
const PUBLIC_ROOT = resolve("apps/web/public/content");
const API = "https://commons.wikimedia.org/w/api.php";

function strip(value: string | undefined) {
  return (value ?? "").replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}
function sha256(bytes: Buffer) { return createHash("sha256").update(bytes).digest("hex"); }
function bool(value: string | undefined) { return ["true", "1", "yes"].includes(strip(value).toLowerCase()); }
function licenseOf(metadata: Record<string, { value?: string }> | undefined): "CC0-1.0" | "PUBLIC-DOMAIN" | null {
  const raw = `${strip(metadata?.LicenseShortName?.value)} ${strip(metadata?.UsageTerms?.value)}`.toLowerCase();
  if (raw.includes("cc0") || raw.includes("creative commons zero")) return "CC0-1.0";
  if (raw.includes("public domain") || raw.includes("released into the public domain")) return "PUBLIC-DOMAIN";
  return null;
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const review = JSON.parse(await readFile(REVIEW_PATH, "utf8")) as any;
  const valid = validateAssetCatalog(catalog);
  if (!valid.valid) throw new Error(valid.errors.join("\n"));
  if (review.status !== "pending_visual_review" || review.assets?.length !== 25) throw new Error("Expected the 25-item pending chapter-five review batch");
  if (review.assets.some((item: any) => item.visual_review !== "pending")) throw new Error("All chapter-five visual decisions must still be pending");
  const asset = catalog.assets.find((item) => item.id === ID);
  const reviewEntry = review.assets.find((item: any) => item.id === ID);
  if (!asset || !reviewEntry || asset.review_status !== "pending_review") throw new Error(`${ID} is not a pending staged photo`);
  if (reviewEntry.selected_title !== "File:Deep Cave (51202093762).jpg") throw new Error(`Unexpected current cave source: ${reviewEntry.selected_title}`);

  const params = new URLSearchParams({ action: "query", format: "json", origin: "*", prop: "imageinfo", iiprop: "url|mime|extmetadata", iiurlwidth: "1400", titles: TITLE,
    iiextmetadatafilter: "LicenseShortName|UsageTerms|Artist|Credit|Attribution|AttributionRequired|Restrictions|NonFree" });
  const response = await fetch(`${API}?${params}`, { headers: { "User-Agent": `MiMundoDePalabras/0.1 (${REPO})` } });
  if (!response.ok) throw new Error(`Wikimedia API HTTP ${response.status}`);
  const payload = await response.json() as any;
  const page = Object.values(payload.query?.pages ?? {})[0] as any;
  const info = page?.imageinfo?.[0];
  if (!page || page.missing !== undefined || !info) throw new Error("Exact Rotunda source was not found");
  if (info.mime && !/^image\/(?:jpeg|png|webp)$/i.test(info.mime)) throw new Error(`Unsupported MIME ${info.mime}`);
  const metadata = info.extmetadata;
  if (bool(metadata?.NonFree?.value) || strip(metadata?.Restrictions?.value)) throw new Error("Rotunda source is restricted/non-free");
  const license = licenseOf(metadata);
  if (!license) throw new Error("Rotunda source is not explicitly CC0/Public Domain");
  const downloadUrl = info.thumburl ?? info.url;
  if (!downloadUrl) throw new Error("Rotunda source has no download URL");
  const photo = await fetch(downloadUrl, { headers: { "User-Agent": `MiMundoDePalabras/0.1 (${REPO})` } });
  if (!photo.ok) throw new Error(`Rotunda download HTTP ${photo.status}`);
  const sourceBytes = Buffer.from(await photo.arrayBuffer());
  const assetBytes = await sharp(sourceBytes).rotate().resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer();
  const thumbBytes = await sharp(sourceBytes).rotate().resize({ width: 320, height: 320, fit: "inside", withoutEnlargement: true }).webp({ quality: 76, effort: 4 }).toBuffer();
  await writeFile(resolve(PUBLIC_ROOT, reviewEntry.asset_path), assetBytes);
  await writeFile(resolve(PUBLIC_ROOT, reviewEntry.thumbnail_path), thumbBytes);

  const author = strip(metadata?.Artist?.value) || strip(metadata?.Credit?.value) || "U.S. National Park Service";
  const attributionRequired = bool(metadata?.AttributionRequired?.value);
  const attributionText = strip(metadata?.Attribution?.value) || `${author} · Wikimedia Commons · ${license === "CC0-1.0" ? "CC0 1.0" : "Public Domain"}`;
  const sourceUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`;
  const now = new Date().toISOString();
  Object.assign(asset, {
    source: "Wikimedia Commons", source_url: sourceUrl, download_url: downloadUrl, author, license: license as AssetLicenseId,
    attribution_required: attributionRequired, attribution_text: attributionText, verified: true, downloaded_at: now, review_status: "pending_review",
    notes: ["Chapter-five staging: explicit CC0/Public Domain metadata verified; visual approval remains a separate guarded step.", `Pinned final Wikimedia source: ${page.title}`, "Final cave refinement uses a direct cave-room photograph without a named human subject in the source description."],
  });
  Object.assign(reviewEntry, {
    query: null, selected_title: page.title, source_url: sourceUrl, download_url: downloadUrl, author, license: license as AssetLicenseId,
    source_sha256: sha256(sourceBytes), asset_sha256: sha256(assetBytes), thumbnail_sha256: sha256(thumbBytes), visual_review: "pending",
  });
  catalog.generated_at = now;
  review.generated_at = now;
  const after = validateAssetCatalog(catalog);
  if (!after.valid) throw new Error(after.errors.join("\n"));
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await writeFile(REVIEW_PATH, `${JSON.stringify(review, null, 2)}\n`, "utf8");
  console.log(`Final cave candidate staged: ${page.title} [${license}]; chapter-five batch remains pending.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
