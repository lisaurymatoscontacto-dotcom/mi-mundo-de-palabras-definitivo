import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DEMO_WORDS } from "../packages/core/src/index";
import { enqueueMissingAssetRecords, normalizeAssetWord } from "../packages/core/src/asset-queue";
import { validateAssetCatalog, type AssetCatalogDocument } from "../packages/core/src/assets";
import { CANDIDATE_WORDS } from "../packages/core/src/candidate.words";

const CATALOG_PATH = resolve("content/assets.catalog.json");

function argValue(name: string) {
  const prefix = `${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

const dryRun = process.argv.includes("--dry-run");
const limit = Number(argValue("--limit") ?? "25");
const selectedIds = new Set((argValue("--ids") ?? "").split(",").map((value) => value.trim()).filter(Boolean));

function knownDifficulty(category: string, word: string) {
  const normalized = normalizeAssetWord(word);
  const match = DEMO_WORDS.find((card) =>
    card.category === category && normalizeAssetWord(card.word) === normalized,
  );
  return match ? Math.max(match.readingDifficulty, match.writingDifficulty) : null;
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const validation = validateAssetCatalog(catalog);
  if (!validation.valid) throw new Error(`Invalid input catalog:\n${validation.errors.join("\n")}`);

  const queued = enqueueMissingAssetRecords(CANDIDATE_WORDS, catalog.assets, {
    limit: Number.isFinite(limit) && limit > 0 ? limit : 25,
    selectedIds,
  });

  for (const asset of queued) {
    const difficulty = knownDifficulty(asset.category, asset.word);
    if (difficulty !== null) {
      asset.difficulty = difficulty;
      asset.notes = (asset.notes ?? []).filter((note) => note !== "Dificultad pendiente de sincronizar desde el lexicón enriquecido.");
      asset.notes.push("Dificultad sincronizada desde la tarjeta piloto existente; el lexicón aprobado será la autoridad final.");
    }
  }

  if (!dryRun && queued.length) {
    catalog.assets.push(...queued);
    catalog.generated_at = new Date().toISOString();
    await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  }

  for (const asset of queued) {
    console.log(`${dryRun ? "Would queue" : "Queued"}: ${asset.id} (${asset.emoji_unicode ? `emoji ${asset.emoji_unicode}` : "photo/missing"}, difficulty=${asset.difficulty ?? "pending"})`);
  }
  console.log(`${dryRun ? "Dry run" : "Queue"} complete: ${queued.length} new concept(s); bounded limit=${Number.isFinite(limit) ? limit : 25}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
