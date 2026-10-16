import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { TRANSITION_BLOCK_SIX_CARDS } from "../packages/core/src/transition-chapter-block-six";
import { normalizeAssetWord } from "../packages/core/src/asset-queue";
import { contentSlug } from "../packages/core/src/asset-production";
import { validateAssetCatalog, type AssetCatalogDocument, type AssetRecord } from "../packages/core/src/assets";
import { worldForCategory } from "../packages/core/src/worlds";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const PUBLIC_ROOT = resolve("apps/web/public/content");
const TWEMOJI_REF = "b6b55fef1e8636b540a6d016a4729ca8cdf2e60b";
const TWEMOJI_BASE = `https://raw.githubusercontent.com/jdecked/twemoji/${TWEMOJI_REF}/assets/svg`;
const TWEMOJI_SOURCE = "https://github.com/jdecked/twemoji";
const REVIEW_NOTE = "Curriculum block 6 controlled review: direct Twemoji representation matches one clear written concept; local CC-BY-4.0 file, difficulty and pinned provenance verified.";

function emojiCodepointCandidates(emoji: string) {
  const all = [...emoji].map((char) => char.codePointAt(0)!);
  const stripped = all.filter((codepoint) => codepoint !== 0xfe0f).map((codepoint) => codepoint.toString(16)).join("-");
  const preserved = all.map((codepoint) => codepoint.toString(16)).join("-");
  return [...new Set([stripped, preserved])];
}

async function materialize(emoji: string) {
  const attempted: string[] = [];
  for (const codepoints of emojiCodepointCandidates(emoji)) {
    const relativePath = `emoji/twemoji/${codepoints}.svg`;
    const downloadUrl = `${TWEMOJI_BASE}/${codepoints}.svg`;
    attempted.push(codepoints);
    const response = await fetch(downloadUrl, {
      headers: { "User-Agent": "MiMundoDePalabras/0.1 (https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo)" },
    });
    if (response.status === 404) continue;
    if (!response.ok) throw new Error(`Twemoji ${codepoints} returned HTTP ${response.status}`);
    const svg = await response.text();
    if (!/^\s*<svg\b/i.test(svg)) throw new Error(`Twemoji ${codepoints} was not SVG`);
    const target = resolve(PUBLIC_ROOT, relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, svg, "utf8");
    return { codepoints, relativePath, downloadUrl };
  }
  throw new Error(`Twemoji asset not found; tried ${attempted.join(", ")} for ${emoji}`);
}

async function main() {
  if (TRANSITION_BLOCK_SIX_CARDS.length !== 64) {
    throw new Error(`Expected exactly 64 block-six cards, received ${TRANSITION_BLOCK_SIX_CARDS.length}`);
  }

  const uniqueConcepts = new Set(TRANSITION_BLOCK_SIX_CARDS.map((card) => `${card.category}\u0000${card.word}`));
  if (uniqueConcepts.size !== 64) throw new Error("Block-six cards contain duplicate category/word concepts.");

  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const before = validateAssetCatalog(catalog);
  if (!before.valid) throw new Error(`Invalid input catalog:\n${before.errors.join("\n")}`);

  const byId = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  const downloaded = new Map<string, Awaited<ReturnType<typeof materialize>>>();
  const now = new Date().toISOString();

  for (const card of TRANSITION_BLOCK_SIX_CARDS) {
    let file = downloaded.get(card.visual);
    if (!file) {
      file = await materialize(card.visual);
      downloaded.set(card.visual, file);
    }

    const world = worldForCategory(card.category);
    if (!world) throw new Error(`No world configured for ${card.category}`);
    const id = `${contentSlug(card.category)}.${contentSlug(card.word)}`;
    const existing = byId.get(id);
    if (existing?.review_status === "approved") {
      throw new Error(`${id} is already approved; block-six materializer refuses to overwrite reviewed content.`);
    }

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
      emoji_unicode: card.visual,
      thumbnail_path: null,
      notes: [REVIEW_NOTE],
    };

    if (existing) Object.assign(existing, record);
    else {
      catalog.assets.push(record);
      byId.set(id, record);
    }
    console.log(`Approved local asset: ${id} -> ${file.relativePath}`);
  }

  catalog.generated_at = now;
  const after = validateAssetCatalog(catalog);
  if (!after.valid) throw new Error(`Block-six materialization produced invalid catalog:\n${after.errors.join("\n")}`);
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`Block six materialized: 64 new concepts, ${downloaded.size} unique Twemoji files.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
