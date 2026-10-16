import { readFile, writeFile } from "node:fs/promises";

async function replaceOnce(path, before, after, label) {
  const current = await readFile(path, "utf8");
  const occurrences = current.split(before).length - 1;
  if (occurrences !== 1) throw new Error(`${label}: expected exactly one target occurrence, found ${occurrences}`);
  await writeFile(path, current.replace(before, after), "utf8");
}

const prioritiesPath = "packages/core/src/word-bank/curriculum-priorities.ts";

await replaceOnce(
  prioritiesPath,
  `    [\n      "CURITA", "MEDICINA", "LLANTO", "BOSTEZO", "ESTORNUDO", "FIEBRE", "MAREO", "NÁUSEA",\n      "FUERZA", "HABLAR", "CANTAR", "BEBER", "MIRAR", "ADN", "ANCIANO", "ANCIANA",\n    ],\n  ],\n  Ropa:`,
  `    [\n      "CURITA", "MEDICINA", "LLANTO", "BOSTEZO", "ESTORNUDO", "FIEBRE", "MAREO", "NÁUSEA",\n      "FUERZA", "HABLAR", "CANTAR", "BEBER", "MIRAR", "ADN", "ANCIANO", "ANCIANA",\n    ],\n    [\n      "LABIO", "CRÁNEO", "LATIDO", "SUSPIRO", "CANSANCIO", "DESCANSO", "HERIDA", "DOLOR",\n      "MASCARILLA", "MÉDICO", "MÉDICA", "PEINE", "JABÓN", "ESPONJA", "ADULTO", "LÁGRIMA",\n    ],\n  ],\n  Ropa:`,
  "Cuerpo chapter-four priority",
);

await replaceOnce(
  prioritiesPath,
  `    [\n      "ROJO", "AZUL", "VERDE", "AMARILLO", "NEGRO", "BLANCO", "GRIS", "MARRÓN",\n      "ROSA", "MORADO", "NARANJA", "CARTERA", "COLLAR", "MÁSCARA", "TRAJE", "CHALECO",\n    ],\n  ],\n  Transporte:`,
  `    [\n      "ROJO", "AZUL", "VERDE", "AMARILLO", "NEGRO", "BLANCO", "GRIS", "MARRÓN",\n      "ROSA", "MORADO", "NARANJA", "CARTERA", "COLLAR", "MÁSCARA", "TRAJE", "CHALECO",\n    ],\n    [\n      "CHANCLA", "BOTÍN", "MALETÍN", "ALFILER", "MONÓCULO", "CADENA", "BATA", "TURBANTE",\n      "LAVADO", "PLAYA", "FIESTA", "DEPORTE", "ESCUELA", "LLUVIA", "NIEVE", "OTOÑO",\n    ],\n  ],\n  Transporte:`,
  "Ropa chapter-four priority",
);

await replaceOnce(
  prioritiesPath,
  `    [\n      "FURGONETA", "GRÚA", "MONORRIEL", "KART", "VAGÓN", "ESTACIÓN", "PUENTE", "MOTOR",\n      "NEUMÁTICO", "ASIENTO", "GASOLINA", "APARCAMIENTO", "BILLETE", "PAQUETE", "TRÁILER", "TRINEO",\n    ],\n  ],\n  Escuela:`,
  `    [\n      "FURGONETA", "GRÚA", "MONORRIEL", "KART", "VAGÓN", "ESTACIÓN", "PUENTE", "MOTOR",\n      "NEUMÁTICO", "ASIENTO", "GASOLINA", "APARCAMIENTO", "BILLETE", "PAQUETE", "TRÁILER", "TRINEO",\n    ],\n    [\n      "ESPEJO", "PUERTA", "VENTANILLA", "ELECTRICIDAD", "CHALECO", "AUTOPISTA", "SEÑAL", "PARADA",\n      "TARJETA", "CICLISTA", "PEATÓN", "DERECHA", "IZQUIERDA", "RADAR", "EXTINTOR", "HERRAMIENTA",\n    ],\n  ],\n  Escuela:`,
  "Transporte chapter-four priority",
);

await replaceOnce(
  prioritiesPath,
  `    [\n      "LETRA", "NÚMERO", "PLUMA", "SILLA", "ESTUDIANTE", "EXAMEN", "TRIÁNGULO", "CUADRADO",\n      "CÍRCULO", "ROMBO", "MÚSICA", "ARTE", "DEPORTE", "ROBÓTICA", "PLANETA", "BANDERA",\n    ],\n  ],\n  Juguetes:`,
  `    [\n      "LETRA", "NÚMERO", "PLUMA", "SILLA", "ESTUDIANTE", "EXAMEN", "TRIÁNGULO", "CUADRADO",\n      "CÍRCULO", "ROMBO", "MÚSICA", "ARTE", "DEPORTE", "ROBÓTICA", "PLANETA", "BANDERA",\n    ],\n    [\n      "RECREO", "BAÑO", "ÁNGULO", "GEOGRAFÍA", "FÍSICA", "QUÍMICA", "CIUDAD", "EXPERIMENTO",\n      "TELESCOPIO", "CÁMARA", "INTERNET", "ESCRIBIR", "PENSAR", "SILENCIO", "PARTICIPACIÓN", "CREDENCIAL",\n    ],\n  ],\n  Juguetes:`,
  "Escuela chapter-four priority",
);

await replaceOnce(
  "packages/core/src/transition-published.ts",
  `import { TRANSITION_BLOCK_TEN_CARDS } from "./transition-chapter-block-ten";`,
  `import { TRANSITION_BLOCK_TEN_CARDS } from "./transition-chapter-block-ten";\nimport { TRANSITION_BLOCK_ELEVEN_CARDS } from "./transition-chapter-block-eleven";`,
  "block-eleven transition import",
);

await replaceOnce(
  "packages/core/src/transition-published.ts",
  `  ...TRANSITION_BLOCK_TEN_CARDS,\n];`,
  `  ...TRANSITION_BLOCK_TEN_CARDS,\n  ...TRANSITION_BLOCK_ELEVEN_CARDS,\n];`,
  "block-eleven transition registry",
);

await replaceOnce(
  "package.json",
  `"content:curriculum:verify": "tsx scripts/verify-published-curriculum.ts --chapters=40"`,
  `"content:curriculum:verify": "tsx scripts/verify-published-curriculum.ts --chapters=44"`,
  "curriculum verification limit",
);

await replaceOnce(
  "THIRD_PARTY_ASSETS.md",
  `The exact approved set is intentionally derived from the machine-readable catalog instead of duplicated as a hand-maintained list here. The complete first three curriculum rounds plus the first chapter-four block are now publishable: **40 chapters** across the twelve learning worlds. The canonical catalog contains **688 approved local asset records**; review slots deliberately reuse earlier approved concepts instead of duplicating files. Their local paths, source revision, license, review status and pedagogical difficulty are enforced by \`content/assets.catalog.json\` and CI. Later chapters remain locked until their own new concepts pass the same review gates.`,
  `The exact approved set is intentionally derived from the machine-readable catalog instead of duplicated as a hand-maintained list here. The complete first three curriculum rounds plus the first two chapter-four blocks are now publishable: **44 chapters** across the twelve learning worlds. The canonical catalog contains **752 approved local asset records**; review slots deliberately reuse earlier approved concepts instead of duplicating files. Their local paths, source revision, license, review status and pedagogical difficulty are enforced by \`content/assets.catalog.json\` and CI. Later chapters remain locked until their own new concepts pass the same review gates.`,
  "third-party asset progress summary",
);

console.log("Block eleven activated: second chapter-four priorities, registry, CI limit and docs updated.");
