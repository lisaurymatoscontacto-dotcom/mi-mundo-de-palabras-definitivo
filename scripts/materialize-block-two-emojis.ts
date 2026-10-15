import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { TRANSITION_BLOCK_TWO_CARDS } from "../packages/core/src/transition-chapter-block-two";
import { contentSlug } from "../packages/core/src/asset-production";
import { validateAssetCatalog, type AssetCatalogDocument, type AssetRecord } from "../packages/core/src/assets";
import { worldForCategory } from "../packages/core/src/worlds";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const PUBLIC_ROOT = resolve("apps/web/public/content");
const TWEMOJI_REF = "b6b55fef1e8636b540a6d016a4729ca8cdf2e60b";
const TWEMOJI_BASE = `https://raw.githubusercontent.com/jdecked/twemoji/${TWEMOJI_REF}/assets/svg`;
const TWEMOJI_SOURCE = "https://github.com/jdecked/twemoji";
const REVIEW_NOTE = "Curriculum block-two controlled review: direct Twemoji representation matches one unambiguous child vocabulary concept; local CC-BY-4.0 resource and provenance verified.";

function codepoints(emoji: string) {
  return [...emoji]
    .map((char) => char.codePointAt(0)!)
    .filter((value) => value !== 0xfe0f)
    .map((value) => value.toString(16))
    .join("-");
}

function normalizedWord(word: string) {
  return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const before = validateAssetCatalog(catalog);
  if (!before.valid) throw new Error(`Invalid input catalog:\n${before.errors.join("\n")}`);

  const byId = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  const downloadedAt = new Date().toISOString();
  let created = 0;

  for (const card of TRANSITION_BLOCK_TWO_CARDS) {
    if (card.visualKind !== "emoji") throw new Error(`${card.word}: block-two card must use a controlled emoji`);
    const world = worldForCategory(card.category);
    if (!world) throw new Error(`${card.category}: world not configured`);
    const id = `${contentSlug(card.category)}.${contentSlug(card.word)}`;
    const existing = byId.get(id);
    if (existing) {
      if (existing.review_status !== "approved") throw new Error(`${id}: existing record is not approved`);
      continue;
    }

    const emoji = card.visual;
    const emojiCodepoints = codepoints(emoji);
    if (!emojiCodepoints) throw new Error(`${card.word}: invalid emoji codepoint sequence`);
    const relativePath = `emoji/twemoji/${emojiCodepoints}.svg`;
    const target = resolve(PUBLIC_ROOT, relativePath);
    const downloadUrl = `${TWEMOJI_BASE}/${emojiCodepoints}.svg`;
    const response = await fetch(downloadUrl, { headers: { "User-Agent": "MiMundoDePalabras/0.1" } });
    if (!response.ok) throw new Error(`${card.word}: Twemoji HTTP ${response.status}`);
    const svg = await response.text();
    if (!/^\s*<svg\b/i.test(svg)) throw new Error(`${card.word}: downloaded Twemoji is not SVG`);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, svg, "utf8");

    const asset: AssetRecord = {
      id,
      word: card.word,
      normalized_word: normalizedWord(card.word),
      category: card.category,
      world: world.id,
      difficulty: Math.max(card.readingDifficulty, card.writingDifficulty),
      asset_type: "emoji",
      asset_path: relativePath,
      source: "Twemoji",
      source_url: `${TWEMOJI_SOURCE}/blob/${TWEMOJI_REF}/assets/svg/${emojiCodepoints}.svg`,
      download_url: downloadUrl,
      author: "Twemoji contributors",
      license: "CC-BY-4.0",
      attribution_required: true,
      attribution_text: "Twemoji graphics © Twitter, Inc. and other contributors, licensed CC-BY 4.0.",
      verified: true,
      downloaded_at: downloadedAt,
      review_status: "approved",
      emoji_unicode: emoji,
      thumbnail_path: null,
      notes: [REVIEW_NOTE, "Difficulty synchronized from the controlled transition curriculum card; approved lexicon remains the final authority."],
    };
    catalog.assets.push(asset);
    byId.set(id, asset);
    created += 1;
    console.log(`Approved local emoji: ${id} -> ${relativePath}`);
  }

  catalog.generated_at = downloadedAt;
  const after = validateAssetCatalog(catalog);
  if (!after.valid) throw new Error(`Generated catalog invalid:\n${after.errors.join("\n")}`);
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`Block-two materialization complete: ${created} new approved assets; ${TRANSITION_BLOCK_TWO_CARDS.length} cards checked.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
