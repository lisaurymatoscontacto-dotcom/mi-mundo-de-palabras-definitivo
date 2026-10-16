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
  Juguetes: [
    "DADO", "YO-YO", "PELOTA", "COMETA", "ROBOT", "TAMBOR", "PELUCHE", "VIDEOJUEGO", "BURBUJA", "ROMPECABEZAS",
    "GLOBO", "FRISBI", "MARACA", "PIANO", "GUITARRA", "MICRÓFONO", "DINOSAURIO", "UNICORNIO", "COHETE", "AVIÓN",
  ],
  "Océano": [
    "OLA", "CORAL", "FOCA", "PULPO", "TIBURÓN", "MEDUSA", "CANGREJO", "CONCHA", "LANGOSTA", "CALAMAR",
    "ANCLA", "OSTRA", "BALLENA", "DELFÍN", "TORTUGA", "PINGÜINO", "CAMARÓN", "BARCO", "BOTE", "VELERO",
  ],
  Espacio: [
    "PLANETA", "SATÉLITE", "ASTRONAUTA", "GALAXIA", "METEORITO", "TELESCOPIO", "SOL", "LUNA", "TIERRA", "COHETE",
    "RADIO", "COMPUTADORA", "LABORATORIO", "ANTENA", "GUANTE", "BOTA", "CÁMARA", "ALIEN", "OVNI", "ESTRELLA",
  ],
  Granja: [
    "GALLO", "GALLINA", "SEMILLA", "PALA", "CAMPESINO", "LECHUGA", "VACA", "TORO", "CERDO", "OVEJA",
    "CABRA", "CABALLO", "BURRO", "CONEJO", "PATO", "GANSO", "PAVO", "HUEVO", "MAÍZ", "TRACTOR",
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

function buildCategory(category: string, baseWords: readonly string[]) {
  const base = prioritizeChapterOne(category, baseWords);
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
