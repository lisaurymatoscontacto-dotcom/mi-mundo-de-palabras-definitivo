import { ANIMALES_WORDS } from "./animales";
import { CASA_WORDS } from "./casa";
import { COMIDA_WORDS } from "./comida";
import { NATURALEZA_WORDS } from "./naturaleza";
import { CUERPO_WORDS } from "./cuerpo";
import { ROPA_WORDS } from "./ropa";
import { TRANSPORTE_WORDS } from "./transporte";
import { ESCUELA_WORDS } from "./escuela";
import { JUGUETES_WORDS } from "./juguetes";
import { OCEANO_WORDS } from "./oceano";
import { ESPACIO_WORDS } from "./espacio";
import { GRANJA_WORDS } from "./granja";
import { CURRICULUM_PRIORITY_WORDS } from "./curriculum-priorities";
import { MASTER_EXPANSION_WORDS } from "./expansion";

const TYPOGRAPHIC_FIXES: Record<string, string> = {
  "SETО": "SETO",
  "MOCО": "MOCO",
  "CODERА": "CODERA",
  "REMО": "REMO",
  "CENTAURО": "CENTAURO",
  MARSUPIAL: "IXIÓN",
  SEDA: "VARUNA",
  GAFASDESOL: "GAFAS DE SOL",
};

function cleanCandidateWords(words: readonly string[]) {
  return words.map((word) => TYPOGRAPHIC_FIXES[word] ?? word);
}

function expectedPrioritySize(chapterIndex: number) {
  if (chapterIndex === 0) return 20;
  // With 350 concepts per world, chapters 2–16 introduce 16 words and
  // chapters 17–22 introduce 15. Review fills every chapter to exactly 20.
  return chapterIndex <= 15 ? 16 : 15;
}

function prioritizeCurriculumStart(category: string, words: readonly string[]) {
  const cleaned = cleanCandidateWords(words);
  const available = new Set(cleaned);
  const selected = new Set<string>();
  const ordered: string[] = [];
  const priorities = CURRICULUM_PRIORITY_WORDS[category] ?? [];

  priorities.forEach((chapterWords, chapterIndex) => {
    const expected = expectedPrioritySize(chapterIndex);
    if (chapterWords.length !== expected || new Set(chapterWords).size !== expected) {
      throw new Error(`${category}: chapter ${chapterIndex + 1} priority must contain exactly ${expected} distinct concepts`);
    }
    for (const word of chapterWords) {
      if (!available.has(word)) {
        throw new Error(`${category}: prioritized chapter ${chapterIndex + 1} concept is missing from master bank: ${word}`);
      }
      if (selected.has(word)) {
        throw new Error(`${category}: prioritized concept appears in more than one chapter: ${word}`);
      }
      selected.add(word);
      ordered.push(word);
    }
  });

  return [...ordered, ...cleaned.filter((word) => !selected.has(word))];
}

function buildCategory(category: string, baseWords: readonly string[]) {
  const base = prioritizeCurriculumStart(category, baseWords);
  const expansion = cleanCandidateWords(MASTER_EXPANSION_WORDS[category] ?? []);
  if (expansion.length !== 50) {
    throw new Error(`${category}: expected exactly 50 expansion concepts, received ${expansion.length}`);
  }

  const seen = new Set(base);
  for (const word of expansion) {
    if (seen.has(word)) throw new Error(`${category}: expansion duplicates an existing concept: ${word}`);
    seen.add(word);
  }

  return [...base, ...expansion];
}

/**
 * Master thematic vocabulary candidate bank.
 *
 * The bank intentionally contains 4,200 thematic positions (350 in each of
 * twelve worlds). Candidate does not mean publishable: every concept still has
 * to pass editorial/regional review and receive approved pedagogy + visual
 * metadata before it is exposed to children.
 */
export const MASTER_CANDIDATE_WORDS: Record<string, readonly string[]> = {
  Animales: buildCategory("Animales", ANIMALES_WORDS),
  Casa: buildCategory("Casa", CASA_WORDS),
  Comida: buildCategory("Comida", COMIDA_WORDS),
  Naturaleza: buildCategory("Naturaleza", NATURALEZA_WORDS),
  Cuerpo: buildCategory("Cuerpo", CUERPO_WORDS),
  Ropa: buildCategory("Ropa", ROPA_WORDS),
  Transporte: buildCategory("Transporte", TRANSPORTE_WORDS),
  Escuela: buildCategory("Escuela", ESCUELA_WORDS),
  Juguetes: buildCategory("Juguetes", JUGUETES_WORDS),
  Océano: buildCategory("Océano", OCEANO_WORDS),
  Espacio: buildCategory("Espacio", ESPACIO_WORDS),
  Granja: buildCategory("Granja", GRANJA_WORDS),
};

export const MASTER_CANDIDATE_WORD_COUNT = Object.values(MASTER_CANDIDATE_WORDS)
  .reduce((sum, words) => sum + words.length, 0);

/** Exact display-word uniqueness across worlds; prevents inflating the bank with repeats. */
export const MASTER_UNIQUE_CANDIDATE_WORD_COUNT = new Set(
  Object.values(MASTER_CANDIDATE_WORDS).flat(),
).size;
