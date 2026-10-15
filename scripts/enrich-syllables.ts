import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { CANDIDATE_WORDS } from "../packages/core/src/candidate.words";
import { analyzeSpanishWord } from "./lib/spanish-analysis";

const OUTPUT = resolve("packages/core/src/generated/syllables.candidate.json");
const PIPELINE_SANITY_FLOOR = 0.75;

async function main() {
  const words = Object.values(CANDIDATE_WORDS).flat();
  const analyzed: Record<string, ReturnType<typeof analyzeSpanishWord>> = {};
  const failed: { word: string; error: string }[] = [];

  for (const word of words) {
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
    candidateCount: words.length,
    analyzedCount: Object.keys(analyzed).length,
    failed,
    analyzed,
  };

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Syllable enrichment: ${output.analyzedCount}/${output.candidateCount}`);
  if (failed.length) console.log(`Failed for editorial review: ${failed.length}`);

  // The 3,600-word master bank is deliberately a candidate/research pool. A
  // candidate that the automatic library cannot syllabify is kept for editorial
  // review; it is NOT eligible for production until reviewed. Production lexicon
  // validation still requires explicit syllables. This threshold therefore only
  // detects a broken enrichment engine, rather than pretending every candidate
  // was automatically validated.
  const accounted = output.analyzedCount + failed.length;
  if (accounted !== words.length) {
    throw new Error(`Syllabification accounting mismatch: ${accounted}/${words.length}`);
  }
  if (output.analyzedCount < Math.floor(words.length * PIPELINE_SANITY_FLOOR)) {
    throw new Error("Syllabification engine coverage fell below the 75% sanity floor; review pipeline before using the output.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
