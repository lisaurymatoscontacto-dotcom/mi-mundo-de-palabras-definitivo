import { readFile, writeFile } from "node:fs/promises";

function replaceOnce(source, label, before, after) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Activation anchor not found: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Activation anchor not unique: ${label}`);
  return source.slice(0, first) + after + source.slice(first + before.length);
}

const corePath = "packages/core/src/index.ts";
let core = await readFile(corePath, "utf8");
core = replaceOnce(
  core,
  "central transition registry imports",
`import { TRANSITION_CHAPTER_ONE_CARDS } from "./transition-chapter-one";
import { TRANSITION_BLOCK_TWO_CARDS } from "./transition-chapter-block-two";
import { TRANSITION_BLOCK_THREE_CARDS } from "./transition-chapter-block-three";
import { TRANSITION_BLOCK_FOUR_CARDS } from "./transition-chapter-block-four";
import { TRANSITION_BLOCK_FIVE_CARDS } from "./transition-chapter-block-five";
import { TRANSITION_BLOCK_SIX_CARDS } from "./transition-chapter-block-six";
`,
  'import { PUBLISHED_TRANSITION_CARDS } from "./transition-published";\n',
);
core = replaceOnce(
  core,
  "central transition registry spread",
`  ...TRANSITION_CHAPTER_ONE_CARDS,
  ...TRANSITION_BLOCK_TWO_CARDS,
  ...TRANSITION_BLOCK_THREE_CARDS,
  ...TRANSITION_BLOCK_FOUR_CARDS,
  ...TRANSITION_BLOCK_FIVE_CARDS,
  ...TRANSITION_BLOCK_SIX_CARDS,
`,
  '  ...PUBLISHED_TRANSITION_CARDS,\n',
);
await writeFile(corePath, core, "utf8");

const packagePath = "package.json";
let packageJson = await readFile(packagePath, "utf8");
packageJson = replaceOnce(
  packageJson,
  "published curriculum CI count",
  '"content:curriculum:verify": "tsx scripts/verify-published-curriculum.ts --chapters=24"',
  '"content:curriculum:verify": "tsx scripts/verify-published-curriculum.ts --chapters=28"',
);
await writeFile(packagePath, packageJson, "utf8");

const docsPath = "THIRD_PARTY_ASSETS.md";
let docs = await readFile(docsPath, "utf8");
docs = replaceOnce(
  docs,
  "published asset coverage documentation",
  'The complete first two curriculum rounds are now publishable: **24 chapters** across the twelve learning worlds. The canonical catalog contains **432 approved local asset records**; chapter-two review slots deliberately reuse approved chapter-one concepts instead of duplicating files. Their local paths, source revision, license, review status and pedagogical difficulty are enforced by `content/assets.catalog.json` and CI. Later chapters remain locked until their own new concepts pass the same review gates.',
  'The complete first two curriculum rounds plus the first chapter-three block are now publishable: **28 chapters** across the twelve learning worlds. The canonical catalog contains **496 approved local asset records**; review slots deliberately reuse earlier approved concepts instead of duplicating files. Their local paths, source revision, license, review status and pedagogical difficulty are enforced by `content/assets.catalog.json` and CI. Later chapters remain locked until their own new concepts pass the same review gates.',
);
await writeFile(docsPath, docs, "utf8");

console.log("Block seven activated: central transition registry, CI coverage 28 and asset documentation 496.");
