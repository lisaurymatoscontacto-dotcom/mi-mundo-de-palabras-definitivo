import { readFile, writeFile } from "node:fs/promises";

const prioritiesPath = "packages/core/src/word-bank/curriculum-priorities.ts";
const registryPath = "packages/core/src/transition-published.ts";
const packagePath = "package.json";
const docsPath = "THIRD_PARTY_ASSETS.md";
const outputPath = "packages/core/src/transition-chapter-block-twelve.ts";

function slug(value) {
  return value.replace(/ñ/g, "ny").replace(/Ñ/g, "NY").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function replaceOnce(path, before, after, label) {
  const current = await readFile(path, "utf8");
  const occurrences = current.split(before).length - 1;
  if (occurrences !== 1) throw new Error(`${label}: expected exactly one target occurrence, found ${occurrences}`);
  await writeFile(path, current.replace(before, after), "utf8");
}

const ocean = JSON.parse(await readFile("content/asset-reviews/ocean-chapter-four.json", "utf8"));
const space = JSON.parse(await readFile("content/asset-reviews/space-chapter-four.json", "utf8"));
const catalog = JSON.parse(await readFile("content/assets.catalog.json", "utf8"));
const catalogById = new Map(catalog.assets.map((asset) => [asset.id, asset]));

if (ocean.status !== "approved" || ocean.assets.length !== 16 || ocean.assets.some((asset) => asset.visual_review !== "approved")) {
  throw new Error("Ocean 4 must contain exactly 16 explicitly approved photos before block twelve activation.");
}
if (space.status !== "approved_with_one_rejection" || space.assets.length !== 16) {
  throw new Error("Space 4 must have the guarded 15-approved/1-rejected editorial decision before activation.");
}
const spaceApproved = space.assets.filter((asset) => asset.visual_review === "approved");
const spaceRejected = space.assets.filter((asset) => asset.visual_review === "rejected");
if (spaceApproved.length !== 15 || spaceRejected.length !== 1 || spaceRejected[0].id !== "espacio.supernova") {
  throw new Error("Space 4 requires exactly 15 approved photos and SUPERNOVA as the sole rejected candidate.");
}
for (const item of [...ocean.assets, ...spaceApproved]) {
  const asset = catalogById.get(item.id);
  if (!asset || asset.review_status !== "approved" || asset.asset_type !== "photo" || !asset.verified || !asset.asset_path || !asset.thumbnail_path) {
    throw new Error(`${item.id}: manifest approval does not match a complete approved local photo record.`);
  }
  if (asset.source_url !== item.source_url || asset.license !== item.license) throw new Error(`${item.id}: manifest/catalog provenance mismatch.`);
}
const rejectedRecord = catalogById.get("espacio.supernova");
if (!rejectedRecord || rejectedRecord.review_status !== "rejected") throw new Error("SUPERNOVA must remain rejected and excluded from publication.");

const juguetes = [
  ["CORONA","👑",["CO","RO","NA"],2,3], ["COCHE","🚗",["CO","CHE"],2,3], ["BARCO","🚢",["BAR","CO"],2,3], ["CAMIÓN","🚚",["CA","MIÓN"],2,3],
  ["GRÚA","🏗️",["GRÚ","A"],2,3], ["CAJA","📦",["CA","JA"],2,3], ["DOCTOR","🧑‍⚕️",["DOC","TOR"],2,3], ["HERRAMIENTA","🛠️",["HE","RRA","MIEN","TA"],3,4],
  ["MARTILLO","🔨",["MAR","TI","LLO"],2,3], ["CASA","🏠",["CA","SA"],2,3], ["TIENDA","🏪",["TIEN","DA"],2,3], ["PARACAÍDAS","🪂",["PA","RA","CA","Í","DAS"],3,4],
  ["CRAYÓN","🖍️",["CRA","YÓN"],3,3], ["ASTRONAUTA","🧑‍🚀",["AS","TRO","NAU","TA"],3,4], ["REY","🤴",["REY"],2,3], ["REINA","👸",["REI","NA"],2,3],
];
const granja = [
  ["PERRO","🐕",["PE","RRO"],2,3], ["GATO","🐈",["GA","TO"],2,3], ["RATÓN","🐁",["RA","TÓN"],2,3], ["LECHUZA","🦉",["LE","CHU","ZA"],2,3],
  ["RANA","🐸",["RA","NA"],2,3], ["FRIJOL","🫘",["FRI","JOL"],2,3], ["BATATA","🍠",["BA","TA","TA"],2,3], ["MANGO","🥭",["MAN","GO"],2,3],
  ["BANANA","🍌",["BA","NA","NA"],2,3], ["PIÑA","🍍",["PI","ÑA"],2,3], ["COCO","🥥",["CO","CO"],2,3], ["AGUACATE","🥑",["A","GUA","CA","TE"],3,3],
  ["PERA","🍐",["PE","RA"],2,3], ["MARTILLO","🔨",["MAR","TI","LLO"],2,3], ["SERRUCHO","🪚",["SE","RRU","CHO"],3,3], ["BALDE","🪣",["BAL","DE"],2,3],
];
const oceanSyllables = new Map([
  ["ORCA",["OR","CA"]], ["NARVAL",["NAR","VAL"]], ["BELUGA",["BE","LU","GA"]], ["MANATÍ",["MA","NA","TÍ"]], ["CACHALOTE",["CA","CHA","LO","TE"]],
  ["MORSA",["MOR","SA"]], ["MANTA",["MAN","TA"]], ["PEZPAYASO",["PEZ","PA","YA","SO"]], ["BARRACUDA",["BA","RRA","CU","DA"]], ["MORENA",["MO","RE","NA"]],
  ["ESTRELLA",["ES","TRE","LLA"]], ["ERIZODEMAR",["E","RI","ZO","DE","MAR"]], ["PELICANO",["PE","LI","CA","NO"]], ["ALBATROS",["AL","BA","TROS"]],
  ["GAVIOTA",["GA","VIO","TA"]], ["FRAILECILLO",["FRAI","LE","CI","LLO"]],
]);
const spaceSyllables = new Map([
  ["MERCURIO",["MER","CU","RIO"]], ["VENUS",["VE","NUS"]], ["MARTE",["MAR","TE"]], ["JÚPITER",["JÚ","PI","TER"]], ["SATURNO",["SA","TUR","NO"]],
  ["URANO",["U","RA","NO"]], ["NEPTUNO",["NEP","TU","NO"]], ["PLUTÓN",["PLU","TÓN"]], ["CERES",["CE","RES"]], ["ANDRÓMEDA",["AN","DRÓ","ME","DA"]],
  ["NEBULOSA",["NE","BU","LO","SA"]], ["ROVER",["RO","VER"]], ["ESTACIÓN",["ES","TA","CIÓN"]], ["TRANSBORDADOR",["TRANS","BOR","DA","DOR"]], ["AURORA",["AU","RO","RA"]],
]);
const oceanOrder = ["ORCA","NARVAL","BELUGA","MANATÍ","CACHALOTE","MORSA","MANTA","PEZPAYASO","BARRACUDA","MORENA","ESTRELLA","ERIZODEMAR","PELICANO","ALBATROS","GAVIOTA","FRAILECILLO"];
const spaceOrder = ["MERCURIO","VENUS","MARTE","JÚPITER","SATURNO","URANO","NEPTUNO","PLUTÓN","CERES","ANDRÓMEDA","NEBULOSA","ROVER","ESTACIÓN","TRANSBORDADOR","AURORA"];

function reviewByWord(document) { return new Map(document.assets.map((item) => [item.word, item])); }
const oceanByWord = reviewByWord(ocean); const spaceByWord = reviewByWord(space);
for (const word of oceanOrder) if (!oceanByWord.has(word)) throw new Error(`Ocean reviewed photo missing: ${word}`);
for (const word of spaceOrder) if (!spaceByWord.has(word)) throw new Error(`Space reviewed photo missing: ${word}`);

function emojiLine(category, [word, emoji, syllables, reading, writing]) {
  return `  card(${JSON.stringify(`${slug(category)}.${slug(word)}`)}, ${JSON.stringify(word)}, ${JSON.stringify(category)}, ${JSON.stringify(emoji)}, ${JSON.stringify(syllables)}, ${reading}, ${writing}),`;
}
function photoLine(category, word, syllables, reviewItem, reading = 3, writing = 4) {
  const license = reviewItem.license === "CC0-1.0" ? "cc0-1.0" : "public-domain";
  return `  photoCard(${JSON.stringify(`${slug(category)}.${slug(word)}`)}, ${JSON.stringify(word)}, ${JSON.stringify(category)}, ${JSON.stringify(reviewItem.source_url)}, ${JSON.stringify(license)}, ${JSON.stringify(syllables)}, ${reading}, ${writing}),`;
}

const source = `import type { VisualLicense, WordCard } from "./index";\n\nfunction card(id: string, word: string, category: string, visual: string, syllables: string[], readingDifficulty = 2, writingDifficulty = Math.min(6, readingDifficulty + 1)): WordCard {\n  return { id, word, category, visual, visualKind: "emoji", visualLicense: "unicode-emoji", syllables, readingDifficulty, writingDifficulty, minAge: 4, regions: ["latam"], demoOnly: true };\n}\n\nfunction photoCard(id: string, word: string, category: string, sourceUrl: string, visualLicense: Extract<VisualLicense, "public-domain" | "cc0-1.0">, syllables: string[], readingDifficulty = 3, writingDifficulty = 4): WordCard {\n  return { id, word, category, visual: sourceUrl, visualKind: "photo", visualLicense, visualSourceUrl: sourceUrl, syllables, readingDifficulty, writingDifficulty, minAge: 4, regions: ["latam"], demoOnly: true };\n}\n\n/** Final chapter-four block. Photos are referenced only after independent legal + visual approval. */\nexport const TRANSITION_BLOCK_TWELVE_CARDS: WordCard[] = [\n  // Juguetes 4\n${juguetes.map((item) => emojiLine("Juguetes", item)).join("\n")}\n\n  // Océano 4 — explicitly approved local CC0/Public Domain photographs.\n${oceanOrder.map((word) => photoLine("Océano", word, oceanSyllables.get(word), oceanByWord.get(word))).join("\n")}\n\n  // Espacio 4 — fifteen reviewed NASA/Commons photographs + one direct lunar-phase emoji.\n${spaceOrder.map((word) => photoLine("Espacio", word, spaceSyllables.get(word), spaceByWord.get(word), word === "TRANSBORDADOR" ? 4 : 3, 4)).join("\n")}\n  card("espacio.llena", "LLENA", "Espacio", "🌕", ["LLE", "NA"], 2, 3),\n\n  // Granja 4\n${granja.map((item) => emojiLine("Granja", item)).join("\n")}\n];\n`;
await writeFile(outputPath, source, "utf8");

await replaceOnce(prioritiesPath,
`    [\n      "ARO", "BLOQUE", "CASTILLO", "ESPADA", "ESCUDO", "VARITA", "PIRATA", "CABALLITO",\n      "TREN", "HELICÓPTERO", "TRACTOR", "AMBULANCIA", "CARPA", "TOBOGÁN", "IMÁN", "TELESCOPIO",\n    ],\n  ],\n  "Océano":`,
`    [\n      "ARO", "BLOQUE", "CASTILLO", "ESPADA", "ESCUDO", "VARITA", "PIRATA", "CABALLITO",\n      "TREN", "HELICÓPTERO", "TRACTOR", "AMBULANCIA", "CARPA", "TOBOGÁN", "IMÁN", "TELESCOPIO",\n    ],\n    [\n      "CORONA", "COCHE", "BARCO", "CAMIÓN", "GRÚA", "CAJA", "DOCTOR", "HERRAMIENTA",\n      "MARTILLO", "CASA", "TIENDA", "PARACAÍDAS", "CRAYÓN", "ASTRONAUTA", "REY", "REINA",\n    ],\n  ],\n  "Océano":`, "Juguetes chapter-four priority");

await replaceOnce(prioritiesPath,
`    [\n      "CARACOL", "ROCA", "SAL", "AGUA", "FERRY", "CANOA", "LANCHA", "RADAR",\n      "BRISA", "RESIDUO", "ANZUELO", "CAÑA", "VOLCÁN", "MUSEO", "LARVA", "TORMENTA",\n    ],\n  ],\n  Espacio:`,
`    [\n      "CARACOL", "ROCA", "SAL", "AGUA", "FERRY", "CANOA", "LANCHA", "RADAR",\n      "BRISA", "RESIDUO", "ANZUELO", "CAÑA", "VOLCÁN", "MUSEO", "LARVA", "TORMENTA",\n    ],\n    [\n      "ORCA", "NARVAL", "BELUGA", "MANATÍ", "CACHALOTE", "MORSA", "MANTA", "PEZPAYASO",\n      "BARRACUDA", "MORENA", "ESTRELLA", "ERIZODEMAR", "PELICANO", "ALBATROS", "GAVIOTA", "FRAILECILLO",\n    ],\n  ],\n  Espacio:`, "Océano chapter-four priority");

await replaceOnce(prioritiesPath,
`    [\n      "COMETA", "CIENTÍFICO", "PESO", "PILOTO", "COMBUSTIBLE", "RADAR", "LANZAMIENTO", "EXPEDICIÓN",\n      "ASTRONOMÍA", "AÑO", "BIGBANG", "MAGNETISMO", "VOLCÁN", "VALLE", "DUNA", "EXPERIMENTO",\n    ],\n  ],\n  Granja:`,
`    [\n      "COMETA", "CIENTÍFICO", "PESO", "PILOTO", "COMBUSTIBLE", "RADAR", "LANZAMIENTO", "EXPEDICIÓN",\n      "ASTRONOMÍA", "AÑO", "BIGBANG", "MAGNETISMO", "VOLCÁN", "VALLE", "DUNA", "EXPERIMENTO",\n    ],\n    [\n      "MERCURIO", "VENUS", "MARTE", "JÚPITER", "SATURNO", "URANO", "NEPTUNO", "PLUTÓN",\n      "CERES", "ANDRÓMEDA", "NEBULOSA", "ROVER", "ESTACIÓN", "TRANSBORDADOR", "AURORA", "LLENA",\n    ],\n  ],\n  Granja:`, "Espacio chapter-four priority");

await replaceOnce(prioritiesPath,
`    [\n      "CARNERO", "POLLITO", "PLUMA", "ALA", "LANA", "LECHE", "MIEL", "ABEJA",\n      "LOMBRIZ", "MARIPOSA", "MARIQUITA", "GIRASOL", "MANÍ", "AJO", "BRÓCOLI", "HACHA",\n    ],\n  ],\n};`,
`    [\n      "CARNERO", "POLLITO", "PLUMA", "ALA", "LANA", "LECHE", "MIEL", "ABEJA",\n      "LOMBRIZ", "MARIPOSA", "MARIQUITA", "GIRASOL", "MANÍ", "AJO", "BRÓCOLI", "HACHA",\n    ],\n    [\n      "PERRO", "GATO", "RATÓN", "LECHUZA", "RANA", "FRIJOL", "BATATA", "MANGO",\n      "BANANA", "PIÑA", "COCO", "AGUACATE", "PERA", "MARTILLO", "SERRUCHO", "BALDE",\n    ],\n  ],\n};`, "Granja chapter-four priority");

await replaceOnce(registryPath,
`import { TRANSITION_BLOCK_ELEVEN_CARDS } from "./transition-chapter-block-eleven";`,
`import { TRANSITION_BLOCK_ELEVEN_CARDS } from "./transition-chapter-block-eleven";\nimport { TRANSITION_BLOCK_TWELVE_CARDS } from "./transition-chapter-block-twelve";`, "block twelve import");
await replaceOnce(registryPath,
`  ...TRANSITION_BLOCK_ELEVEN_CARDS,\n];`,
`  ...TRANSITION_BLOCK_ELEVEN_CARDS,\n  ...TRANSITION_BLOCK_TWELVE_CARDS,\n];`, "block twelve registry");
await replaceOnce(packagePath,
`"content:curriculum:verify": "tsx scripts/verify-published-curriculum.ts --chapters=44"`,
`"content:curriculum:verify": "tsx scripts/verify-published-curriculum.ts --chapters=48"`, "curriculum verify 44 to 48");
await replaceOnce(docsPath,
`The exact approved set is intentionally derived from the machine-readable catalog instead of duplicated as a hand-maintained list here. The complete first three curriculum rounds plus the first two chapter-four blocks are now publishable: **44 chapters** across the twelve learning worlds. The canonical catalog contains **752 approved local asset records**; review slots deliberately reuse earlier approved concepts instead of duplicating files. Their local paths, source revision, license, review status and pedagogical difficulty are enforced by \`content/assets.catalog.json\` and CI. Later chapters remain locked until their own new concepts pass the same review gates.`,
`The exact approved set is intentionally derived from the machine-readable catalog instead of duplicated as a hand-maintained list here. The first four curriculum rounds are now complete and publishable: **48 chapters** across the twelve learning worlds. The canonical catalog contains **816 approved local asset records**; review slots deliberately reuse earlier approved concepts instead of duplicating files. Their local paths, source revision, license, review status and pedagogical difficulty are enforced by \`content/assets.catalog.json\` and CI. A rejected SUPERNOVA photo remains cataloged but excluded because it depicts the Crab Nebula remnant rather than the event itself. Later chapters remain locked until their own new concepts pass the same review gates.`, "asset progress summary");

console.log("Block twelve activated from guarded Ocean/Space review manifests: 48 chapters configured; target 816 approved assets after materialization.");
