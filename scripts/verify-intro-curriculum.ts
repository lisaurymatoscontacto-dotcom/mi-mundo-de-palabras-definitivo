import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DEMO_WORDS } from "../packages/core/src/index";
import { CURRICULUM_CHAPTERS } from "../packages/core/src/curriculum";
import type { AssetCatalogDocument } from "../packages/core/src/assets";

const catalog = JSON.parse(
  await readFile(resolve("content/assets.catalog.json"), "utf8"),
) as AssetCatalogDocument;

const approved = new Set(
  catalog.assets
    .filter((asset) => asset.review_status === "approved")
    .map((asset) => `${asset.category}\u0000${asset.word}`),
);
const runtimeCards = new Set(DEMO_WORDS.map((card) => `${card.category}\u0000${card.word}`));

const introductory = CURRICULUM_CHAPTERS.slice(0, 12);
if (introductory.length !== 12 || !introductory.every((chapter) => chapter.chapterNumber === 1)) {
  throw new Error("Expected the first twelve curriculum entries to be the twelve chapter-one worlds.");
}

for (const chapter of introductory) {
  if (chapter.newWords.length !== 20 || chapter.targetSize !== 20) {
    throw new Error(`${chapter.label}: expected exactly 20 introductory concepts.`);
  }
  const missingRuntime = chapter.newWords.filter((word) => !runtimeCards.has(`${chapter.category}\u0000${word}`));
  const missingAssets = chapter.newWords.filter((word) => !approved.has(`${chapter.category}\u0000${word}`));
  if (missingRuntime.length) {
    throw new Error(`${chapter.label}: missing transition cards: ${missingRuntime.join(", ")}`);
  }
  if (missingAssets.length) {
    throw new Error(`${chapter.label}: missing approved visual assets: ${missingAssets.join(", ")}`);
  }
  console.log(`✓ ${chapter.label}: 20/20 runtime cards and approved assets`);
}

console.log("Introductory curriculum verified: 12 chapters, 240 approved card placements.");
