import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { CANDIDATE_WORDS } from "../packages/core/src/candidate.words";

const SOURCE_URL = "https://raw.githubusercontent.com/concepticon/norare-data/master/datasets/Alonso-2015-AoA/Alonso-2015-AoA.tsv";
const OUTPUT = resolve("packages/core/src/generated/aoa.alonso2015.json");

function normalize(value: string) {
  return value.trim().normalize("NFC").toLocaleLowerCase("es");
}

function parseTsv(raw: string) {
  const [headerLine, ...lines] = raw.replace(/\r/g, "").trim().split("\n");
  const headers = headerLine.split("\t");
  return lines.map((line) => {
    const values = line.split("\t");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

async function main() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) throw new Error(`NoRaRe AoA download failed: ${response.status}`);
  const rows = parseTsv(await response.text());
  const byWord = new Map(rows.map((row) => [normalize(row.SPANISH), row]));
  const candidates = Object.values(CANDIDATE_WORDS).flat();

  const matched: Record<string, unknown> = {};
  const missing: string[] = [];

  for (const displayWord of candidates) {
    const row = byWord.get(normalize(displayWord));
    if (!row) {
      missing.push(displayWord);
      continue;
    }
    matched[displayWord] = {
      meanYears: Number(row.SPANISH_AOA_MEAN),
      minYears: Number(row.SPANISH_AOA_MIN),
      maxYears: Number(row.SPANISH_AOA_MAX),
      partOfSpeech: row.SPANISH_POS,
      concepticonId: row.CONCEPTICON_ID || null,
      concepticonGloss: row.CONCEPTICON_GLOSS || null,
      lineInSource: Number(row.LINE_IN_SOURCE),
    };
  }

  const output = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: {
      id: "Alonso-2015-AoA-NoRaRe",
      title: "Subjective age-of-acquisition norms for 7,039 Spanish words",
      url: SOURCE_URL,
      repository: "https://github.com/concepticon/norare-data",
      license: "CC BY 4.0 (NoRaRe distribution; preserve attribution)",
    },
    candidateCount: candidates.length,
    matchedCount: Object.keys(matched).length,
    coverage: Object.keys(matched).length / candidates.length,
    matched,
    missing: missing.sort((a, b) => a.localeCompare(b, "es")),
  };

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`AoA enrichment: ${output.matchedCount}/${output.candidateCount} (${(output.coverage * 100).toFixed(1)}%)`);
  if (missing.length) console.log(`Missing for editorial review: ${missing.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
