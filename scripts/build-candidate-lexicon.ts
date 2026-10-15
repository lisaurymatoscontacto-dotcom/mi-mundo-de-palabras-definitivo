import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { CANDIDATE_WORDS } from "../packages/core/src/candidate.words";
import { AOA_ALONSO_2015 } from "../packages/core/src/generated/aoa.alonso2015.compact";
import type { Region } from "../packages/core/src/index";
import type { LexiconEntry, RegionalForm } from "../packages/core/src/lexicon";
import { validateLexicon } from "../packages/core/src/lexicon";
import { contentSlug, recommendedEmojiForWord } from "../packages/core/src/asset-production";
import { analyzeSpanishOrthography } from "../packages/core/src/orthography";
import { scoreDifficulty } from "../packages/core/src/pedagogy.scoring";
import { REGIONAL_LEXEMES } from "../packages/core/src/regional-vocabulary";
import { analyzeSpanishWord } from "./lib/spanish-analysis";

const OUTPUT = resolve("packages/core/src/generated/lexicon.candidate.json");

function regionalLexemeFor(word: string) {
  return REGIONAL_LEXEMES.find((lexeme) =>
    lexeme.defaultWord === word || lexeme.acceptedAlternatives?.includes(word),
  );
}

function regionalForms(word: string): RegionalForm[] {
  const lexeme = regionalLexemeFor(word);
  if (!lexeme) return [{ region: "latam", word }];

  const forms = Object.entries(lexeme.variants)
    .filter((entry): entry is [Region, string] => Boolean(entry[1]))
    .map(([region, regionalWord]) => ({
      region,
      word: regionalWord,
      acceptedAlternatives: lexeme.acceptedAlternatives,
    }));

  return forms.some((form) => form.region === "latam")
    ? forms
    : [{ region: "latam", word: lexeme.defaultWord, acceptedAlternatives: lexeme.acceptedAlternatives }, ...forms];
}

function editorialEntry(category: string, word: string): LexiconEntry {
  const analysis = analyzeSpanishWord(word);
  const orthography = analyzeSpanishOrthography(word);
  const structures = analysis.syllables.map((syllable) => syllable.structure);
  const features = new Set(orthography.features);
  if (analysis.diphthongCount) features.add("diphthong");
  if (analysis.hiatusCount) features.add("hiatus");
  if (analysis.triphthongCount) features.add("triphthong");
  if (structures.some((structure) => structure === "CCV" || structure === "CCVC")) features.add("consonant-cluster");

  const ageOfAcquisitionYears = AOA_ALONSO_2015[word];
  const metadata = {
    syllableStructures: structures,
    ageOfAcquisitionYears,
    orthographicRegularity: orthography.regularity,
    orthographicFeatures: [...features],
    evidenceConfidence: "review" as const,
    reviewNote: "Clasificación automática candidata; requiere revisión editorial antes de aprobar.",
  };
  const difficulty = scoreDifficulty({
    letters: [...word.replace(/[-\s]/g, "")].length,
    syllables: analysis.syllables.length,
    metadata,
  });
  const categorySlug = contentSlug(category);
  const wordSlug = contentSlug(word);
  const regional = regionalLexemeFor(word);
  const conceptId = regional ? `regional.${regional.conceptId}` : `${categorySlug}.${wordSlug}`;
  const emojiCandidate = recommendedEmojiForWord(word);

  return {
    id: `${categorySlug}.${wordSlug}`,
    conceptId,
    category,
    defaultWord: word,
    regionalForms: regionalForms(word),
    syllables: analysis.syllables.map((syllable) => syllable.text.toLocaleUpperCase("es")),
    pedagogy: metadata,
    difficulty: {
      reading: difficulty.reading,
      writing: difficulty.writing,
      rubricVersion: difficulty.rubricVersion,
    },
    evidence: [
      {
        sourceId: "silabacion-0.5.2",
        fields: ["syllables", "syllableStructures", "diphthong/hiatus"],
        note: "Candidato automático; la salida requiere revisión editorial.",
      },
      ...(ageOfAcquisitionYears !== undefined ? [{
        sourceId: "Alonso-2015-AoA-NoRaRe",
        fields: ["ageOfAcquisitionYears"],
      }] : []),
    ],
    assets: {
      audioId: `audio/es-419/${wordSlug}.mp3`,
      developmentFallback: emojiCandidate,
    },
    status: "editorial-review",
    goldenEligible: false,
    editorialNotes: [
      ...difficulty.reasons,
      emojiCandidate
        ? `Visual sugerido: emoji Unicode ${emojiCandidate}; validar claridad pedagógica antes de aprobar.`
        : `Visual sugerido: foto local WebP con fuente verificable y licencia Public Domain o CC0.`,
      ...(regional ? [`Regionalización conceptual pendiente: ${regional.conceptId}`] : []),
      ...(ageOfAcquisitionYears === undefined ? ["AoA no disponible en la fuente Alonso-2015; revisar con fuentes adicionales."] : []),
    ],
  };
}

async function main() {
  const entries = Object.entries(CANDIDATE_WORDS).flatMap(([category, words]) =>
    words.map((word) => editorialEntry(category, word)),
  );
  const validation = validateLexicon(entries, false);
  if (!validation.valid) {
    throw new Error(`Candidate lexicon validation failed:\n${validation.errors.join("\n")}`);
  }

  const conceptCounts = new Map<string, number>();
  for (const entry of entries) conceptCounts.set(entry.conceptId, (conceptCounts.get(entry.conceptId) ?? 0) + 1);
  const duplicateConceptIds = [...conceptCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([conceptId, count]) => ({ conceptId, count }));

  const output = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: "editorial-review",
    candidateCount: entries.length,
    uniqueConceptCount: conceptCounts.size,
    duplicateConceptIds,
    validationWarnings: validation.warnings,
    entries,
  };

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Candidate lexicon: ${entries.length} words, ${conceptCounts.size} concepts.`);
  console.log(`Concept collisions for editorial review: ${duplicateConceptIds.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
