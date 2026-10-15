import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateAssetCatalog, type AssetCatalogDocument } from "../packages/core/src/assets";

const CATALOG = resolve("content/assets.catalog.json");

async function main() {
  const document = JSON.parse(await readFile(CATALOG, "utf8")) as AssetCatalogDocument;
  const validation = validateAssetCatalog(document);
  if (!validation.valid) {
    throw new Error(`Asset catalog validation failed:\n${validation.errors.join("\n")}`);
  }

  const counts = document.assets.reduce<Record<string, number>>((result, asset) => {
    result[asset.review_status] = (result[asset.review_status] ?? 0) + 1;
    return result;
  }, {});
  console.log(`Asset catalog OK: ${document.assets.length} records`, counts);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
