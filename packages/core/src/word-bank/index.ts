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

const TYPOGRAPHIC_FIXES: Record<string, string> = {
  "SETО": "SETO",
  "MOCО": "MOCO",
  "CODERА": "CODERA",
  "REMО": "REMO",
  "CENTAURО": "CENTAURO",
  MARSUPIAL: "IXIÓN",
  SEDA: "VARUNA",
};

function cleanCandidateWords(words: readonly string[]) {
  return words.map((word) => TYPOGRAPHIC_FIXES[word] ?? word);
}

/**
 * Master thematic vocabulary candidate bank.
 *
 * These are curriculum candidates, not automatically publishable cards. Every
 * concept still has to pass regional/editorial review and receive approved
 * pedagogy + visual metadata before it is exposed to children.
 */
export const MASTER_CANDIDATE_WORDS: Record<string, readonly string[]> = {
  Animales: cleanCandidateWords(ANIMALES_WORDS),
  Casa: cleanCandidateWords(CASA_WORDS),
  Comida: cleanCandidateWords(COMIDA_WORDS),
  Naturaleza: cleanCandidateWords(NATURALEZA_WORDS),
  Cuerpo: cleanCandidateWords(CUERPO_WORDS),
  Ropa: cleanCandidateWords(ROPA_WORDS),
  Transporte: cleanCandidateWords(TRANSPORTE_WORDS),
  Escuela: cleanCandidateWords(ESCUELA_WORDS),
  Juguetes: cleanCandidateWords(JUGUETES_WORDS),
  Océano: cleanCandidateWords(OCEANO_WORDS),
  Espacio: cleanCandidateWords(ESPACIO_WORDS),
  Granja: cleanCandidateWords(GRANJA_WORDS),
};

export const MASTER_CANDIDATE_WORD_COUNT = Object.values(MASTER_CANDIDATE_WORDS)
  .reduce((sum, words) => sum + words.length, 0);
