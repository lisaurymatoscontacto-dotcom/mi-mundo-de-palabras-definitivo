import { readFile, writeFile } from "node:fs/promises";

async function replaceExact(path, before, after, label) {
  const source = await readFile(path, "utf8");
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Cleanup anchor not found: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Cleanup anchor is not unique: ${label}`);
  await writeFile(path, source.slice(0, first) + after + source.slice(first + before.length), "utf8");
}

await replaceExact(
  "scripts/import-assets.ts",
  'const IMPORTER_USER_AGENT = "MiMundoDePalabras/0.1 (https://github.com/KEYGEN-RD/mi-mundo-de-palabras)";',
  'const IMPORTER_USER_AGENT = "MiMundoDePalabras/0.1 (https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo)";',
  "new repository importer user agent",
);

const docsPath = "THIRD_PARTY_ASSETS.md";
let docs = await readFile(docsPath, "utf8");
const stale = /Approved Twemoji concepts currently include the initial pilot \(`GATO`,[\s\S]*?explicit editorial review command\./;
if (!stale.test(docs)) throw new Error("Cleanup anchor not found: stale Twemoji batch paragraph");
docs = docs.replace(stale, `The exact approved set is intentionally derived from the machine-readable catalog instead of duplicated as a hand-maintained list here. The twelve introductory curriculum chapters now contain **240 approved card placements** across the twelve learning worlds. Their local files, source revision, license, review status and pedagogical difficulty are enforced by \`content/assets.catalog.json\` and CI. Later chapters remain locked until their own concepts pass the same review gates.`);
await writeFile(docsPath, docs, "utf8");

console.log("Post-migration cleanup applied: repository identity and asset documentation are current.");
