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

/**
 * Master thematic vocabulary candidate bank.
 *
 * These are curriculum candidates, not automatically publishable cards. Every
 * concept still has to pass regional/editorial review and receive approved
 * pedagogy + visual metadata before it is exposed to children.
 */
export const MASTER_CANDIDATE_WORDS: Record<string, readonly string[]> = {
  Animales: ANIMALES_WORDS,
  Casa: CASA_WORDS,
  Comida: COMIDA_WORDS,
  Naturaleza: NATURALEZA_WORDS,
  Cuerpo: CUERPO_WORDS,
  Ropa: ROPA_WORDS,
  Transporte: TRANSPORTE_WORDS,
  Escuela: ESCUELA_WORDS,
  Juguetes: JUGUETES_WORDS,
  Océano: OCEANO_WORDS,
  Espacio: ESPACIO_WORDS,
  Granja: GRANJA_WORDS,
};

export const MASTER_CANDIDATE_WORD_COUNT = Object.values(MASTER_CANDIDATE_WORDS)
  .reduce((sum, words) => sum + words.length, 0);
