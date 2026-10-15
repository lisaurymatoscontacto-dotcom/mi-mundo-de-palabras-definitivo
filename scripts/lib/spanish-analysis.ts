import { Word } from "silabacion";
import type { SyllableStructure } from "../../packages/core/src/pedagogy";

const VOWELS = /[aeiouáéíóúü]/i;

function normalize(word: string) {
  return word.normalize("NFC").toLocaleLowerCase("es");
}

function syllableText(syllable: { onset?: string; nucleus?: string; coda?: string }) {
  return `${syllable.onset ?? ""}${syllable.nucleus ?? ""}${syllable.coda ?? ""}`;
}

function effectiveOnsetCount(onset = "", nucleus = "") {
  const value = onset.toLocaleLowerCase("es");
  if (!value) return 0;
  const units = value.replace(/ch|ll|rr/g, "C");
  const protectedUnits = units.replace(/qu|gu(?=[eiéí])/g, "C");
  const consonants = [...protectedUnits].filter((char) => !VOWELS.test(char));
  return Math.max(1, consonants.length || (nucleus ? 1 : 0));
}

function effectiveCodaCount(coda = "") {
  if (!coda) return 0;
  const units = coda.toLocaleLowerCase("es").replace(/ch|ll|rr/g, "C");
  return Math.max(1, [...units].filter((char) => !VOWELS.test(char)).length);
}

function structureFor(syllable: { onset?: string; nucleus?: string; coda?: string }): SyllableStructure {
  const onset = effectiveOnsetCount(syllable.onset, syllable.nucleus);
  const coda = effectiveCodaCount(syllable.coda);
  if (onset === 0 && coda === 0) return "V";
  if (onset === 1 && coda === 0) return "CV";
  if (onset === 0 && coda >= 1) return "VC";
  if (onset === 1 && coda >= 1) return "CVC";
  if (onset >= 2 && coda === 0) return "CCV";
  if (onset >= 2 && coda >= 1) return "CCVC";
  return "OTHER";
}

function analyzeSimple(word: string) {
  const parsed = new Word(normalize(word));
  const syllables = parsed.syllables.map((syllable) => ({
    text: syllableText(syllable),
    onset: syllable.onset ?? "",
    nucleus: syllable.nucleus ?? "",
    coda: syllable.coda ?? "",
    structure: structureFor(syllable),
  }));
  return {
    syllables,
    stress: parsed.stress,
    hiatusCount: parsed.hiatuses.length,
    diphthongCount: parsed.diphthongs.length,
    triphthongCount: parsed.triphthongs.length,
  };
}

export function analyzeSpanishWord(word: string) {
  const parts = word.split("-").filter(Boolean);
  if (parts.length === 1) return analyzeSimple(word);
  const analyses = parts.map(analyzeSimple);
  return {
    syllables: analyses.flatMap((entry) => entry.syllables),
    stress: null,
    hiatusCount: analyses.reduce((sum, entry) => sum + entry.hiatusCount, 0),
    diphthongCount: analyses.reduce((sum, entry) => sum + entry.diphthongCount, 0),
    triphthongCount: analyses.reduce((sum, entry) => sum + entry.triphthongCount, 0),
  };
}

export type SpanishWordAnalysis = ReturnType<typeof analyzeSpanishWord>;
