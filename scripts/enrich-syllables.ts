import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { CANDIDATE_WORDS } from "../packages/core/src/candidate.words";
import { analyzeSpanishWord } from "./lib/spanish-analysis";

const OUTPUT = resolve("packages/core/src/generated/syllables.candidate.json");

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
  if (output.analyzedCount < Math.floor(words.length * 0.95)) {
    throw new Error("Syllabification coverage fell below 95%; review pipeline before using the output.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
