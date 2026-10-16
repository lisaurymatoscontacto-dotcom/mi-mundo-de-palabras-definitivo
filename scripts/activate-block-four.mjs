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
  "block-four import",
  'import { TRANSITION_BLOCK_THREE_CARDS } from "./transition-chapter-block-three";\n',
  'import { TRANSITION_BLOCK_THREE_CARDS } from "./transition-chapter-block-three";\nimport { TRANSITION_BLOCK_FOUR_CARDS } from "./transition-chapter-block-four";\n',
);

replaceOnce(
  "block-four cards",
  '  ...TRANSITION_BLOCK_THREE_CARDS,\n];',
  '  ...TRANSITION_BLOCK_THREE_CARDS,\n  ...TRANSITION_BLOCK_FOUR_CARDS,\n];',
);

await writeFile(path, source, "utf8");
console.log("Curriculum block four activated in DEMO_WORDS.");
