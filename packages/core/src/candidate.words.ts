import {
  MASTER_CANDIDATE_WORDS,
  MASTER_CANDIDATE_WORD_COUNT,
  MASTER_UNIQUE_CANDIDATE_WORD_COUNT,
} from "./word-bank";

/**
 * Banco maestro candidato de 4,200 posiciones temáticas: 350 por cada uno de
 * los 12 mundos. El orden dentro de cada mundo empieza por vocabulario más
 * cercano y avanza hacia conceptos progresivamente más específicos.
 *
 * IMPORTANTE: candidato no significa publicado. Una palabra solo llega al
 * runtime infantil cuando tiene revisión editorial/regional, dificultad
 * pedagógica y recurso visual aprobado.
 */
export const CANDIDATE_WORDS: Record<string, string[]> = Object.fromEntries(
  Object.entries(MASTER_CANDIDATE_WORDS).map(([category, words]) => [category, [...words]]),
);

export const CANDIDATE_WORD_COUNT = MASTER_CANDIDATE_WORD_COUNT;
export const UNIQUE_CANDIDATE_WORD_COUNT = MASTER_UNIQUE_CANDIDATE_WORD_COUNT;
