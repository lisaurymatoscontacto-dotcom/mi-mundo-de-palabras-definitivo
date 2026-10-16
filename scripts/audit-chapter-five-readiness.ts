import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { CURRICULUM_CHAPTERS } from "../packages/core/src/curriculum";
import { DEMO_WORDS } from "../packages/core/src/index";
import { contentSlug } from "../packages/core/src/asset-production";
import { canPublishAsset, validateAssetCatalog, type AssetCatalogDocument } from "../packages/core/src/assets";

const TARGET_CATEGORIES = ["Animales", "Casa", "Comida", "Naturaleza"] as const;
const CATALOG_PATH = resolve("content/assets.catalog.json");
const REPORT_PATH = resolve("content/audits/chapter-five-readiness.json");

function cardKey(category: string, word: string) {
  return `${category}\u0000${word}`;
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const validation = validateAssetCatalog(catalog);
  if (!validation.valid) throw new Error(`Invalid asset catalog:\n${validation.errors.join("\n")}`);

  const cards = new Map(DEMO_WORDS.map((card) => [cardKey(card.category, card.word), card]));
  const assets = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  const worlds = TARGET_CATEGORIES.map((category) => {
    const chapter = CURRICULUM_CHAPTERS.find((candidate) => candidate.category === category && candidate.chapterNumber === 5);
    if (!chapter) throw new Error(`Missing ${category} 5 curriculum chapter`);
    const concepts = chapter.newWords.map((word) => {
      const id = `${contentSlug(category)}.${contentSlug(word)}`;
      const card = cards.get(cardKey(category, word));
      const asset = assets.get(id);
      return {
        id,
        word,
        card_published: Boolean(card),
        asset_present: Boolean(asset),
        asset_type: asset?.asset_type ?? null,
        asset_review_status: asset?.review_status ?? null,
        asset_publishable: asset ? canPublishAsset(asset) : false,
        ready: Boolean(card && asset && canPublishAsset(asset)),
      };
    });
    return {
      category,
      chapter_id: chapter.id,
      expected_new_words: chapter.newWords.length,
      ready: concepts.filter((item) => item.ready).length,
      cards_published: concepts.filter((item) => item.card_published).length,
      assets_publishable: concepts.filter((item) => item.asset_publishable).length,
      concepts,
    };
  });

  const total = worlds.reduce((sum, world) => sum + world.expected_new_words, 0);
  const ready = worlds.reduce((sum, world) => sum + world.ready, 0);
  const cardsPublished = worlds.reduce((sum, world) => sum + world.cards_published, 0);
  const assetsPublishable = worlds.reduce((sum, world) => sum + world.assets_publishable, 0);
  const report = {
    generated_at: new Date().toISOString(),
    scope: "Curriculum chapter 5 readiness for Animales, Casa, Comida and Naturaleza",
    readiness_rule: "A concept is ready only when an explicitly published editorial card and a publishable approved local asset both exist.",
    total_concepts: total,
    ready_concepts: ready,
    ready_percent: Math.round((ready / total) * 1000) / 10,
    cards_published: cardsPublished,
    assets_publishable: assetsPublishable,
    worlds,
  };
  await mkdir(dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
