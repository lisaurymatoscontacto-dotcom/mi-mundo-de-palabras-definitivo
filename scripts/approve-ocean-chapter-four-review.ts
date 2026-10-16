import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { canPublishAsset, validateAssetCatalog, type AssetCatalogDocument } from "../packages/core/src/assets";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const REVIEW_PATH = resolve("content/asset-reviews/ocean-chapter-four.json");

const expectedSources = new Map<string, string>([
  ["oceano.orca", "File:Killerwhales jumping.jpg"],
  ["oceano.narval", "File:Monodon monoceros pod.jpg"],
  ["oceano.morsa", "File:Walrus - Kamogawa Seaworld - 1.jpg"],
  ["oceano.manta", "File:Manta birostris-NOAA.jpg"],
  ["oceano.pezpayaso", "File:Common clownfish.jpg"],
  ["oceano.beluga", "File:Dl-13 beluga.jpg"],
  ["oceano.estrella", "File:Asterias rubens 307854603.jpg"],
  ["oceano.erizodemar", "File:Unidentified sea urchin (16952838097).jpg"],
  ["oceano.pelicano", "File:American White Pelican (5577371941).jpg"],
  ["oceano.manati", "File:Close up image of manatee underwater.jpg"],
  ["oceano.cachalote", "File:Sperm whale Tim Cole NMFS crop (cropped).jpg"],
  ["oceano.barracuda", "File:Sphyraena barracuda by NOAA.jpg"],
  ["oceano.albatros", "File:Short tailed albatross.jpg"],
  ["oceano.gaviota", "File:Larus hyperboreus-USFWS.jpg"],
  ["oceano.frailecillo", "File:Fratercula corniculataUSFWSSL0002774.jpg"],
  ["oceano.morena", "File:Gymnothorax eurostus.jpg"],
]);

interface ReviewAsset {
  id: string;
  word: string;
  selected_title: string;
  source_url: string;
  license: string;
  asset_path: string;
  thumbnail_path: string;
  source_sha256: string;
  asset_sha256: string;
  thumbnail_sha256: string;
  visual_review: "pending" | "approved" | "rejected";
}

interface ReviewDocument {
  generated_at: string;
  status: string;
  assets: ReviewAsset[];
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const review = JSON.parse(await readFile(REVIEW_PATH, "utf8")) as ReviewDocument;
  const validation = validateAssetCatalog(catalog);
  if (!validation.valid) throw new Error(`Catalog is invalid before approval:\n${validation.errors.join("\n")}`);
  if (review.status !== "pending_visual_review") throw new Error(`Expected pending_visual_review, got ${review.status}`);
  if (review.assets.length !== expectedSources.size) throw new Error(`Expected exactly ${expectedSources.size} reviewed photos, got ${review.assets.length}`);

  const catalogById = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  const seen = new Set<string>();
  for (const item of review.assets) {
    const expectedTitle = expectedSources.get(item.id);
    if (!expectedTitle) throw new Error(`Unexpected photo in Ocean 4 review: ${item.id}`);
    if (seen.has(item.id)) throw new Error(`Duplicate reviewed photo: ${item.id}`);
    seen.add(item.id);
    if (item.selected_title !== expectedTitle) throw new Error(`${item.id}: expected ${expectedTitle}, got ${item.selected_title}`);
    if (item.visual_review !== "pending") throw new Error(`${item.id}: expected pending visual review`);
    if (!item.asset_path || !item.thumbnail_path || !item.source_url) throw new Error(`${item.id}: missing local/provenance metadata`);
    if (!item.source_sha256 || !item.asset_sha256 || !item.thumbnail_sha256) throw new Error(`${item.id}: missing integrity hashes`);
    if (item.license !== "PUBLIC-DOMAIN" && item.license !== "CC0-1.0") throw new Error(`${item.id}: unacceptable photo license ${item.license}`);

    const asset = catalogById.get(item.id);
    if (!asset) throw new Error(`${item.id}: catalog record missing`);
    if (asset.asset_type !== "photo") throw new Error(`${item.id}: expected photo asset`);
    if (asset.review_status !== "pending_review") throw new Error(`${item.id}: catalog status must be pending_review before approval`);
    if (!asset.verified || asset.difficulty === null || !asset.downloaded_at) throw new Error(`${item.id}: incomplete verified metadata`);
    if (asset.asset_path !== item.asset_path || asset.thumbnail_path !== item.thumbnail_path || asset.source_url !== item.source_url) {
      throw new Error(`${item.id}: review manifest and catalog provenance diverge`);
    }
    if (asset.license !== item.license) throw new Error(`${item.id}: license differs between manifest and catalog`);

    asset.review_status = "approved";
    asset.notes = [
      ...(asset.notes ?? []),
      "Ocean chapter-four editorial review: the selected photograph directly depicts the written concept, with no unrelated dominant subject; source, local files, integrity hashes and zero-obligation license were reviewed before approval.",
    ];
    if (!canPublishAsset(asset)) throw new Error(`${item.id}: approved asset still fails publishability checks`);
    item.visual_review = "approved";
  }

  for (const id of expectedSources.keys()) if (!seen.has(id)) throw new Error(`Expected reviewed photo missing: ${id}`);
  review.status = "approved";
  review.generated_at = new Date().toISOString();
  catalog.generated_at = review.generated_at;
  const after = validateAssetCatalog(catalog);
  if (!after.valid) throw new Error(`Catalog became invalid after approval:\n${after.errors.join("\n")}`);
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await writeFile(REVIEW_PATH, `${JSON.stringify(review, null, 2)}\n`, "utf8");
  console.log(`Approved ${seen.size} Ocean chapter-four photos after explicit guarded review.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
