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
  `    [\n      "AJEDREZ", "BOLOS", "DIANA", "BUMERÁN", "PATINETE", "FLAUTA", "PATINES", "BICICLETA",\n      "PINTURA", "PINCEL", "LUPA", "BRÚJULA", "DRAGÓN", "HADA", "PRINCESA", "BIBERÓN",\n    ],\n  ],\n  "Océano":`,
  `    [\n      "AJEDREZ", "BOLOS", "DIANA", "BUMERÁN", "PATINETE", "FLAUTA", "PATINES", "BICICLETA",\n      "PINTURA", "PINCEL", "LUPA", "BRÚJULA", "DRAGÓN", "HADA", "PRINCESA", "BIBERÓN",\n    ],\n    [\n      "ARO", "BLOQUE", "CASTILLO", "ESPADA", "ESCUDO", "VARITA", "PIRATA", "CABALLITO",\n      "TREN", "HELICÓPTERO", "TRACTOR", "AMBULANCIA", "CARPA", "TOBOGÁN", "IMÁN", "TELESCOPIO",\n    ],\n  ],\n  "Océano":`,
  "Juguetes chapter-three priority",
);

await replaceOnce(
  prioritiesPath,
  `    [\n      "PLAYA", "ISLA", "KAYAK", "YATE", "CRUCERO", "BRÚJULA", "BUZO", "NADADOR",\n      "SURFISTA", "PESCADOR", "SALVAVIDAS", "TESORO", "MAPA", "RECICLAJE", "SIRENA", "HURACÁN",\n    ],\n  ],\n  Espacio:`,
  `    [\n      "PLAYA", "ISLA", "KAYAK", "YATE", "CRUCERO", "BRÚJULA", "BUZO", "NADADOR",\n      "SURFISTA", "PESCADOR", "SALVAVIDAS", "TESORO", "MAPA", "RECICLAJE", "SIRENA", "HURACÁN",\n    ],\n    [\n      "CARACOL", "ROCA", "SAL", "AGUA", "FERRY", "CANOA", "LANCHA", "RADAR",\n      "BRISA", "RESIDUO", "ANZUELO", "CAÑA", "VOLCÁN", "MUSEO", "LARVA", "TORMENTA",\n    ],\n  ],\n  Espacio:`,
  "Océano chapter-three priority",
);

await replaceOnce(
  prioritiesPath,
  `    [\n      "RADIACIÓN", "LUZ", "ENERGÍA", "ROTACIÓN", "HIELO", "ROCA", "METAL", "MOTOR",\n      "BATERÍA", "DESPEGUE", "ATERRIZAJE", "NAVEGACIÓN", "SEÑAL", "CONTROL", "TIEMPO", "DISTANCIA",\n    ],\n  ],\n  Granja:`,
  `    [\n      "RADIACIÓN", "LUZ", "ENERGÍA", "ROTACIÓN", "HIELO", "ROCA", "METAL", "MOTOR",\n      "BATERÍA", "DESPEGUE", "ATERRIZAJE", "NAVEGACIÓN", "SEÑAL", "CONTROL", "TIEMPO", "DISTANCIA",\n    ],\n    [\n      "COMETA", "CIENTÍFICO", "PESO", "PILOTO", "COMBUSTIBLE", "RADAR", "LANZAMIENTO", "EXPEDICIÓN",\n      "ASTRONOMÍA", "AÑO", "BIGBANG", "MAGNETISMO", "VOLCÁN", "VALLE", "DUNA", "EXPERIMENTO",\n    ],\n  ],\n  Granja:`,
  "Espacio chapter-three priority",
);

await replaceOnce(
  prioritiesPath,
  `    [\n      "TRIGO", "PAPA", "TOMATE", "ZANAHORIA", "CALABAZA", "MANZANA", "NARANJA", "LIMÓN",\n      "FRESA", "UVA", "SANDÍA", "MELÓN", "PIMIENTO", "BERENJENA", "PEPINO", "CEBOLLA",\n    ],\n  ],\n};`,
  `    [\n      "TRIGO", "PAPA", "TOMATE", "ZANAHORIA", "CALABAZA", "MANZANA", "NARANJA", "LIMÓN",\n      "FRESA", "UVA", "SANDÍA", "MELÓN", "PIMIENTO", "BERENJENA", "PEPINO", "CEBOLLA",\n    ],\n    [\n      "CARNERO", "POLLITO", "PLUMA", "ALA", "LANA", "LECHE", "MIEL", "ABEJA",\n      "LOMBRIZ", "MARIPOSA", "MARIQUITA", "GIRASOL", "MANÍ", "AJO", "BRÓCOLI", "HACHA",\n    ],\n  ],\n};`,
  "Granja chapter-three priority",
);

await replaceOnce(
  "packages/core/src/transition-published.ts",
  `import { TRANSITION_BLOCK_EIGHT_CARDS } from "./transition-chapter-block-eight";`,
  `import { TRANSITION_BLOCK_EIGHT_CARDS } from "./transition-chapter-block-eight";\nimport { TRANSITION_BLOCK_NINE_CARDS } from "./transition-chapter-block-nine";`,
  "block-nine transition import",
);

await replaceOnce(
  "packages/core/src/transition-published.ts",
  `  ...TRANSITION_BLOCK_EIGHT_CARDS,\n];`,
  `  ...TRANSITION_BLOCK_EIGHT_CARDS,\n  ...TRANSITION_BLOCK_NINE_CARDS,\n];`,
  "block-nine transition registry",
);

await replaceOnce(
  "package.json",
  `"content:curriculum:verify": "tsx scripts/verify-published-curriculum.ts --chapters=32"`,
  `"content:curriculum:verify": "tsx scripts/verify-published-curriculum.ts --chapters=36"`,
  "curriculum verification limit",
);

await replaceOnce(
  "THIRD_PARTY_ASSETS.md",
  `The exact approved set is intentionally derived from the machine-readable catalog instead of duplicated as a hand-maintained list here. The complete first two curriculum rounds plus the first two chapter-three blocks are now publishable: **32 chapters** across the twelve learning worlds. The canonical catalog contains **560 approved local asset records**; review slots deliberately reuse earlier approved concepts instead of duplicating files. Their local paths, source revision, license, review status and pedagogical difficulty are enforced by \`content/assets.catalog.json\` and CI. Later chapters remain locked until their own new concepts pass the same review gates.`,
  `The exact approved set is intentionally derived from the machine-readable catalog instead of duplicated as a hand-maintained list here. The complete first three curriculum rounds are now publishable: **36 chapters** across the twelve learning worlds. The canonical catalog contains **624 approved local asset records**; review slots deliberately reuse earlier approved concepts instead of duplicating files. Their local paths, source revision, license, review status and pedagogical difficulty are enforced by \`content/assets.catalog.json\` and CI. Later chapters remain locked until their own new concepts pass the same review gates.`,
  "third-party asset progress summary",
);

console.log("Block nine activated: all chapter-three world priorities, registry, CI limit and docs updated.");
