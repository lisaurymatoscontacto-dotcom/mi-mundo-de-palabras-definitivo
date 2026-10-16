import { readFile, writeFile } from "node:fs/promises";

const path = "scripts/stage-ocean-chapter-four-photos.ts";
let source = await readFile(path, "utf8");

const replacements = [
  [`{ word: "ORCA", query: "orca killer whale", difficulty: 3 }`, `{ word: "ORCA", query: "Orcinus orca NOAA killer whale", difficulty: 3 }`],
  [`{ word: "NARVAL", query: "narwhal Monodon monoceros", difficulty: 3 }`, `{ word: "NARVAL", query: "Monodon monoceros NOAA narwhal animal", difficulty: 3 }`],
  [`{ word: "MANTA", query: "manta ray Manta", difficulty: 3 }`, `{ word: "MANTA", query: "Manta birostris NOAA manta ray", difficulty: 3 }`],
  [`{ word: "RAYA", query: "stingray ray fish", difficulty: 2 }`, `{ word: "RAYA", query: "stingray NOAA underwater fish", difficulty: 2 }`],
  [`{ word: "ATÚN", query: "tuna fish", difficulty: 3 }`, `{ word: "ATÚN", query: "Thunnus tuna NOAA fish", difficulty: 3 }`],
  [`{ word: "SARDINA", query: "sardine fish", difficulty: 3 }`, `{ word: "SARDINA", query: "Sardina pilchardus single sardine fish", difficulty: 3 }`],
  [`{ word: "MEJILLÓN", query: "mussel Mytilus shell", difficulty: 3 }`, `{ word: "MEJILLÓN", query: "Mytilus edulis mussel animal", difficulty: 3 }`],
  [`{ word: "PELICANO", query: "pelican bird", difficulty: 3 }`, `{ word: "PELICANO", query: "pelican USFWS bird", difficulty: 3 }`],
];

for (const [before, after] of replacements) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`Expected one staging query target, found ${count}: ${before}`);
  source = source.replace(before, after);
}

await writeFile(path, source, "utf8");
console.log(`Refined ${replacements.length} ocean photo searches toward real animal photographs.`);
