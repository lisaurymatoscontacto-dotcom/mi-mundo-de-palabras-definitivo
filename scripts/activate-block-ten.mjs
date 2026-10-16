import { readFile, writeFile } from "node:fs/promises";

async function replaceOnce(path, before, after, label) {
  const current = await readFile(path, "utf8");
  const occurrences = current.split(before).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${label}: expected exactly one target occurrence, found ${occurrences}`);
  }
  await writeFile(path, current.replace(before, after), "utf8");
}

const prioritiesPath = "packages/core/src/word-bank/curriculum-priorities.ts";

await replaceOnce(
  prioritiesPath,
  `    [\n      "ARDILLA", "CASTOR", "NUTRIA", "MAPACHE", "ERIZO", "LEOPARDO", "BISONTE", "BÚFALO",\n      "CAMELLO", "DROMEDARIO", "LLAMA", "CANGURO", "PEREZOSO", "HAMSTER", "CISNE", "PAVO",\n    ],\n  ],\n  Casa:`,
  `    [\n      "ARDILLA", "CASTOR", "NUTRIA", "MAPACHE", "ERIZO", "LEOPARDO", "BISONTE", "BÚFALO",\n      "CAMELLO", "DROMEDARIO", "LLAMA", "CANGURO", "PEREZOSO", "HAMSTER", "CISNE", "PAVO",\n    ],\n    [\n      "GALLO", "GALLINA", "POLLO", "GANSO", "FLAMENCO", "LORO", "PALOMA", "SERPIENTE",\n      "TIBURÓN", "PULPO", "CALAMAR", "MEDUSA", "CANGREJO", "LANGOSTA", "CAMARÓN", "CARACOL",\n    ],\n  ],\n  Casa:`,
  "Animales chapter-four priority",
);

await replaceOnce(
  prioritiesPath,
  `    [\n      "ESPONJA", "CUENCO", "BATERÍA", "ALTAVOZ", "LADRILLO", "DESTORNILLADOR", "TIJERA", "BOLSA",\n      "MALETA", "PAPELERA", "VELA", "ABANICO", "JARRÓN", "MACETA", "CALENDARIO", "ALARMA",\n    ],\n  ],\n  Comida:`,
  `    [\n      "ESPONJA", "CUENCO", "BATERÍA", "ALTAVOZ", "LADRILLO", "DESTORNILLADOR", "TIJERA", "BOLSA",\n      "MALETA", "PAPELERA", "VELA", "ABANICO", "JARRÓN", "MACETA", "CALENDARIO", "ALARMA",\n    ],\n    [\n      "FRASCO", "PEINE", "AFEITADORA", "GRIFO", "BALANZA", "GUANTE", "TIMBRE", "COMPUTADORA",\n      "RATÓN", "TORNILLO", "SERRUCHO", "GANCHO", "CLIP", "AGUJA", "HILO", "PORTARRETRATO",\n    ],\n  ],\n  Comida:`,
  "Casa chapter-four priority",
);

await replaceOnce(
  prioritiesPath,
  `    [\n      "SAL", "ENSALADA", "PASTA", "DURAZNO", "ARÁNDANO", "CALABAZA", "PIMIENTO", "CEBOLLA",\n      "AJO", "GUISANTE", "TOCINO", "HAMBURGUESA", "MANTEQUILLA", "SUSHI", "TACO", "SÁNDWICH",\n    ],\n  ],\n  Naturaleza:`,
  `    [\n      "SAL", "ENSALADA", "PASTA", "DURAZNO", "ARÁNDANO", "CALABAZA", "PIMIENTO", "CEBOLLA",\n      "AJO", "GUISANTE", "TOCINO", "HAMBURGUESA", "MANTEQUILLA", "SUSHI", "TACO", "SÁNDWICH",\n    ],\n    [\n      "POLLO", "CARNE", "CAMARÓN", "CANGREJO", "LANGOSTA", "PULPO", "CALAMAR", "PAELLA",\n      "BURRITO", "CAFÉ", "TÉ", "AGUA", "JUGO", "DONA", "FLAN", "MANÍ",\n    ],\n  ],\n  Naturaleza:`,
  "Comida chapter-four priority",
);

await replaceOnce(
  prioritiesPath,
  `    [\n      "FRÍO", "HURACÁN", "ATARDECER", "TEMPERATURA", "TRÉBOL", "COMETA", "NORTE", "SUR",\n      "ESTE", "OESTE", "PRIMAVERA", "OTOÑO", "INVIERNO", "PAISAJE", "FAUNA", "HORIZONTE",\n    ],\n  ],\n  Cuerpo:`,
  `    [\n      "FRÍO", "HURACÁN", "ATARDECER", "TEMPERATURA", "TRÉBOL", "COMETA", "NORTE", "SUR",\n      "ESTE", "OESTE", "PRIMAVERA", "OTOÑO", "INVIERNO", "PAISAJE", "FAUNA", "HORIZONTE",\n    ],\n    [\n      "ARCE", "BROTE", "TRONCO", "HIERBA", "TERMAS", "METEORO", "OLEAJE", "PLANETA",\n      "SATÉLITE", "GALAXIA", "BRISA", "CALOR", "ARRECIFE", "CORDILLERA", "LUZ", "CONTINENTE",\n    ],\n  ],\n  Cuerpo:`,
  "Naturaleza chapter-four priority",
);

await replaceOnce(
  "packages/core/src/transition-published.ts",
  `import { TRANSITION_BLOCK_NINE_CARDS } from "./transition-chapter-block-nine";`,
  `import { TRANSITION_BLOCK_NINE_CARDS } from "./transition-chapter-block-nine";\nimport { TRANSITION_BLOCK_TEN_CARDS } from "./transition-chapter-block-ten";`,
  "block-ten transition import",
);

await replaceOnce(
  "packages/core/src/transition-published.ts",
  `  ...TRANSITION_BLOCK_NINE_CARDS,\n];`,
  `  ...TRANSITION_BLOCK_NINE_CARDS,\n  ...TRANSITION_BLOCK_TEN_CARDS,\n];`,
  "block-ten transition registry",
);

await replaceOnce(
  "package.json",
  `"content:curriculum:verify": "tsx scripts/verify-published-curriculum.ts --chapters=36"`,
  `"content:curriculum:verify": "tsx scripts/verify-published-curriculum.ts --chapters=40"`,
  "curriculum verification limit",
);

await replaceOnce(
  "THIRD_PARTY_ASSETS.md",
  `The exact approved set is intentionally derived from the machine-readable catalog instead of duplicated as a hand-maintained list here. The complete first three curriculum rounds are now publishable: **36 chapters** across the twelve learning worlds. The canonical catalog contains **624 approved local asset records**; review slots deliberately reuse earlier approved concepts instead of duplicating files. Their local paths, source revision, license, review status and pedagogical difficulty are enforced by \`content/assets.catalog.json\` and CI. Later chapters remain locked until their own new concepts pass the same review gates.`,
  `The exact approved set is intentionally derived from the machine-readable catalog instead of duplicated as a hand-maintained list here. The complete first three curriculum rounds plus the first chapter-four block are now publishable: **40 chapters** across the twelve learning worlds. The canonical catalog contains **688 approved local asset records**; review slots deliberately reuse earlier approved concepts instead of duplicating files. Their local paths, source revision, license, review status and pedagogical difficulty are enforced by \`content/assets.catalog.json\` and CI. Later chapters remain locked until their own new concepts pass the same review gates.`,
  "third-party asset progress summary",
);

console.log("Block ten activated: first chapter-four priorities, registry, CI limit and docs updated.");
