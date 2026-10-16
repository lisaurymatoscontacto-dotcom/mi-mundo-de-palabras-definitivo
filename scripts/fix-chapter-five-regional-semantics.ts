import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const PRIORITIES_PATH = resolve("packages/core/src/word-bank/curriculum-priorities.ts");
const REGIONAL_PATH = resolve("packages/core/src/regional-vocabulary.ts");
const TEST_PATH = resolve("packages/core/src/chapter-five-regional-semantics.test.ts");
const REPORT_PATH = resolve("content/audits/chapter-five-readiness.json");

const EXPECTED_COMIDA_FIVE = [
  "YUCA", "CEREAL", "YOGUR", "LENTEJA", "MANDARINA", "TORONJA", "LIMA", "GUAYABA",
  "PAPAYA", "MARACUYÁ", "GRANADA", "CIRUELA", "NECTARINA", "ALBARICOQUE", "FRAMBUESA", "MORA",
] as const;

async function apply() {
  let priorities = await readFile(PRIORITIES_PATH, "utf8");
  let regional = await readFile(REGIONAL_PATH, "utf8");

  if (priorities.includes('"NECTARINA", "ALBARICOQUE", "FRAMBUESA", "MORA"')) {
    throw new Error("Comida 5 semantic priority already appears to be applied");
  }
  const comidaAnchor = `    [\n      "POLLO", "CARNE", "CAMARÓN", "CANGREJO", "LANGOSTA", "PULPO", "CALAMAR", "PAELLA",\n      "BURRITO", "CAFÉ", "TÉ", "AGUA", "JUGO", "DONA", "FLAN", "MANÍ",\n    ],\n  ],\n  Naturaleza:`;
  if (!priorities.includes(comidaAnchor)) throw new Error("Could not find the exact Comida chapter-four priority anchor");
  const comidaFive = `    [\n      "YUCA", "CEREAL", "YOGUR", "LENTEJA", "MANDARINA", "TORONJA", "LIMA", "GUAYABA",\n      "PAPAYA", "MARACUYÁ", "GRANADA", "CIRUELA", "NECTARINA", "ALBARICOQUE", "FRAMBUESA", "MORA",\n    ],\n`;
  priorities = priorities.replace(comidaAnchor, `${comidaAnchor.replace("  ],\n  Naturaleza:", "")}${comidaFive}  ],\n  Naturaleza:`);

  if (regional.includes('conceptId: "banana"') || regional.includes('conceptId: "papaya"') || regional.includes('conceptId: "passion-fruit"') || regional.includes('conceptId: "grapefruit"')) {
    throw new Error("One or more chapter-five food regional lexemes already exist; refusing partial duplicate insertion");
  }
  const regionalAnchor = `\n];\n\nexport function wordForRegion`;
  if (!regional.includes(regionalAnchor)) throw new Error("Could not find regional lexeme list closing anchor");
  const entries = `\n  {\n    conceptId: "banana",\n    defaultWord: "BANANA",\n    variants: { latam: "BANANA", caribbean: "GUINEO", andine: "BANANA", "southern-cone": "BANANA", mx: "BANANA" },\n    acceptedAlternatives: ["GUINEO"],\n    reviewNote: "Guineo/banana are regional names for the same fruit; never teach them as separate new concepts.",\n  },\n  {\n    conceptId: "papaya",\n    defaultWord: "PAPAYA",\n    variants: { latam: "PAPAYA", caribbean: "LECHOSA", andine: "PAPAYA", "southern-cone": "PAPAYA", mx: "PAPAYA" },\n    acceptedAlternatives: ["LECHOSA"],\n    reviewNote: "Lechosa is a Caribbean regional name for papaya; share one concept/visual identity.",\n  },\n  {\n    conceptId: "passion-fruit",\n    defaultWord: "MARACUYÁ",\n    variants: { latam: "MARACUYÁ", caribbean: "CHINOLA", andine: "MARACUYÁ", "southern-cone": "MARACUYÁ", mx: "MARACUYÁ" },\n    acceptedAlternatives: ["CHINOLA"],\n    reviewNote: "Chinola/maracuyá are regional names for the same fruit; share one concept/visual identity.",\n  },\n  {\n    conceptId: "grapefruit",\n    defaultWord: "TORONJA",\n    variants: { latam: "TORONJA", caribbean: "TORONJA", andine: "POMELO", "southern-cone": "POMELO", mx: "TORONJA" },\n    acceptedAlternatives: ["POMELO"],\n    reviewNote: "Toronja/pomelo are regional names for grapefruit; do not count them as two new concepts.",\n  },`;
  regional = regional.replace(regionalAnchor, `${entries}${regionalAnchor}`);

  const testFile = `import { describe, expect, it } from "vitest";\nimport { chaptersForCategory } from "./curriculum";\nimport { REGIONAL_LEXEMES } from "./regional-vocabulary";\n\nconst EXPECTED_COMIDA_FIVE = ${JSON.stringify(EXPECTED_COMIDA_FIVE)} as const;\n\nfunction conceptKey(word: string) {\n  const lexeme = REGIONAL_LEXEMES.find((item) =>\n    item.defaultWord === word ||\n    item.acceptedAlternatives?.includes(word) ||\n    Object.values(item.variants).includes(word),\n  );\n  return lexeme ? \`regional:\${lexeme.conceptId}\` : \`word:\${word}\`;\n}\n\ndescribe("Comida 5 regional semantics", () => {\n  it("pins sixteen genuinely distinct early concepts", () => {\n    const chapters = chaptersForCategory("Comida");\n    const chapterFive = chapters.find((chapter) => chapter.chapterNumber === 5);\n    expect(chapterFive?.newWords).toEqual([...EXPECTED_COMIDA_FIVE]);\n    expect(new Set((chapterFive?.newWords ?? []).map(conceptKey)).size).toBe(16);\n  });\n\n  it("does not reintroduce a regional synonym already taught in chapters 1-4", () => {\n    const chapters = chaptersForCategory("Comida");\n    const earlierKeys = new Set(chapters.filter((chapter) => chapter.chapterNumber < 5).flatMap((chapter) => chapter.newWords).map(conceptKey));\n    const chapterFive = chapters.find((chapter) => chapter.chapterNumber === 5)!;\n    for (const word of chapterFive.newWords) expect(earlierKeys.has(conceptKey(word)), word).toBe(false);\n  });\n\n  it("models the four known synonym families as shared concepts", () => {\n    const key = (word: string) => conceptKey(word);\n    expect(key("BANANA")).toBe(key("GUINEO"));\n    expect(key("PAPAYA")).toBe(key("LECHOSA"));\n    expect(key("MARACUYÁ")).toBe(key("CHINOLA"));\n    expect(key("TORONJA")).toBe(key("POMELO"));\n  });\n});\n`;

  await writeFile(PRIORITIES_PATH, priorities, "utf8");
  await writeFile(REGIONAL_PATH, regional, "utf8");
  await writeFile(TEST_PATH, testFile, "utf8");
  console.log("Applied regional semantic identity and explicit distinct Comida 5 curriculum priority.");
}

async function verifyAndRefreshReadiness() {
  const [{ chaptersForCategory, CURRICULUM_CHAPTERS }, { REGIONAL_LEXEMES }, { DEMO_WORDS }, { contentSlug }, { canPublishAsset, validateAssetCatalog }] = await Promise.all([
    import("../packages/core/src/curriculum"),
    import("../packages/core/src/regional-vocabulary"),
    import("../packages/core/src/index"),
    import("../packages/core/src/asset-production"),
    import("../packages/core/src/assets"),
  ]);
  const comidaFive = chaptersForCategory("Comida").find((chapter) => chapter.chapterNumber === 5);
  if (!comidaFive || JSON.stringify(comidaFive.newWords) !== JSON.stringify(EXPECTED_COMIDA_FIVE)) {
    throw new Error(`Comida 5 mismatch after semantic fix: ${JSON.stringify(comidaFive?.newWords)}`);
  }
  const conceptKey = (word: string) => {
    const lexeme = REGIONAL_LEXEMES.find((item) => item.defaultWord === word || item.acceptedAlternatives?.includes(word) || Object.values(item.variants).includes(word));
    return lexeme ? `regional:${lexeme.conceptId}` : `word:${word}`;
  };
  if (new Set(comidaFive.newWords.map(conceptKey)).size !== 16) throw new Error("Comida 5 still contains semantic duplicates");
  const priorKeys = new Set(chaptersForCategory("Comida").filter((chapter) => chapter.chapterNumber < 5).flatMap((chapter) => chapter.newWords).map(conceptKey));
  for (const word of comidaFive.newWords) if (priorKeys.has(conceptKey(word))) throw new Error(`Comida 5 repeats earlier concept via regional synonym: ${word}`);

  const catalog = JSON.parse(await readFile(resolve("content/assets.catalog.json"), "utf8"));
  const validation = validateAssetCatalog(catalog);
  if (!validation.valid) throw new Error(`Catalog invalid during readiness refresh:\n${validation.errors.join("\n")}`);
  const cards = new Map(DEMO_WORDS.map((card) => [`${card.category}\u0000${card.word}`, card]));
  const assets = new Map(catalog.assets.map((asset: any) => [asset.id, asset]));
  const categories = ["Animales", "Casa", "Comida", "Naturaleza"];
  const worlds = categories.map((category) => {
    const chapter = CURRICULUM_CHAPTERS.find((candidate) => candidate.category === category && candidate.chapterNumber === 5)!;
    const concepts = chapter.newWords.map((word) => {
      const id = `${contentSlug(category)}.${contentSlug(word)}`;
      const card = cards.get(`${category}\u0000${word}`);
      const asset: any = assets.get(id);
      return { id, word, card_published: Boolean(card), asset_present: Boolean(asset), asset_type: asset?.asset_type ?? null, asset_review_status: asset?.review_status ?? null, asset_publishable: asset ? canPublishAsset(asset) : false, ready: Boolean(card && asset && canPublishAsset(asset)) };
    });
    return { category, chapter_id: chapter.id, expected_new_words: chapter.newWords.length, ready: concepts.filter((x) => x.ready).length, cards_published: concepts.filter((x) => x.card_published).length, assets_publishable: concepts.filter((x) => x.asset_publishable).length, concepts };
  });
  const total = worlds.reduce((sum, world) => sum + world.expected_new_words, 0);
  const ready = worlds.reduce((sum, world) => sum + world.ready, 0);
  const report = { generated_at: new Date().toISOString(), scope: "Curriculum chapter 5 readiness for Animales, Casa, Comida and Naturaleza", readiness_rule: "A concept is ready only when an explicitly published editorial card and a publishable approved local asset both exist.", total_concepts: total, ready_concepts: ready, ready_percent: Math.round((ready / total) * 1000) / 10, cards_published: worlds.reduce((sum, world) => sum + world.cards_published, 0), assets_publishable: worlds.reduce((sum, world) => sum + world.assets_publishable, 0), worlds };
  if (report.total_concepts !== 64 || report.ready_concepts !== 20) throw new Error(`Semantic fix unexpectedly changed ready count: ${report.ready_concepts}/${report.total_concepts}`);
  await mkdir(dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Regional semantics verified; objective readiness remains ${report.ready_concepts}/${report.total_concepts} (${report.ready_percent}%).`);
}

(process.argv.includes("--verify") ? verifyAndRefreshReadiness() : apply()).catch((error) => { console.error(error); process.exitCode = 1; });
