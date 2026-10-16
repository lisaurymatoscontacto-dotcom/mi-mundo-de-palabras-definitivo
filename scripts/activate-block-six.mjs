import { readFile, writeFile } from "node:fs/promises";

function replaceOnce(source, label, before, after) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Activation anchor not found: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Activation anchor not unique: ${label}`);
  return source.slice(0, first) + after + source.slice(first + before.length);
}

const bankPath = "packages/core/src/word-bank/index.ts";
let bank = await readFile(bankPath, "utf8");
bank = replaceOnce(
  bank,
  "replace anglicism in Juguetes 2",
  '    "AJEDREZ", "BOLOS", "DIANA", "BUMERÁN", "PATINETE", "SKATE", "PATINES", "BICICLETA",',
  '    "AJEDREZ", "BOLOS", "DIANA", "BUMERÁN", "PATINETE", "FLAUTA", "PATINES", "BICICLETA",',
);
await writeFile(bankPath, bank, "utf8");

const corePath = "packages/core/src/index.ts";
let core = await readFile(corePath, "utf8");
core = replaceOnce(
  core,
  "block-six import",
  'import { TRANSITION_BLOCK_FIVE_CARDS } from "./transition-chapter-block-five";\n',
  'import { TRANSITION_BLOCK_FIVE_CARDS } from "./transition-chapter-block-five";\nimport { TRANSITION_BLOCK_SIX_CARDS } from "./transition-chapter-block-six";\n',
);
core = replaceOnce(
  core,
  "block-six cards",
  '  ...TRANSITION_BLOCK_FIVE_CARDS,\n];',
  '  ...TRANSITION_BLOCK_FIVE_CARDS,\n  ...TRANSITION_BLOCK_SIX_CARDS,\n];',
);
await writeFile(corePath, core, "utf8");

console.log("Curriculum block six activated; Juguetes 2 uses FLAUTA instead of SKATE.");
