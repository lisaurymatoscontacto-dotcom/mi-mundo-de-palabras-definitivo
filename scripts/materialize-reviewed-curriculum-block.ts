import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { DEMO_WORDS, type WordCard } from "../packages/core/src/index";
import { CURRICULUM_CHAPTERS } from "../packages/core/src/curriculum";
import { normalizeAssetWord } from "../packages/core/src/asset-queue";
import { contentSlug } from "../packages/core/src/asset-production";
import { validateAssetCatalog, type AssetCatalogDocument, type AssetRecord } from "../packages/core/src/assets";
import { twemojiCodepointCandidates } from "../packages/core/src/twemoji";
import { worldForCategory } from "../packages/core/src/worlds";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const PUBLIC_ROOT = resolve("apps/web/public/content");
const TWEMOJI_REF = "b6b55fef1e8636b540a6d016a4729ca8cdf2e60b";
const TWEMOJI_BASE = `https://raw.githubusercontent.com/jdecked/twemoji/${TWEMOJI_REF}/assets/svg`;
const TWEMOJI_SOURCE = "https://github.com/jdecked/twemoji";
const USER_AGENT = "MiMundoDePalabras/0.1 (https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo)";

function argValue(name: string) {
  const prefix = `${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function cardKey(category: string, word: string) {
  return `${category}\u0000${word}`;
}

async function materializeEmoji(emoji: string) {
  const attempted: string[] = [];
  for (const codepoints of twemojiCodepointCandidates(emoji)) {
    attempted.push(codepoints);
    const relativePath = `emoji/twemoji/${codepoints}.svg`;
    const downloadUrl = `${TWEMOJI_BASE}/${codepoints}.svg`;
    const response = await fetch(downloadUrl, { headers: { "User-Agent": USER_AGENT } });
    if (response.status === 404) continue;
    if (!response.ok) throw new Error(`Twemoji ${codepoints} returned HTTP ${response.status}`);
    const svg = await response.text();
    if (!/^\s*<svg\b/i.test(svg)) throw new Error(`Twemoji ${codepoints} was not SVG`);
    const target = resolve(PUBLIC_ROOT, relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, svg, "utf8");
    return { codepoints, relativePath, downloadUrl };
  }
  throw new Error(`Twemoji asset not found for ${emoji}; tried ${attempted.join(", ")}`);
}

function requireReviewedEmojiCard(byKey: Map<string, WordCard>, category: string, word: string) {
  const card = byKey.get(cardKey(category, word));
  if (!card) {
    throw new Error(`${category} / ${word}: no explicitly curated transition card exists. Add and review the card before materializing the chapter.`);
  }
  if (card.visualKind !== "emoji" || card.visualLicense !== "unicode-emoji") {
    throw new Error(`${category} / ${word}: generic block materializer only handles explicitly reviewed emoji cards. Use the photo/custom review pipeline instead.`);
  }
  if (!card.visual.trim()) throw new Error(`${category} / ${word}: reviewed emoji card has no visual.`);
  return card;
}

async function main() {
  const start = Number(argValue("--start"));
  const count = Number(argValue("--count") ?? "4");
  if (!Number.isInteger(start) || start < 1 || start > CURRICULUM_CHAPTERS.length) {
    throw new Error(`Use --start=1..${CURRICULUM_CHAPTERS.length}; positions are one-based.`);
  }
  if (!Number.isInteger(count) || count < 1 || start - 1 + count > CURRICULUM_CHAPTERS.length) {
    throw new Error("--count must select a positive in-range contiguous chapter block.");
  }

  const chapters = CURRICULUM_CHAPTERS.slice(start - 1, start - 1 + count);
  const cardMap = new Map(DEMO_WORDS.map((card) => [cardKey(card.category, card.word), card]));
  const reviewedCards = chapters.flatMap((chapter) =>
    chapter.newWords.map((word) => requireReviewedEmojiCard(cardMap, chapter.category, word)),
  );
  const uniqueKeys = new Set(reviewedCards.map((card) => cardKey(card.category, card.word)));
  if (uniqueKeys.size !== reviewedCards.length) throw new Error("Selected block repeats a new category/word concept unexpectedly.");

  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const before = validateAssetCatalog(catalog);
  if (!before.valid) throw new Error(`Invalid input catalog:\n${before.errors.join("\n")}`);

  const byId = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  const downloaded = new Map<string, Awaited<ReturnType<typeof materializeEmoji>>>();
  const now = new Date().toISOString();

  for (const card of reviewedCards) {
    const id = `${contentSlug(card.category)}.${contentSlug(card.word)}`;
    const existing = byId.get(id);
    if (existing?.review_status === "approved") {
      if (existing.word !== card.word || existing.category !== card.category) {
        throw new Error(`${id}: approved catalog record conflicts with reviewed transition card.`);
      }
      console.log(`Already approved: ${id}`);
      continue;
    }

    let file = downloaded.get(card.visual);
    if (!file) {
      file = await materializeEmoji(card.visual);
      downloaded.set(card.visual, file);
    }
    const world = worldForCategory(card.category);
    if (!world) throw new Error(`No world configured for ${card.category}`);

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
      notes: [
        `Controlled curriculum review: explicitly curated transition card for ${card.category}; one written concept maps to one direct Twemoji representation.`,
        `Published through curriculum block starting at position ${start}.`,
      ],
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
  if (!after.valid) throw new Error(`Reviewed block materialization produced invalid catalog:\n${after.errors.join("\n")}`);
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`Reviewed block materialized: chapters ${start}-${start + count - 1}, ${reviewedCards.length} new card placements, ${downloaded.size} newly fetched Twemoji files.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
