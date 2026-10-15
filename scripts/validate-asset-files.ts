import { access, readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { validateAssetCatalog, type AssetCatalogDocument, type AssetRecord } from "../packages/core/src/assets";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const PUBLIC_ROOT = resolve("apps/web/public/content");

function safeLocalPath(relativePath: string, asset: AssetRecord) {
  const fullPath = resolve(PUBLIC_ROOT, relativePath);
  const rootPrefix = PUBLIC_ROOT.endsWith(sep) ? PUBLIC_ROOT : `${PUBLIC_ROOT}${sep}`;
  if (!fullPath.startsWith(rootPrefix)) {
    throw new Error(`${asset.id}: asset path escapes public content root: ${relativePath}`);
  }
  return fullPath;
}

async function assertFile(relativePath: string, asset: AssetRecord, label: string) {
  const fullPath = safeLocalPath(relativePath, asset);
  try {
    await access(fullPath);
  } catch {
    throw new Error(`${asset.id}: ${label} is missing: ${relativePath}`);
  }
  return fullPath;
}

async function validateUsableFile(asset: AssetRecord) {
  if (asset.asset_type === "missing") return;
  if (!asset.asset_path) throw new Error(`${asset.id}: usable asset has no asset_path`);

  const fullPath = await assertFile(asset.asset_path, asset, "asset file");
  const extension = extname(fullPath).toLocaleLowerCase("en");

  if (asset.asset_type === "emoji") {
    if (extension !== ".svg") throw new Error(`${asset.id}: bundled emoji must be SVG`);
    const prefix = (await readFile(fullPath, "utf8")).slice(0, 256);
    if (!/<svg\b/i.test(prefix)) throw new Error(`${asset.id}: bundled emoji file is not valid SVG content`);
  }

  if (asset.asset_type === "photo") {
    if (extension !== ".webp") throw new Error(`${asset.id}: optimized photo must be WebP`);
    if (!asset.thumbnail_path) throw new Error(`${asset.id}: optimized photo requires thumbnail_path`);
    const thumbnail = await assertFile(asset.thumbnail_path, asset, "photo thumbnail");
    if (extname(thumbnail).toLocaleLowerCase("en") !== ".webp") {
      throw new Error(`${asset.id}: photo thumbnail must be WebP`);
    }
  }
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const metadata = validateAssetCatalog(catalog);
  if (!metadata.valid) throw new Error(`Invalid asset catalog:\n${metadata.errors.join("\n")}`);

  const usable = catalog.assets.filter((asset) => asset.asset_type !== "missing");
  for (const asset of usable) await validateUsableFile(asset);

  const approved = catalog.assets.filter((asset) => asset.review_status === "approved").length;
  console.log(`Asset files OK: ${usable.length} local usable asset(s), ${approved} approved.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
