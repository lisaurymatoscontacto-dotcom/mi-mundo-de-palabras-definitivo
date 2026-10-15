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
  GAFASDESOL: "GAFAS DE SOL",
};

const CHAPTER_ONE_PRIORITY: Record<string, readonly string[]> = {
  Casa: [
    "CASA", "MESA", "CAMA", "VASO", "PLATO", "PUERTA", "SILLA", "TAZA", "SOFÁ", "ESPEJO",
    "CUCHARA", "TENEDOR", "CUCHILLO", "TELEVISOR", "RELOJ", "LLAVE", "DUCHA", "CESTA", "CAJA", "BOMBILLA",
  ],
  Comida: [
    "PAN", "SOPA", "PERA", "UVA", "TOMATE", "QUESO", "ARROZ", "MIEL", "HUEVO", "LECHE",
    "PAPA", "MAÍZ", "MANGO", "MELÓN", "LIMÓN", "FRESA", "PIÑA", "COCO", "BANANA", "MANZANA",
  ],
  Naturaleza: [
    "LUNA", "NUBE", "SOL", "MAR", "FLOR", "RÍO", "HOJA", "ROCA", "PLAYA", "LLUVIA",
    "NIEVE", "FUEGO", "ÁRBOL", "ISLA", "ESTRELLA", "VOLCÁN", "DESIERTO", "MONTAÑA", "ARCOÍRIS", "TORMENTA",
  ],
  Cuerpo: [
    "PIE", "MANO", "OJO", "BOCA", "NARIZ", "CARA", "DEDO", "BRAZO", "DIENTE", "LENGUA",
    "PIERNA", "OREJA", "CORAZÓN", "CEREBRO", "HUESO", "SANGRE", "PULMÓN", "SONRISA", "RISA", "SUEÑO",
  ],
  Ropa: [
    "BOTA", "GORRA", "CAMISETA", "PANTALÓN", "ZAPATO", "ABRIGO", "GUANTE", "BUFANDA", "VESTIDO", "SANDALIA",
    "CORBATA", "CALCETÍN", "SOMBRERO", "GAFAS", "GAFAS DE SOL", "BOLSO", "MONEDERO", "MOCHILA", "ANILLO", "BIKINI",
  ],
  Transporte: [
    "AUTO", "MOTO", "BUS", "TREN", "BARCO", "BOTE", "TAXI", "METRO", "AVIÓN", "CAMIÓN",
    "CANOA", "BICICLETA", "PATINETA", "TRACTOR", "COHETE", "HELICÓPTERO", "AMBULANCIA", "TRANVÍA", "VELERO", "FERRY",
  ],
  Escuela: [
    "LIBRO", "LÁPIZ", "REGLA", "MAPA", "PAPEL", "CUADERNO", "MOCHILA", "TIJERA", "CRAYÓN", "COMPUTADORA",
    "CALCULADORA", "PINCEL", "BOLÍGRAFO", "CARPETA", "CLIP", "ESCUELA", "MAESTRA", "MAESTRO", "TECLADO", "IMPRESORA",
  ],
};

function cleanCandidateWords(words: readonly string[]) {
  return words.map((word) => TYPOGRAPHIC_FIXES[word] ?? word);
}

function prioritizeChapterOne(category: string, words: readonly string[]) {
  const cleaned = cleanCandidateWords(words);
  const priority = CHAPTER_ONE_PRIORITY[category];
  if (!priority) return cleaned;
  const available = new Set(cleaned);
  for (const word of priority) {
    if (!available.has(word)) throw new Error(`${category}: prioritized chapter-one concept is missing from master bank: ${word}`);
  }
  const selected = new Set(priority);
  return [...priority, ...cleaned.filter((word) => !selected.has(word))];
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
  Casa: prioritizeChapterOne("Casa", CASA_WORDS),
  Comida: prioritizeChapterOne("Comida", COMIDA_WORDS),
  Naturaleza: prioritizeChapterOne("Naturaleza", NATURALEZA_WORDS),
  Cuerpo: prioritizeChapterOne("Cuerpo", CUERPO_WORDS),
  Ropa: prioritizeChapterOne("Ropa", ROPA_WORDS),
  Transporte: prioritizeChapterOne("Transporte", TRANSPORTE_WORDS),
  Escuela: prioritizeChapterOne("Escuela", ESCUELA_WORDS),
  Juguetes: cleanCandidateWords(JUGUETES_WORDS),
  Océano: cleanCandidateWords(OCEANO_WORDS),
  Espacio: cleanCandidateWords(ESPACIO_WORDS),
  Granja: cleanCandidateWords(GRANJA_WORDS),
};

export const MASTER_CANDIDATE_WORD_COUNT = Object.values(MASTER_CANDIDATE_WORDS)
  .reduce((sum, words) => sum + words.length, 0);
