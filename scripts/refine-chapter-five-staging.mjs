import { readFile, writeFile } from "node:fs/promises";

const path = "scripts/stage-chapter-five-photos.ts";
let source = await readFile(path, "utf8");
const replacements = [
  ["refrigerator appliance photograph", "Refrigeradora en casa"],
  ["kitchen stove appliance photograph", "Kitchen stove Haas-Lilienthal House San Francisco DSC05027"],
  ["pillow household photograph", "Indian pillow"],
  ["window curtain household photograph", "Curtain 2"],
];
for (const [before, after] of replacements) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`Expected one query '${before}', found ${count}`);
  source = source.replace(before, after);
}
await writeFile(path, source, "utf8");
console.log("Refined four weak Casa 5 searches to exact CC0-oriented Wikimedia targets.");
