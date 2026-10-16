import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { TRANSITION_BLOCK_THREE_CARDS } from "../packages/core/src/transition-chapter-block-three";
import { normalizeAssetWord } from "../packages/core/src/asset-queue";
import { contentSlug } from "../packages/core/src/asset-production";
import { validateAssetCatalog, type AssetCatalogDocument, type AssetRecord } from "../packages/core/src/assets";
import { worldForCategory } from "../packages/core/src/worlds";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const PUBLIC_ROOT = resolve("apps/web/public/content");
const TWEMOJI_REF = "b6b55fef1e8636b540a6d016a4729ca8cdf2e60b";
const TWEMOJI_BASE = `https://raw.githubusercontent.com/jdecked/twemoji/${TWEMOJI_REF}/assets/svg`;
const TWEMOJI_SOURCE = "https://github.com/jdecked/twemoji";
const REVIEW_NOTE = "Curriculum block 3 controlled review: direct Twemoji representation matches one clear written concept; local CC-BY-4.0 file and pinned provenance verified.";

function emojiCodepoints(emoji: string) {
  return [...emoji]
    .map((char) => char.codePointAt(0)!)
    .filter((codepoint) => codepoint !== 0xfe0f)
    .map((codepoint) => codepoint.toString(16))
    .join("-");
}

async function materialize(emoji: string) {
  const codepoints = emojiCodepoints(emoji);
  const relativePath = `emoji/twemoji/${codepoints}.svg`;
  const target = resolve(PUBLIC_ROOT, relativePath);
  const downloadUrl = `${TWEMOJI_BASE}/${codepoints}.svg`;
  const response = await fetch(downloadUrl, {
    headers: { "User-Agent": "MiMundoDePalabras/0.1 (https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo)" },
  });
  if (!response.ok) throw new Error(`Twemoji ${codepoints} returned HTTP ${response.status}`);
  const svg = await response.text();
  if (!/^\s*<svg\b/i.test(svg)) throw new Error(`Twemoji ${codepoints} was not SVG`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, svg, "utf8");
  return { codepoints, relativePath, downloadUrl };
}

async function main() {
  if (TRANSITION_BLOCK_THREE_CARDS.length !== 80) {
    throw new Error(`Expected exactly 80 block-three cards, received ${TRANSITION_BLOCK_THREE_CARDS.length}`);
  }

  const uniqueConcepts = new Set(TRANSITION_BLOCK_THREE_CARDS.map((card) => `${card.category}\u0000${card.word}`));
  if (uniqueConcepts.size !== 80) throw new Error("Block-three cards contain duplicate category/word concepts.");

  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const before = validateAssetCatalog(catalog);
  if (!before.valid) throw new Error(`Invalid input catalog:\n${before.errors.join("\n")}`);

  const byId = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  const downloaded = new Map<string, Awaited<ReturnType<typeof materialize>>>();
  const now = new Date().toISOString();

  for (const card of TRANSITION_BLOCK_THREE_CARDS) {
    const emoji = card.visual;
    let file = downloaded.get(emoji);
    if (!file) {
      file = await materialize(emoji);
      downloaded.set(emoji, file);
    }

    const world = worldForCategory(card.category);
    if (!world) throw new Error(`No world configured for ${card.category}`);
    const id = `${contentSlug(card.category)}.${contentSlug(card.word)}`;
    const record: AssetRecord = {
      id,
      word: card.word,
      normalized_word: normalizeAssetWord(card.word),
      category: card.category,
      world: world.id,
      difficulty: Math.max(card.readingDifficulty, card.writingDifficulty),
      asset_type: "emoji",
      asset_path: file.relativePath,
      source: "Twemoji",
      source_url: `${TWEMOJI_SOURCE}/blob/${TWEMOJI_REF}/assets/svg/${file.codepoints}.svg`,
      download_url: file.downloadUrl,
      author: "Twemoji contributors",
      license: "CC-BY-4.0",
      attribution_required: true,
      attribution_text: "Twemoji graphics © Twitter, Inc. and other contributors, licensed CC-BY 4.0.",
      verified: true,
      downloaded_at: now,
      review_status: "approved",
      emoji_unicode: emoji,
      thumbnail_path: null,
      notes: [REVIEW_NOTE],
    };

    const existing = byId.get(id);
    if (existing?.review_status === "approved") {
      throw new Error(`${id} is already approved; block-three materializer refuses to overwrite reviewed content.`);
    }
    if (existing) Object.assign(existing, record);
    else {
      catalog.assets.push(record);
      byId.set(id, record);
    }
    console.log(`Approved local asset: ${id} -> ${file.relativePath}`);
  }

  catalog.generated_at = now;
  const after = validateAssetCatalog(catalog);
  if (!after.valid) throw new Error(`Block-three materialization produced invalid catalog:\n${after.errors.join("\n")}`);
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`Block three materialized: 80 concepts, ${downloaded.size} unique Twemoji files.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
