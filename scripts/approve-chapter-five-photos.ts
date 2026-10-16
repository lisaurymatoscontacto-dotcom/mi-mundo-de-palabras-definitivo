import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  canPublishAsset,
  validateAssetCatalog,
  type AssetCatalogDocument,
  type AssetLicenseId,
} from "../packages/core/src/assets";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const REVIEW_PATH = resolve("content/asset-reviews/chapter-five-photos.json");
const PUBLIC_ROOT = resolve("apps/web/public/content");
const USER_AGENT = "MiMundoDePalabras/0.1 (https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo)";
const REQUEST_GAP_MS = 900;
let lastNetworkRequestAt = 0;

const EXPECTED = new Map<string, { title: string; license: AssetLicenseId }>([
  ["casa.nevera", { title: "File:Refrigeradora en casa.jpg", license: "CC0-1.0" }],
  ["casa.cafetera", { title: "File:Coffee maker 2024.jpg", license: "CC0-1.0" }],
  ["casa.microondas", { title: "File:Microwave oven \"Erisson\".jpg", license: "CC0-1.0" }],
  ["casa.lavadora", { title: "File:Washing machine (23745702205).jpg", license: "CC0-1.0" }],
  ["casa.sarten", { title: "File:Cooking frying pan.jpg", license: "CC0-1.0" }],
  ["comida.pescado", { title: "File:Fried Fish Fillet.JPG", license: "CC0-1.0" }],
  ["comida.salchicha", { title: "File:Sausage links.jpg", license: "CC0-1.0" }],
  ["comida.hummus", { title: "File:Hummus dish on a plate.jpg", license: "CC0-1.0" }],
  ["comida.churro", { title: "File:Churros 001.jpg", license: "CC0-1.0" }],
  ["naturaleza.lago", { title: "File:Yellowstone Lake from Lake Butte Overlook (027f0dda-1dd8-b71b-0b83-b097b77d44e5).jpg", license: "PUBLIC-DOMAIN" }],
  ["naturaleza.arena", { title: "File:Close-up zand foto 1.JPG", license: "CC0-1.0" }],
  ["naturaleza.bosque", { title: "File:Forest (1748a47b03574600879494054fb7cec4).JPG", license: "PUBLIC-DOMAIN" }],
  ["naturaleza.cueva", { title: "File:Rotunda in Mammoth Cave, NPS Photo (2649cd25-059e-442a-a255-329df533ee5f).jpg", license: "PUBLIC-DOMAIN" }],
  ["naturaleza.cascada", { title: "File:Buttermilk Falls, on the New Jersey side of the Delaware River. (4e60164f-1dd8-b71b-0bcd-a1953bd6a54a).jpg", license: "PUBLIC-DOMAIN" }],
  ["naturaleza.valle", { title: "File:San Juan Valley.jpg", license: "CC0-1.0" }],
  ["naturaleza.selva", { title: "File:Boardwalk on Rain Forest Nature Trail (57f57280-35a8-4750-88a2-3d7651d441b3).JPG", license: "PUBLIC-DOMAIN" }],
  ["naturaleza.prado", { title: "File:Meadow (32e92a130408490cab02a896c4d15f75).JPG", license: "PUBLIC-DOMAIN" }],
  ["naturaleza.acantilado", { title: "File:Acadia National Park, Otter Cliff.jpg", license: "PUBLIC-DOMAIN" }],
  ["naturaleza.canyon", { title: "File:Rio Alhama canyon, Alhama de Granada, Andalusia, Spain.jpg", license: "CC0-1.0" }],
  ["naturaleza.glaciar", { title: "File:Brady Glacier Mt. La Perouse.jpg", license: "PUBLIC-DOMAIN" }],
  ["naturaleza.iceberg", { title: "File:Front row Iceberg-Chugach-KK-005 (52503186215).jpg", license: "PUBLIC-DOMAIN" }],
  ["naturaleza.crater", { title: "File:Barringer Meteor Crater, Arizona.jpg", license: "PUBLIC-DOMAIN" }],
  ["naturaleza.geiser", { title: "File:Riverside Geyser eruption (38396853531).jpg", license: "PUBLIC-DOMAIN" }],
  ["naturaleza.barro", { title: "File:Close-up of mud.jpg", license: "CC0-1.0" }],
  ["naturaleza.cuarzo", { title: "File:Quartz (GeoDIL number - 2254).jpg", license: "CC0-1.0" }],
]);

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
  visual_review: "pending" | "approved" | "rejected";
  review_note?: string;
};
type ReviewDocument = {
  generated_at: string;
  status: "pending_visual_review" | "approved";
  assets: ReviewEntry[];
};

function sha256(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}
function delay(ms: number) {
  return new Promise<void>((resolveDelay) => setTimeout(resolveDelay, ms));
}
async function fetchSource(url: string, id: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const wait = REQUEST_GAP_MS - (Date.now() - lastNetworkRequestAt);
    if (wait > 0) await delay(wait);
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      lastNetworkRequestAt = Date.now();
      const retryable = response.status === 429 || response.status === 408 || response.status >= 500;
      if (!retryable || attempt === 4) return response;
      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      await delay(retryAfter > 0 ? Math.min(retryAfter * 1000, 30_000) : Math.min(1400 * 2 ** attempt, 12_000));
    } catch (error) {
      if (attempt === 4) throw error;
      await delay(Math.min(1400 * 2 ** attempt, 12_000));
    }
  }
  throw new Error(`${id}: source verification exhausted retries`);
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const review = JSON.parse(await readFile(REVIEW_PATH, "utf8")) as ReviewDocument;
  const initial = validateAssetCatalog(catalog);
  if (!initial.valid) throw new Error(`Invalid input catalog:\n${initial.errors.join("\n")}`);
  if (EXPECTED.size !== 25) throw new Error(`Approval manifest must contain exactly 25 items, got ${EXPECTED.size}`);
  if (review.status !== "pending_visual_review" || review.assets.length !== 25) {
    throw new Error("Expected the exact 25-item pending chapter-five photo batch");
  }
  if (review.assets.some((item) => item.visual_review !== "pending")) {
    throw new Error("Approval refuses to run after any chapter-five visual decision has already changed");
  }
  const reviewIds = new Set(review.assets.map((item) => item.id));
  if (reviewIds.size !== 25 || [...EXPECTED.keys()].some((id) => !reviewIds.has(id))) {
    throw new Error("Review batch IDs do not exactly match the guarded approval manifest");
  }

  const byCatalogId = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  for (const entry of review.assets) {
    const expectation = EXPECTED.get(entry.id);
    if (!expectation) throw new Error(`${entry.id}: not present in guarded approval manifest`);
    if (entry.selected_title !== expectation.title) {
      throw new Error(`${entry.id}: source title changed; expected ${expectation.title}, got ${entry.selected_title}`);
    }
    if (entry.license !== expectation.license) {
      throw new Error(`${entry.id}: review license changed; expected ${expectation.license}, got ${entry.license}`);
    }
    const asset = byCatalogId.get(entry.id);
    if (!asset) throw new Error(`${entry.id}: missing catalog record`);
    if (asset.review_status !== "pending_review" || asset.asset_type !== "photo") {
      throw new Error(`${entry.id}: catalog record must still be a pending photo`);
    }
    if (asset.word !== entry.word || asset.category !== entry.category || asset.license !== expectation.license) {
      throw new Error(`${entry.id}: catalog identity/license no longer matches staged review record`);
    }
    if (asset.source_url !== entry.source_url || asset.download_url !== entry.download_url || asset.asset_path !== entry.asset_path || asset.thumbnail_path !== entry.thumbnail_path) {
      throw new Error(`${entry.id}: catalog provenance/path no longer matches review record`);
    }
    if (!/^[a-f0-9]{64}$/.test(entry.source_sha256) || !/^[a-f0-9]{64}$/.test(entry.asset_sha256) || !/^[a-f0-9]{64}$/.test(entry.thumbnail_sha256)) {
      throw new Error(`${entry.id}: malformed SHA-256 metadata`);
    }

    const localAsset = await readFile(resolve(PUBLIC_ROOT, entry.asset_path));
    const localThumb = await readFile(resolve(PUBLIC_ROOT, entry.thumbnail_path));
    if (sha256(localAsset) !== entry.asset_sha256) throw new Error(`${entry.id}: local WebP hash differs from reviewed hash`);
    if (sha256(localThumb) !== entry.thumbnail_sha256) throw new Error(`${entry.id}: local thumbnail hash differs from reviewed hash`);

    const sourceResponse = await fetchSource(entry.download_url, entry.id);
    if (!sourceResponse.ok) throw new Error(`${entry.id}: source verification returned HTTP ${sourceResponse.status}`);
    const sourceBytes = Buffer.from(await sourceResponse.arrayBuffer());
    if (sha256(sourceBytes) !== entry.source_sha256) {
      throw new Error(`${entry.id}: upstream source bytes differ from the staged/reviewed source hash`);
    }
    console.log(`Verified reviewed source + local hashes: ${entry.id}`);
  }

  const approvedAt = new Date().toISOString();
  const reviewNote = "Chapter-five editorial approval: exact source, license, source bytes, local WebP and thumbnail were revalidated; the selected visual directly represents the written concept and passed the one-word/one-concept policy.";
  for (const entry of review.assets) {
    const asset = byCatalogId.get(entry.id)!;
    entry.visual_review = "approved";
    entry.review_note = reviewNote;
    asset.review_status = "approved";
    asset.verified = true;
    asset.notes = [...(asset.notes ?? []), reviewNote];
    if (!canPublishAsset(asset)) throw new Error(`${entry.id}: asset still fails publishability after approval`);
  }
  review.status = "approved";
  review.generated_at = approvedAt;
  catalog.generated_at = approvedAt;
  const finalValidation = validateAssetCatalog(catalog);
  if (!finalValidation.valid) throw new Error(`Approved catalog is invalid:\n${finalValidation.errors.join("\n")}`);
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await writeFile(REVIEW_PATH, `${JSON.stringify(review, null, 2)}\n`, "utf8");
  console.log("Approved exactly 25 chapter-five photos after guarded source/hash/editorial validation.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
