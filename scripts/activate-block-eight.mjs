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
  `    [\n      "PULGAR", "PUÑO", "PALMADA", "ABRAZO", "BESO", "CAMINAR", "CORRER", "NADAR",\n      "DORMIR", "BEBÉ", "NIÑO", "NIÑA", "HOMBRE", "MUJER", "TERMÓMETRO", "JERINGA",\n    ],\n  ],\n  Ropa:`,
  `    [\n      "PULGAR", "PUÑO", "PALMADA", "ABRAZO", "BESO", "CAMINAR", "CORRER", "NADAR",\n      "DORMIR", "BEBÉ", "NIÑO", "NIÑA", "HOMBRE", "MUJER", "TERMÓMETRO", "JERINGA",\n    ],\n    [\n      "CURITA", "MEDICINA", "LLANTO", "BOSTEZO", "ESTORNUDO", "FIEBRE", "MAREO", "NÁUSEA",\n      "FUERZA", "HABLAR", "CANTAR", "BEBER", "MIRAR", "ADN", "ANCIANO", "ANCIANA",\n    ],\n  ],\n  Ropa:`,
  "Cuerpo chapter-three priority",
);

await replaceOnce(
  prioritiesPath,
  `    [\n      "BLUSA", "CHAQUETA", "SHORT", "ZAPATILLA", "KIMONO", "CORONA", "CASCO", "RELOJ",\n      "LANA", "HILO", "AGUJA", "TIJERA", "LAZO", "TACÓN", "BAÑADOR", "DISFRAZ",\n    ],\n  ],\n  Transporte:`,
  `    [\n      "BLUSA", "CHAQUETA", "SHORT", "ZAPATILLA", "KIMONO", "CORONA", "CASCO", "RELOJ",\n      "LANA", "HILO", "AGUJA", "TIJERA", "LAZO", "TACÓN", "BAÑADOR", "DISFRAZ",\n    ],\n    [\n      "ROJO", "AZUL", "VERDE", "AMARILLO", "NEGRO", "BLANCO", "GRIS", "MARRÓN",\n      "ROSA", "MORADO", "NARANJA", "CARTERA", "COLLAR", "MÁSCARA", "TRAJE", "CHALECO",\n    ],\n  ],\n  Transporte:`,
  "Ropa chapter-three priority",
);

await replaceOnce(
  prioritiesPath,
  `    [\n      "CAMIONETA", "TELEFÉRICO", "PARACAÍDAS", "TROLEBÚS", "SCOOTER", "LOCOMOTORA", "AVIONETA", "CRUCERO",\n      "YATE", "ASCENSOR", "RUEDA", "GASOLINERA", "CARRETERA", "SEMÁFORO", "EQUIPAJE", "PATINETE",\n    ],\n  ],\n  Escuela:`,
  `    [\n      "CAMIONETA", "TELEFÉRICO", "PARACAÍDAS", "TROLEBÚS", "SCOOTER", "LOCOMOTORA", "AVIONETA", "CRUCERO",\n      "YATE", "ASCENSOR", "RUEDA", "GASOLINERA", "CARRETERA", "SEMÁFORO", "EQUIPAJE", "PATINETE",\n    ],\n    [\n      "FURGONETA", "GRÚA", "MONORRIEL", "KART", "VAGÓN", "ESTACIÓN", "PUENTE", "MOTOR",\n      "NEUMÁTICO", "ASIENTO", "GASOLINA", "APARCAMIENTO", "BILLETE", "PAQUETE", "TRÁILER", "TRINEO",\n    ],\n  ],\n  Escuela:`,
  "Transporte chapter-three priority",
);

await replaceOnce(
  prioritiesPath,
  `    [\n      "BIBLIOTECA", "ACUARELA", "ÁBACO", "LABORATORIO", "ALUMNO", "TAREA", "PREGUNTA", "SUMA",\n      "RESTA", "MULTIPLICACIÓN", "DIVISIÓN", "BIOLOGÍA", "MICROSCOPIO", "PROYECTOR", "AURICULAR", "TROFEO",\n    ],\n  ],\n  Juguetes:`,
  `    [\n      "BIBLIOTECA", "ACUARELA", "ÁBACO", "LABORATORIO", "ALUMNO", "TAREA", "PREGUNTA", "SUMA",\n      "RESTA", "MULTIPLICACIÓN", "DIVISIÓN", "BIOLOGÍA", "MICROSCOPIO", "PROYECTOR", "AURICULAR", "TROFEO",\n    ],\n    [\n      "LETRA", "NÚMERO", "PLUMA", "SILLA", "ESTUDIANTE", "EXAMEN", "TRIÁNGULO", "CUADRADO",\n      "CÍRCULO", "ROMBO", "MÚSICA", "ARTE", "DEPORTE", "ROBÓTICA", "PLANETA", "BANDERA",\n    ],\n  ],\n  Juguetes:`,
  "Escuela chapter-three priority",
);

await replaceOnce(
  "packages/core/src/transition-published.ts",
  `import { TRANSITION_BLOCK_SEVEN_CARDS } from "./transition-chapter-block-seven";`,
  `import { TRANSITION_BLOCK_SEVEN_CARDS } from "./transition-chapter-block-seven";\nimport { TRANSITION_BLOCK_EIGHT_CARDS } from "./transition-chapter-block-eight";`,
  "block-eight transition import",
);

await replaceOnce(
  "packages/core/src/transition-published.ts",
  `  ...TRANSITION_BLOCK_SEVEN_CARDS,\n];`,
  `  ...TRANSITION_BLOCK_SEVEN_CARDS,\n  ...TRANSITION_BLOCK_EIGHT_CARDS,\n];`,
  "block-eight transition registry",
);

await replaceOnce(
  "package.json",
  `"content:curriculum:verify": "tsx scripts/verify-published-curriculum.ts --chapters=28"`,
  `"content:curriculum:verify": "tsx scripts/verify-published-curriculum.ts --chapters=32"`,
  "curriculum verification limit",
);

await replaceOnce(
  "THIRD_PARTY_ASSETS.md",
  `The exact approved set is intentionally derived from the machine-readable catalog instead of duplicated as a hand-maintained list here. The complete first two curriculum rounds plus the first chapter-three block are now publishable: **28 chapters** across the twelve learning worlds. The canonical catalog contains **496 approved local asset records**; review slots deliberately reuse earlier approved concepts instead of duplicating files. Their local paths, source revision, license, review status and pedagogical difficulty are enforced by \`content/assets.catalog.json\` and CI. Later chapters remain locked until their own new concepts pass the same review gates.`,
  `The exact approved set is intentionally derived from the machine-readable catalog instead of duplicated as a hand-maintained list here. The complete first two curriculum rounds plus the first two chapter-three blocks are now publishable: **32 chapters** across the twelve learning worlds. The canonical catalog contains **560 approved local asset records**; review slots deliberately reuse earlier approved concepts instead of duplicating files. Their local paths, source revision, license, review status and pedagogical difficulty are enforced by \`content/assets.catalog.json\` and CI. Later chapters remain locked until their own new concepts pass the same review gates.`,
  "third-party asset progress summary",
);

console.log("Block eight activated: Cuerpo/Ropa/Transporte/Escuela chapter-three priorities, registry, CI limit and docs updated.");
