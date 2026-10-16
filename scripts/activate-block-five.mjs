import { readFile, writeFile } from "node:fs/promises";

const path = "packages/core/src/index.ts";
let source = await readFile(path, "utf8");

function replaceOnce(label, before, after) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Activation anchor not found: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Activation anchor not unique: ${label}`);
  source = source.slice(0, first) + after + source.slice(first + before.length);
}

replaceOnce(
  "block-five import",
  'import { TRANSITION_BLOCK_FOUR_CARDS } from "./transition-chapter-block-four";\n',
  'import { TRANSITION_BLOCK_FOUR_CARDS } from "./transition-chapter-block-four";\nimport { TRANSITION_BLOCK_FIVE_CARDS } from "./transition-chapter-block-five";\n',
);

replaceOnce(
  "block-five cards",
  '  ...TRANSITION_BLOCK_FOUR_CARDS,\n];',
  '  ...TRANSITION_BLOCK_FOUR_CARDS,\n  ...TRANSITION_BLOCK_FIVE_CARDS,\n];',
);

await writeFile(path, source, "utf8");
console.log("Curriculum block five activated in DEMO_WORDS.");
