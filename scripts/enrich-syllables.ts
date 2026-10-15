import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { CANDIDATE_WORDS } from "../packages/core/src/candidate.words";
import { analyzeSpanishWord } from "./lib/spanish-analysis";

const OUTPUT = resolve("packages/core/src/generated/syllables.candidate.json");
const PIPELINE_SANITY_FLOOR = 0.75;

async function main() {
  const candidateWords = Object.values(CANDIDATE_WORDS).flat();
  // The same valid Spanish concept can intentionally appear in different worlds
  // (for example VACA in Animales and Granja). Syllabification is lexical, so it
  // only needs to be computed once per unique spelling.
  const uniqueWords = [...new Set(candidateWords)];
  const analyzed: Record<string, ReturnType<typeof analyzeSpanishWord>> = {};
  const failed: { word: string; error: string }[] = [];

  for (const word of uniqueWords) {
    try {
      analyzed[word] = analyzeSpanishWord(word);
    } catch (error) {
      failed.push({ word, error: error instanceof Error ? error.message : String(error) });
    }
  }

  const output = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: {
      package: "silabacion@0.5.2",
      license: "MIT",
      repository: "https://github.com/weiwei/silabacion",
      role: "editorial candidate syllabification; flagged cases still require human review",
    },
    candidateCount: candidateWords.length,
    uniqueCandidateCount: uniqueWords.length,
    crossCategoryOccurrences: candidateWords.length - uniqueWords.length,
    analyzedCount: Object.keys(analyzed).length,
    failed,
    analyzed,
  };

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Syllable enrichment: ${output.analyzedCount}/${output.uniqueCandidateCount} unique spellings (${output.candidateCount} thematic placements)`);
  if (failed.length) console.log(`Failed for editorial review: ${failed.length}`);

  // The 3,600-entry master bank is deliberately a candidate/research pool. A
  // candidate that the automatic library cannot syllabify is kept for editorial
  // review; it is NOT eligible for production until reviewed. Production lexicon
  // validation still requires explicit syllables.
  const accounted = output.analyzedCount + failed.length;
  if (accounted !== uniqueWords.length) {
    throw new Error(`Syllabification accounting mismatch: ${accounted}/${uniqueWords.length} unique spellings`);
  }
  if (output.analyzedCount < Math.floor(uniqueWords.length * PIPELINE_SANITY_FLOOR)) {
    throw new Error("Syllabification engine coverage fell below the 75% sanity floor; review pipeline before using the output.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
