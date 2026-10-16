import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const PRIORITIES_PATH = resolve("packages/core/src/word-bank/curriculum-priorities.ts");
const REGIONAL_PATH = resolve("packages/core/src/regional-vocabulary.ts");
const TEST_PATH = resolve("packages/core/src/chapter-five-regional-semantics.test.ts");
const LEXICON_PATH = resolve("packages/core/src/generated/lexicon.candidate.json");
const CATALOG_PATH = resolve("content/assets.catalog.json");
const PUBLISHED_PATH = resolve("packages/core/src/transition-published.ts");
const OUTPUT_CARDS = resolve("packages/core/src/transition-chapter-five-wave-two.ts");
const REPORT_PATH = resolve("content/audits/chapter-five-readiness.json");

const CASA_FIVE = ["COLCHÓN","PISO","TECHO","PATIO","BAÑO","COCINA","TOALLA","NEVERA","ESTUFA","ALMOHADA","SÁBANA","CORTINA","LÁMPARA","ARMARIO","CUADRO","HORNO"] as const;
const COMIDA_FIVE = ["YUCA","CEREAL","YOGUR","LENTEJA","MANDARINA","TORONJA","LIMA","GUAYABA","PAPAYA","MARACUYÁ","GRANADA","CIRUELA","PESCADO","SALCHICHA","HARINA","CHURRO"] as const;
const NATURALEZA_FIVE = ["LAGO","RAMA","ARENA","ACANTILADO","CAMPO","TIERRA","BOSQUE","CUEVA","CIELO","CASCADA","VALLE","SELVA","PRADO","CAÑÓN","OCÉANO","ARROYO"] as const;
const WAVE_TWO_IDS = ["casa.colchon","comida.pescado","comida.salchicha","comida.harina","comida.churro","naturaleza.acantilado","naturaleza.canyon"] as const;

function replaceOnce(source: string, from: string, to: string, label: string) {
  if (!source.includes(from)) throw new Error(`Missing exact ${label} anchor`);
  if (source.indexOf(from) !== source.lastIndexOf(from)) throw new Error(`Ambiguous ${label} anchor`);
  return source.replace(from, to);
}
function q(value: string) { return JSON.stringify(value); }
function photoLicense(license: string) {
  if (license === "CC0-1.0") return "cc0-1.0";
  if (license === "PUBLIC-DOMAIN") return "public-domain";
  throw new Error(`Unsupported photo license ${license}`);
}

async function applyCurriculum() {
  let priorities = await readFile(PRIORITIES_PATH, "utf8");
  let regional = await readFile(REGIONAL_PATH, "utf8");

  const casaAnchor = `    [\n      "FRASCO", "PEINE", "AFEITADORA", "GRIFO", "BALANZA", "GUANTE", "TIMBRE", "COMPUTADORA",\n      "RATÓN", "TORNILLO", "SERRUCHO", "GANCHO", "CLIP", "AGUJA", "HILO", "PORTARRETRATO",\n    ],\n  ],\n  Comida:`;
  const casaReplacement = `    [\n      "FRASCO", "PEINE", "AFEITADORA", "GRIFO", "BALANZA", "GUANTE", "TIMBRE", "COMPUTADORA",\n      "RATÓN", "TORNILLO", "SERRUCHO", "GANCHO", "CLIP", "AGUJA", "HILO", "PORTARRETRATO",\n    ],\n    [\n      "COLCHÓN", "PISO", "TECHO", "PATIO", "BAÑO", "COCINA", "TOALLA", "NEVERA",\n      "ESTUFA", "ALMOHADA", "SÁBANA", "CORTINA", "LÁMPARA", "ARMARIO", "CUADRO", "HORNO",\n    ],\n  ],\n  Comida:`;
  priorities = replaceOnce(priorities, casaAnchor, casaReplacement, "Casa chapter-five");

  const oldComida = `    [\n      "YUCA", "CEREAL", "YOGUR", "LENTEJA", "MANDARINA", "TORONJA", "LIMA", "GUAYABA",\n      "PAPAYA", "MARACUYÁ", "GRANADA", "CIRUELA", "NECTARINA", "ALBARICOQUE", "FRAMBUESA", "MORA",\n    ],`;
  const newComida = `    [\n      "YUCA", "CEREAL", "YOGUR", "LENTEJA", "MANDARINA", "TORONJA", "LIMA", "GUAYABA",\n      "PAPAYA", "MARACUYÁ", "GRANADA", "CIRUELA", "PESCADO", "SALCHICHA", "HARINA", "CHURRO",\n    ],`;
  priorities = replaceOnce(priorities, oldComida, newComida, "Comida chapter-five refinement");

  const natureAnchor = `    [\n      "ARCE", "BROTE", "TRONCO", "HIERBA", "TERMAS", "METEORO", "OLEAJE", "PLANETA",\n      "SATÉLITE", "GALAXIA", "BRISA", "CALOR", "ARRECIFE", "CORDILLERA", "LUZ", "CONTINENTE",\n    ],\n  ],\n  Cuerpo:`;
  const natureReplacement = `    [\n      "ARCE", "BROTE", "TRONCO", "HIERBA", "TERMAS", "METEORO", "OLEAJE", "PLANETA",\n      "SATÉLITE", "GALAXIA", "BRISA", "CALOR", "ARRECIFE", "CORDILLERA", "LUZ", "CONTINENTE",\n    ],\n    [\n      "LAGO", "RAMA", "ARENA", "ACANTILADO", "CAMPO", "TIERRA", "BOSQUE", "CUEVA",\n      "CIELO", "CASCADA", "VALLE", "SELVA", "PRADO", "CAÑÓN", "OCÉANO", "ARROYO",\n    ],\n  ],\n  Cuerpo:`;
  priorities = replaceOnce(priorities, natureAnchor, natureReplacement, "Naturaleza chapter-five");

  if (regional.includes('conceptId: "light-bulb"')) throw new Error("light-bulb regional lexeme already exists");
  const close = `\n];\n\nexport function wordForRegion`;
  const lightBulb = `\n  {\n    conceptId: "light-bulb",\n    defaultWord: "BOMBILLA",\n    variants: { latam: "BOMBILLA", caribbean: "BOMBILLA", andine: "BOMBILLA", "southern-cone": "BOMBILLA", mx: "FOCO" },\n    acceptedAlternatives: ["FOCO", "BOMBILLO"],\n    reviewNote: "Foco/bombilla/bombillo can name the same light-bulb concept regionally; do not spend separate curriculum positions on them.",\n  },`;
  regional = replaceOnce(regional, close, `${lightBulb}${close}`, "regional list close");

  const test = `import { describe, expect, it } from "vitest";\nimport { chaptersForCategory } from "./curriculum";\nimport { REGIONAL_LEXEMES } from "./regional-vocabulary";\n\nconst EXPECTED = { Casa: ${JSON.stringify(CASA_FIVE)}, Comida: ${JSON.stringify(COMIDA_FIVE)}, Naturaleza: ${JSON.stringify(NATURALEZA_FIVE)} } as const;\nfunction conceptKey(word: string) {\n  const lexeme = REGIONAL_LEXEMES.find((item) => item.defaultWord === word || item.acceptedAlternatives?.includes(word) || Object.values(item.variants).includes(word));\n  return lexeme ? \`regional:\${lexeme.conceptId}\` : \`word:\${word}\`;\n}\n\ndescribe("chapter-five early curriculum semantics", () => {\n  for (const [category, expected] of Object.entries(EXPECTED)) {\n    it(\`pins 16 reviewed concepts for \${category}\`, () => {\n      const chapter = chaptersForCategory(category).find((item) => item.chapterNumber === 5);\n      expect(chapter?.newWords).toEqual([...expected]);\n      expect(new Set((chapter?.newWords ?? []).map(conceptKey)).size).toBe(16);\n    });\n  }\n  it("does not repeat regional synonyms already taught in Comida 1-4", () => {\n    const chapters = chaptersForCategory("Comida");\n    const previous = new Set(chapters.filter((c) => c.chapterNumber < 5).flatMap((c) => c.newWords).map(conceptKey));\n    for (const word of chapters.find((c) => c.chapterNumber === 5)!.newWords) expect(previous.has(conceptKey(word)), word).toBe(false);\n  });\n  it("keeps known regional synonym families under one concept identity", () => {\n    for (const [a,b] of [["BANANA","GUINEO"],["PAPAYA","LECHOSA"],["MARACUYÁ","CHINOLA"],["TORONJA","POMELO"],["BOMBILLA","FOCO"]]) expect(conceptKey(a)).toBe(conceptKey(b));\n  });\n  it("removes ambiguous/duplicate early entries", () => {\n    expect(chaptersForCategory("Casa").find((c) => c.chapterNumber === 5)!.newWords).not.toContain("FOCO");\n    const nature = chaptersForCategory("Naturaleza").find((c) => c.chapterNumber === 5)!.newWords;\n    expect(nature).not.toContain("MONTE");\n    expect(nature).not.toContain("TRUENO");\n  });\n});\n`;

  await writeFile(PRIORITIES_PATH, priorities, "utf8");
  await writeFile(REGIONAL_PATH, regional, "utf8");
  await writeFile(TEST_PATH, test, "utf8");
  console.log("Applied reviewed Casa/Comida/Naturaleza chapter-five priorities and light-bulb regional identity.");
}

async function publishExisting() {
  const [{ CURRICULUM_CHAPTERS }, { contentSlug }, { validateAssetCatalog, canPublishAsset }] = await Promise.all([
    import("../packages/core/src/curriculum"), import("../packages/core/src/asset-production"), import("../packages/core/src/assets"),
  ]);
  const lexicon = JSON.parse(await readFile(LEXICON_PATH, "utf8"));
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
  const valid = validateAssetCatalog(catalog);
  if (!valid.valid) throw new Error(`Invalid catalog:\n${valid.errors.join("\n")}`);
  const byLex = new Map(lexicon.entries.map((entry: any) => [entry.id, entry]));
  const byAsset = new Map(catalog.assets.map((asset: any) => [asset.id, asset]));
  const chapterIds = new Set(CURRICULUM_CHAPTERS.filter((c) => c.chapterNumber === 5 && ["Animales","Casa","Comida","Naturaleza"].includes(c.category)).flatMap((c) => c.newWords.map((word) => `${contentSlug(c.category)}.${contentSlug(word)}`)));
  const lines: string[] = [];
  for (const id of WAVE_TWO_IDS) {
    if (!chapterIds.has(id)) throw new Error(`${id}: is not in refined chapter five`);
    const asset: any = byAsset.get(id), lex: any = byLex.get(id);
    if (!asset || asset.asset_type !== "photo" || !canPublishAsset(asset)) throw new Error(`${id}: lacks approved publishable photo`);
    if (!lex || lex.id !== id || !lex.syllables?.length) throw new Error(`${id}: lacks generated lexicon metadata`);
    const license = photoLicense(asset.license);
    lines.push(`  { id: ${q(id)}, word: ${q(asset.word)}, category: ${q(asset.category)}, visual: ${q(asset.source_url)}, visualKind: "photo", visualLicense: ${q(license)}, visualSourceUrl: ${q(asset.source_url)}, visualAttribution: ${q(asset.attribution_text)}, syllables: ${JSON.stringify(lex.syllables)}, readingDifficulty: ${lex.difficulty.reading}, writingDifficulty: ${lex.difficulty.writing}, minAge: 4, regions: ["latam"], demoOnly: true },`);
  }
  const cards = `import type { WordCard } from "./index";\n\n/** Reviewed chapter-five wave two: existing approved photographs promoted after curriculum semantic cleanup. */\nexport const TRANSITION_CHAPTER_FIVE_WAVE_TWO_CARDS: WordCard[] = [\n${lines.join("\n")}\n];\n`;
  let published = await readFile(PUBLISHED_PATH, "utf8");
  if (published.includes("TRANSITION_CHAPTER_FIVE_WAVE_TWO_CARDS")) throw new Error("Wave two already published");
  published = replaceOnce(published, 'import { TRANSITION_CHAPTER_FIVE_WAVE_ONE_CARDS } from "./transition-chapter-five-wave-one";', 'import { TRANSITION_CHAPTER_FIVE_WAVE_ONE_CARDS } from "./transition-chapter-five-wave-one";\nimport { TRANSITION_CHAPTER_FIVE_WAVE_TWO_CARDS } from "./transition-chapter-five-wave-two";', "wave-two import");
  published = replaceOnce(published, "  ...TRANSITION_CHAPTER_FIVE_WAVE_ONE_CARDS,\n];", "  ...TRANSITION_CHAPTER_FIVE_WAVE_ONE_CARDS,\n  ...TRANSITION_CHAPTER_FIVE_WAVE_TWO_CARDS,\n];", "wave-two spread");
  await writeFile(OUTPUT_CARDS, cards, "utf8");
  await writeFile(PUBLISHED_PATH, published, "utf8");
  console.log("Published seven existing approved chapter-five photo cards.");
}

async function verify() {
  const [{ CURRICULUM_CHAPTERS }, { DEMO_WORDS }, { contentSlug }, { canPublishAsset, validateAssetCatalog }] = await Promise.all([
    import("../packages/core/src/curriculum"), import("../packages/core/src/index"), import("../packages/core/src/asset-production"), import("../packages/core/src/assets"),
  ]);
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
  const valid = validateAssetCatalog(catalog);
  if (!valid.valid) throw new Error(`Catalog invalid:\n${valid.errors.join("\n")}`);
  const cards = new Map(DEMO_WORDS.map((card) => [`${card.category}\u0000${card.word}`, card]));
  const assets = new Map(catalog.assets.map((asset: any) => [asset.id, asset]));
  const worlds = ["Animales","Casa","Comida","Naturaleza"].map((category) => {
    const chapter = CURRICULUM_CHAPTERS.find((c) => c.category === category && c.chapterNumber === 5)!;
    const concepts = chapter.newWords.map((word) => {
      const id = `${contentSlug(category)}.${contentSlug(word)}`;
      const card = cards.get(`${category}\u0000${word}`), asset: any = assets.get(id);
      return { id, word, card_published: Boolean(card), asset_present: Boolean(asset), asset_type: asset?.asset_type ?? null, asset_review_status: asset?.review_status ?? null, asset_publishable: asset ? canPublishAsset(asset) : false, ready: Boolean(card && asset && canPublishAsset(asset)) };
    });
    return { category, chapter_id: chapter.id, expected_new_words: 16, ready: concepts.filter((x) => x.ready).length, cards_published: concepts.filter((x) => x.card_published).length, assets_publishable: concepts.filter((x) => x.asset_publishable).length, concepts };
  });
  const ready = worlds.reduce((s,w) => s + w.ready, 0), total = 64;
  for (const id of WAVE_TWO_IDS) if (!worlds.flatMap((w) => w.concepts).find((x) => x.id === id)?.ready) throw new Error(`${id}: not ready after wave two`);
  if (ready !== 27) throw new Error(`Expected exactly 27/64 ready after wave two, got ${ready}`);
  const report = { generated_at: new Date().toISOString(), scope: "Curriculum chapter 5 readiness for Animales, Casa, Comida and Naturaleza", readiness_rule: "A concept is ready only when an explicitly published editorial card and a publishable approved local asset both exist.", total_concepts: total, ready_concepts: ready, ready_percent: Math.round((ready/total)*1000)/10, cards_published: worlds.reduce((s,w)=>s+w.cards_published,0), assets_publishable: worlds.reduce((s,w)=>s+w.assets_publishable,0), worlds };
  await mkdir(dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Objective chapter-five readiness: ${ready}/64 (${report.ready_percent}%).`);
}

const mode = process.argv[2] ?? "--apply";
const task = mode === "--apply" ? applyCurriculum : mode === "--publish" ? publishExisting : mode === "--verify" ? verify : null;
if (!task) throw new Error(`Unknown mode ${mode}`);
task().catch((error) => { console.error(error); process.exitCode = 1; });
