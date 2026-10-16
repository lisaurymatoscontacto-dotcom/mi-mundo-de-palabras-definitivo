import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { CURRICULUM_CHAPTERS } from "../packages/core/src/curriculum";
import { DEMO_WORDS } from "../packages/core/src/index";
import { contentSlug } from "../packages/core/src/asset-production";
import { twemojiCodepointCandidates } from "../packages/core/src/twemoji";
import { canPublishAsset, validateAssetCatalog, type AssetCatalogDocument, type AssetRecord } from "../packages/core/src/assets";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const LEXICON_PATH = resolve("packages/core/src/generated/lexicon.candidate.json");
const OUTPUT_CARDS = resolve("packages/core/src/transition-chapter-five-wave-one.ts");
const PUBLISHED_PATH = resolve("packages/core/src/transition-published.ts");
const REPORT_PATH = resolve("content/audits/chapter-five-readiness.json");
const PUBLIC_ROOT = resolve("apps/web/public/content");
const TWEMOJI_REF = "b6b55fef1e8636b540a6d016a4729ca8cdf2e60b";
const TWEMOJI_BASE = `https://raw.githubusercontent.com/jdecked/twemoji/${TWEMOJI_REF}/assets/svg`;
const TWEMOJI_SOURCE = "https://github.com/jdecked/twemoji";
const USER_AGENT = "MiMundoDePalabras/0.1 (https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo)";
const TARGET_CATEGORIES = ["Animales", "Casa", "Comida", "Naturaleza"] as const;

const PHOTO_TARGETS = new Set([
  "casa.toalla", "casa.nevera", "casa.armario", "casa.horno",
  "comida.yuca", "comida.lenteja", "comida.papaya",
  "naturaleza.lago", "naturaleza.arena", "naturaleza.bosque", "naturaleza.cueva",
  "naturaleza.cascada", "naturaleza.valle", "naturaleza.selva", "naturaleza.prado",
]);
const EMOJI_TARGETS = new Map<string, string>([
  ["animales.burro", "🫏"],
  ["animales.tejon", "🦡"],
  ["animales.alce", "🫎"],
  ["animales.ciervo", "🦌"],
  ["casa.cuadro", "🖼️"],
]);
const TARGET_IDS = new Set([...PHOTO_TARGETS, ...EMOJI_TARGETS.keys()]);

interface CandidateLexiconEntry {
  id: string;
  category: string;
  defaultWord: string;
  syllables: string[];
  regionalForms: Array<{ region: string; word: string }>;
  difficulty: { reading: number; writing: number };
  status: string;
}
interface CandidateLexiconDocument { entries: CandidateLexiconEntry[]; }

function cardKey(category: string, word: string) { return `${category}\u0000${word}`; }
function escapeTs(value: string) { return JSON.stringify(value); }
function photoLicense(license: AssetRecord["license"]) {
  if (license === "CC0-1.0") return "cc0-1.0";
  if (license === "PUBLIC-DOMAIN") return "public-domain";
  throw new Error(`Unsupported chapter-five photo license: ${license}`);
}
async function materializeEmoji(emoji: string) {
  const attempted: string[] = [];
  for (const codepoints of twemojiCodepointCandidates(emoji)) {
    attempted.push(codepoints);
    const relativePath = `emoji/twemoji/${codepoints}.svg`;
    const response = await fetch(`${TWEMOJI_BASE}/${codepoints}.svg`, { headers: { "User-Agent": USER_AGENT } });
    if (response.status === 404) continue;
    if (!response.ok) throw new Error(`Twemoji ${codepoints}: HTTP ${response.status}`);
    const svg = await response.text();
    if (!/^\s*<svg\b/i.test(svg)) throw new Error(`Twemoji ${codepoints}: upstream response is not SVG`);
    const target = resolve(PUBLIC_ROOT, relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, svg, "utf8");
    return { codepoints, relativePath, downloadUrl: `${TWEMOJI_BASE}/${codepoints}.svg` };
  }
  throw new Error(`No pinned Twemoji file for ${emoji}; tried ${attempted.join(", ")}`);
}

async function computeReadiness(catalog: AssetCatalogDocument) {
  const cards = new Map(DEMO_WORDS.map((card) => [cardKey(card.category, card.word), card]));
  const assets = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  const worlds = TARGET_CATEGORIES.map((category) => {
    const chapter = CURRICULUM_CHAPTERS.find((candidate) => candidate.category === category && candidate.chapterNumber === 5);
    if (!chapter) throw new Error(`Missing ${category} 5`);
    const concepts = chapter.newWords.map((word) => {
      const id = `${contentSlug(category)}.${contentSlug(word)}`;
      const card = cards.get(cardKey(category, word));
      const asset = assets.get(id);
      return {
        id, word,
        card_published: Boolean(card),
        asset_present: Boolean(asset),
        asset_type: asset?.asset_type ?? null,
        asset_review_status: asset?.review_status ?? null,
        asset_publishable: asset ? canPublishAsset(asset) : false,
        ready: Boolean(card && asset && canPublishAsset(asset)),
      };
    });
    return {
      category, chapter_id: chapter.id, expected_new_words: chapter.newWords.length,
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
  return {
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
}

async function verifyOnly() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const validation = validateAssetCatalog(catalog);
  if (!validation.valid) throw new Error(`Invalid catalog:\n${validation.errors.join("\n")}`);
  const report = await computeReadiness(catalog);
  for (const id of TARGET_IDS) {
    const item = report.worlds.flatMap((world) => world.concepts).find((candidate) => candidate.id === id);
    if (!item?.ready) throw new Error(`${id}: wave-one concept is not fully ready after publication`);
  }
  if (report.ready_concepts < 20 || report.cards_published < 20 || report.assets_publishable < 20) {
    throw new Error(`Expected at least 20 ready chapter-five concepts after wave one; got ${JSON.stringify({ ready: report.ready_concepts, cards: report.cards_published, assets: report.assets_publishable })}`);
  }
  await mkdir(dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Chapter-five readiness after wave one: ${report.ready_concepts}/${report.total_concepts} (${report.ready_percent}%).`);
}

async function publish() {
  if (TARGET_IDS.size !== 20 || PHOTO_TARGETS.size !== 15 || EMOJI_TARGETS.size !== 5) throw new Error("Wave-one manifest count drift");
  const chapterConcepts = new Map<string, { category: string; word: string }>();
  for (const category of TARGET_CATEGORIES) {
    const chapter = CURRICULUM_CHAPTERS.find((candidate) => candidate.category === category && candidate.chapterNumber === 5);
    if (!chapter) throw new Error(`Missing ${category} 5`);
    for (const word of chapter.newWords) chapterConcepts.set(`${contentSlug(category)}.${contentSlug(word)}`, { category, word });
  }
  for (const id of TARGET_IDS) if (!chapterConcepts.has(id)) throw new Error(`${id}: guarded target is not a real chapter-five concept`);

  const existingCards = new Set(DEMO_WORDS.map((card) => cardKey(card.category, card.word)));
  for (const id of TARGET_IDS) {
    const concept = chapterConcepts.get(id)!;
    if (existingCards.has(cardKey(concept.category, concept.word))) throw new Error(`${id}: card is already published; refusing duplicate wave`);
  }

  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const validation = validateAssetCatalog(catalog);
  if (!validation.valid) throw new Error(`Invalid catalog:\n${validation.errors.join("\n")}`);
  const byAssetId = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  const lexicon = JSON.parse(await readFile(LEXICON_PATH, "utf8")) as CandidateLexiconDocument;
  const byLexiconId = new Map(lexicon.entries.map((entry) => [entry.id, entry]));
  const now = new Date().toISOString();

  for (const id of PHOTO_TARGETS) {
    const asset = byAssetId.get(id);
    if (!asset || asset.asset_type !== "photo" || !canPublishAsset(asset)) throw new Error(`${id}: guarded photo target lacks an approved publishable photo`);
    if (asset.license !== "CC0-1.0" && asset.license !== "PUBLIC-DOMAIN") throw new Error(`${id}: photo license is outside chapter policy`);
  }

  for (const [id, emoji] of EMOJI_TARGETS) {
    if (byAssetId.get(id)?.review_status === "approved") throw new Error(`${id}: an approved asset already exists; refusing to overwrite it`);
    const concept = chapterConcepts.get(id)!;
    const lex = byLexiconId.get(id);
    if (!lex || lex.category !== concept.category || lex.defaultWord !== concept.word || lex.status !== "editorial-review") throw new Error(`${id}: candidate lexicon identity/status mismatch`);
    const file = await materializeEmoji(emoji);
    const record: AssetRecord = {
      id,
      word: concept.word,
      normalized_word: concept.word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleUpperCase("es"),
      category: concept.category,
      world: CURRICULUM_CHAPTERS.find((chapter) => chapter.category === concept.category)!.worldId,
      difficulty: Math.max(lex.difficulty.reading, lex.difficulty.writing),
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
      notes: [
        "Chapter-five wave-one editorial approval: exact Unicode concept with no pedagogical substitution; local pinned Twemoji materialized after explicit manifest review.",
        `Twemoji pinned revision ${TWEMOJI_REF}.`,
      ],
    };
    const current = byAssetId.get(id);
    if (current) Object.assign(current, record); else { catalog.assets.push(record); byAssetId.set(id, record); }
    if (!canPublishAsset(byAssetId.get(id)!)) throw new Error(`${id}: new emoji asset is not publishable`);
  }

  const cardLines: string[] = [];
  for (const id of [...TARGET_IDS].sort((a, b) => a.localeCompare(b))) {
    const concept = chapterConcepts.get(id)!;
    const lex = byLexiconId.get(id);
    if (!lex || lex.category !== concept.category || lex.defaultWord !== concept.word || !Array.isArray(lex.syllables) || lex.syllables.length === 0) throw new Error(`${id}: missing reviewed candidate lexicon metadata`);
    if (!Number.isInteger(lex.difficulty.reading) || !Number.isInteger(lex.difficulty.writing)) throw new Error(`${id}: invalid difficulty metadata`);
    const asset = byAssetId.get(id)!;
    const visual = asset.asset_type === "emoji" ? asset.emoji_unicode! : asset.source_url;
    const visualKind = asset.asset_type === "emoji" ? "emoji" : "photo";
    const visualLicense = asset.asset_type === "emoji" ? "unicode-emoji" : photoLicense(asset.license);
    const sourceFields = asset.asset_type === "photo"
      ? `, visualSourceUrl: ${escapeTs(asset.source_url)}, visualAttribution: ${escapeTs(asset.attribution_text)}`
      : "";
    cardLines.push(`  { id: ${escapeTs(id)}, word: ${escapeTs(concept.word)}, category: ${escapeTs(concept.category)}, visual: ${escapeTs(visual)}, visualKind: ${escapeTs(visualKind)}, visualLicense: ${escapeTs(visualLicense)}${sourceFields}, syllables: ${JSON.stringify(lex.syllables)}, readingDifficulty: ${lex.difficulty.reading}, writingDifficulty: ${lex.difficulty.writing}, minAge: 4, regions: ["latam"], demoOnly: true },`);
  }

  const cardFile = `import type { WordCard } from "./index";\n\n/** Explicitly reviewed first publication wave for real curriculum chapter 5 (Animales/Casa/Comida/Naturaleza). */\nexport const TRANSITION_CHAPTER_FIVE_WAVE_ONE_CARDS: WordCard[] = [\n${cardLines.join("\n")}\n];\n`;
  let published = await readFile(PUBLISHED_PATH, "utf8");
  if (published.includes("TRANSITION_CHAPTER_FIVE_WAVE_ONE_CARDS")) throw new Error("transition-published already includes chapter-five wave one");
  const anchorImport = 'import { TRANSITION_BLOCK_TWELVE_CARDS } from "./transition-chapter-block-twelve";';
  if (!published.includes(anchorImport)) throw new Error("Could not find transition import anchor");
  published = published.replace(anchorImport, `${anchorImport}\nimport { TRANSITION_CHAPTER_FIVE_WAVE_ONE_CARDS } from "./transition-chapter-five-wave-one";`);
  const anchorSpread = "  ...TRANSITION_BLOCK_TWELVE_CARDS,\n];";
  if (!published.includes(anchorSpread)) throw new Error("Could not find transition spread anchor");
  published = published.replace(anchorSpread, "  ...TRANSITION_BLOCK_TWELVE_CARDS,\n  ...TRANSITION_CHAPTER_FIVE_WAVE_ONE_CARDS,\n];");

  catalog.generated_at = now;
  const finalValidation = validateAssetCatalog(catalog);
  if (!finalValidation.valid) throw new Error(`Wave-one catalog invalid:\n${finalValidation.errors.join("\n")}`);
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await writeFile(OUTPUT_CARDS, cardFile, "utf8");
  await writeFile(PUBLISHED_PATH, published, "utf8");
  console.log("Published chapter-five wave one manifest: 15 approved photos + 5 exact pinned Twemoji concepts = 20 cards.");
}

(process.argv.includes("--verify-only") ? verifyOnly() : publish()).catch((error) => { console.error(error); process.exitCode = 1; });
