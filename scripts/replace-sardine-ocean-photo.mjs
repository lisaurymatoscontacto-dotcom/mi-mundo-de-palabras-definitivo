import { readFile, writeFile } from "node:fs/promises";

const path = "scripts/stage-ocean-chapter-four-photos.ts";
let source = await readFile(path, "utf8");
const before = `{ word: "SARDINA", query: "Sardina pilchardus single sardine fish", difficulty: 3 }`;
const after = `{ word: "CABALLITODEMAR", query: "Hippocampus seahorse NOAA", difficulty: 4 }`;
const count = source.split(before).length - 1;
if (count !== 1) throw new Error(`Expected one refined sardine staging spec, found ${count}.`);
source = source.replace(before, after);
await writeFile(path, source, "utf8");
console.log("Replaced weak SARDINA photo slot with CABALLITODEMAR for a clearer legal visual candidate.");
