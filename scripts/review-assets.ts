import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  canPublishAsset,
  validateAssetCatalog,
  type AssetCatalogDocument,
  type AssetReviewStatus,
} from "../packages/core/src/assets";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const ALLOWED_STATUSES = new Set<AssetReviewStatus>(["approved", "pending_review", "rejected", "missing"]);

function argValue(name: string) {
  const prefix = `${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const ids = (argValue("--ids") ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  const status = argValue("--status") as AssetReviewStatus | undefined;
  const note = argValue("--note")?.trim();

  if (!ids.length) throw new Error("Use --ids=id1,id2 to select assets explicitly.");
  if (!status || !ALLOWED_STATUSES.has(status)) {
    throw new Error("Use --status=approved|pending_review|rejected|missing.");
  }

  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const before = validateAssetCatalog(catalog);
  if (!before.valid) throw new Error(`Invalid input catalog:\n${before.errors.join("\n")}`);

  const byId = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  for (const id of ids) {
    const asset = byId.get(id);
    if (!asset) throw new Error(`Unknown asset id: ${id}`);

    if (status === "approved") {
      // Temporarily set the requested state, then use the same production gate that
      // publishing relies on. This prevents editorial approval from bypassing legal,
      // provenance or offline requirements.
      const previous = asset.review_status;
      asset.review_status = "approved";
      if (!canPublishAsset(asset)) {
        asset.review_status = previous;
        throw new Error(`${id} cannot be approved until validation, provenance and local-file requirements pass.`);
      }
    } else if (status === "missing") {
      if (asset.asset_type !== "missing") {
        throw new Error(`${id}: review_status=missing requires asset_type=missing; change the asset record deliberately first.`);
      }
      asset.review_status = "missing";
    } else {
      asset.review_status = status;
    }

    if (note) asset.notes = [...new Set([...(asset.notes ?? []), note])];
    console.log(`${id} -> ${asset.review_status}`);
  }

  const after = validateAssetCatalog(catalog);
  if (!after.valid) throw new Error(`Review produced invalid catalog:\n${after.errors.join("\n")}`);

  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
