import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DEMO_WORDS } from "../packages/core/src/index";
import { CURRICULUM_CHAPTERS } from "../packages/core/src/curriculum";
import type { AssetCatalogDocument } from "../packages/core/src/assets";

function argValue(name: string) {
  const prefix = `${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const requested = Number(argValue("--chapters") ?? "12");
  if (!Number.isInteger(requested) || requested < 1 || requested > CURRICULUM_CHAPTERS.length) {
    throw new Error(`--chapters must be an integer between 1 and ${CURRICULUM_CHAPTERS.length}`);
  }

  const catalog = JSON.parse(
    await readFile(resolve("content/assets.catalog.json"), "utf8"),
  ) as AssetCatalogDocument;

  const approved = new Set(
    catalog.assets
      .filter((asset) => asset.review_status === "approved")
      .map((asset) => `${asset.category}\u0000${asset.word}`),
  );
  const runtime = new Set(DEMO_WORDS.map((card) => `${card.category}\u0000${card.word}`));

  for (const chapter of CURRICULUM_CHAPTERS.slice(0, requested)) {
    const missingNewCards = chapter.newWords.filter((word) => !runtime.has(`${chapter.category}\u0000${word}`));
    const missingNewAssets = chapter.newWords.filter((word) => !approved.has(`${chapter.category}\u0000${word}`));
    if (missingNewCards.length) throw new Error(`${chapter.label}: missing new runtime cards: ${missingNewCards.join(", ")}`);
    if (missingNewAssets.length) throw new Error(`${chapter.label}: missing approved new assets: ${missingNewAssets.join(", ")}`);

    const usableReview = chapter.reviewPool.filter((word) =>
      runtime.has(`${chapter.category}\u0000${word}`) && approved.has(`${chapter.category}\u0000${word}`),
    );
    if (usableReview.length < chapter.reviewCount) {
      throw new Error(`${chapter.label}: needs ${chapter.reviewCount} review cards but only ${usableReview.length} approved review concepts are available.`);
    }

    if (chapter.newWords.length + chapter.reviewCount !== chapter.targetSize || chapter.targetSize !== 20) {
      throw new Error(`${chapter.label}: invalid 20-card accounting (${chapter.newWords.length} new + ${chapter.reviewCount} review).`);
    }

    console.log(`✓ ${chapter.label}: ${chapter.newWords.length} new + ${chapter.reviewCount} review = 20 ready cards`);
  }

  console.log(`Published curriculum verified through chapter position ${requested}/${CURRICULUM_CHAPTERS.length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
