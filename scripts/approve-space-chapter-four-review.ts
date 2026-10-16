import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { canPublishAsset, validateAssetCatalog, type AssetCatalogDocument } from "../packages/core/src/assets";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const REVIEW_PATH = resolve("content/asset-reviews/space-chapter-four.json");

const approvedSources = new Map<string, string>([
  ["espacio.mercurio", "File:Mercury in true color.jpg"],
  ["espacio.venus", "File:Venus globe.jpg"],
  ["espacio.marte", "File:Mars Valles Marineris.jpeg"],
  ["espacio.jupiter", "File:Portrait of Jupiter from Cassini.jpg"],
  ["espacio.saturno", "File:Saturn during Equinox.jpg"],
  ["espacio.urano", "File:Uranus Final Image.jpg"],
  ["espacio.neptuno", "File:Neptune Full.jpg"],
  ["espacio.pluton", "File:Pluto in True Color - High-Res.jpg"],
  ["espacio.ceres", "File:Dawn - Ceres.png"],
  ["espacio.andromeda", "File:Andromeda galaxy.jpg"],
  ["espacio.nebulosa", "File:Orion Nebula - Hubble 2006 mosaic.jpg"],
  ["espacio.rover", "File:Mars 'Curiosity' Rover, Spacecraft Assembly Facility, Pasadena, California (2011).jpg"],
  ["espacio.estacion", "File:International Space Station after undocking of STS-132.jpg"],
  ["espacio.transbordador", "File:STS 114 day before launch.jpg"],
  ["espacio.aurora", "File:Aurora Borealis.jpg"],
]);
const rejected = new Map<string, string>([["espacio.supernova", "File:Crab Nebula.jpg"]]);

interface ReviewAsset {
  id: string; word: string; selected_title: string; source_url: string; license: string; asset_path: string; thumbnail_path: string;
  source_sha256: string; asset_sha256: string; thumbnail_sha256: string; visual_review: "pending" | "approved" | "rejected";
}
interface ReviewDocument { generated_at: string; status: string; assets: ReviewAsset[]; }

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const review = JSON.parse(await readFile(REVIEW_PATH, "utf8")) as ReviewDocument;
  const before = validateAssetCatalog(catalog);
  if (!before.valid) throw new Error(`Invalid catalog before Space review:\n${before.errors.join("\n")}`);
  if (review.status !== "pending_visual_review" || review.assets.length !== 16) throw new Error("Space review must contain exactly 16 pending candidates");
  const byId = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  let approved = 0, rejectedCount = 0;
  for (const item of review.assets) {
    const expectedApproved = approvedSources.get(item.id);
    const expectedRejected = rejected.get(item.id);
    if (!expectedApproved && !expectedRejected) throw new Error(`Unexpected Space review item: ${item.id}`);
    const expectedTitle = expectedApproved ?? expectedRejected!;
    if (item.selected_title !== expectedTitle) throw new Error(`${item.id}: expected ${expectedTitle}, got ${item.selected_title}`);
    if (item.visual_review !== "pending") throw new Error(`${item.id}: expected pending visual review`);
    if (item.license !== "PUBLIC-DOMAIN" && item.license !== "CC0-1.0") throw new Error(`${item.id}: unacceptable license ${item.license}`);
    if (!item.asset_path || !item.thumbnail_path || !item.source_url || !item.source_sha256 || !item.asset_sha256 || !item.thumbnail_sha256) throw new Error(`${item.id}: incomplete review provenance/integrity metadata`);
    const asset = byId.get(item.id);
    if (!asset || asset.asset_type !== "photo" || asset.review_status !== "pending_review" || !asset.verified) throw new Error(`${item.id}: expected verified pending photo in catalog`);
    if (asset.source_url !== item.source_url || asset.asset_path !== item.asset_path || asset.thumbnail_path !== item.thumbnail_path || asset.license !== item.license) throw new Error(`${item.id}: manifest/catalog mismatch`);
    if (expectedApproved) {
      asset.review_status = "approved";
      asset.notes = [...(asset.notes ?? []), "Space chapter-four editorial review: selected image directly represents the named body/object/phenomenon; source, local files, hashes and zero-obligation license verified before approval."];
      if (!canPublishAsset(asset)) throw new Error(`${item.id}: photo failed publishability after approval`);
      item.visual_review = "approved"; approved += 1;
    } else {
      asset.review_status = "rejected";
      asset.notes = [...(asset.notes ?? []), "Space chapter-four editorial rejection: Crab Nebula is a supernova remnant, not a direct depiction of the SUPERNOVA event; excluded to preserve one-word/one-concept visual precision."];
      item.visual_review = "rejected"; rejectedCount += 1;
    }
  }
  if (approved !== 15 || rejectedCount !== 1) throw new Error(`Expected 15 approved + 1 rejected, got ${approved} + ${rejectedCount}`);
  const now = new Date().toISOString(); review.generated_at = now; review.status = "approved_with_one_rejection"; catalog.generated_at = now;
  const after = validateAssetCatalog(catalog); if (!after.valid) throw new Error(`Catalog invalid after Space review:\n${after.errors.join("\n")}`);
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8"); await writeFile(REVIEW_PATH, `${JSON.stringify(review, null, 2)}\n`, "utf8");
  console.log("Space chapter-four review complete: 15 approved, SUPERNOVA rejected for concept mismatch.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
