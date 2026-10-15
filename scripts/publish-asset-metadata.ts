import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { validateAssetCatalog, type AssetCatalogDocument } from "../packages/core/src/assets";

const SOURCE = resolve("content/assets.catalog.json");
const OUTPUT = resolve("apps/web/public/content/assets.catalog.json");

async function main() {
  const raw = await readFile(SOURCE, "utf8");
  const document = JSON.parse(raw) as AssetCatalogDocument;
  const validation = validateAssetCatalog(document);
  if (!validation.valid) {
    throw new Error(`Cannot publish invalid asset catalog:\n${validation.errors.join("\n")}`);
  }

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, raw, "utf8");
  console.log(`Published ${document.assets.length} asset metadata records -> apps/web/public/content/assets.catalog.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
