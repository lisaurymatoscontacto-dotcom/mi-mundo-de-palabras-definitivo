import { readFile, writeFile } from "node:fs/promises";

const path = "scripts/stage-ocean-chapter-four-photos.ts";
let source = await readFile(path, "utf8");
const before = `{ word: "MEJILLÓN", query: "Mytilus edulis mussel animal", difficulty: 3 }`;
const after = `{ word: "BELUGA", query: "Delphinapterus leucas NOAA beluga whale", difficulty: 3 }`;
const count = source.split(before).length - 1;
if (count !== 1) throw new Error(`Expected one refined mussel staging spec, found ${count}.`);
source = source.replace(before, after);
await writeFile(path, source, "utf8");
console.log("Replaced weak MEJILLÓN photo slot with BELUGA for a clearer public-domain animal photograph.");
