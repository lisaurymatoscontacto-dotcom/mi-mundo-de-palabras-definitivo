import type { Region } from "./index";

export interface RegionalLexeme {
  /** Identidad conceptual estable; la imagen/colección se asocia a este ID. */
  conceptId: string;
  defaultWord: string;
  variants: Partial<Record<Region, string>>;
  /** Alternativas legítimas que el editor puede aceptar sin mostrarlas por defecto. */
  acceptedAlternatives?: string[];
  reviewNote?: string;
}

/**
 * Primera capa editorial de regionalización. Solo contiene casos claros y
 * frecuentes; se ampliará con revisión por país antes del lanzamiento.
 */
export const REGIONAL_LEXEMES: RegionalLexeme[] = [
  {
    conceptId: "car",
    defaultWord: "AUTO",
    variants: {
      latam: "AUTO",
      caribbean: "CARRO",
      andine: "CARRO",
      "southern-cone": "AUTO",
      mx: "AUTO",
    },
    acceptedAlternatives: ["CARRO", "COCHE"],
    reviewNote: "Coche/carro/auto varían ampliamente; mantener selección regional configurable.",
  },
  {
    conceptId: "refrigerator",
    defaultWord: "REFRIGERADOR",
    variants: {
      latam: "REFRIGERADOR",
      caribbean: "NEVERA",
      andine: "NEVERA",
      "southern-cone": "HELADERA",
      mx: "REFRIGERADOR",
    },
    acceptedAlternatives: ["NEVERA", "HELADERA", "REFRIGERADOR"],
  },
  {
    conceptId: "computer",
    defaultWord: "COMPUTADORA",
    variants: {
      latam: "COMPUTADORA",
      caribbean: "COMPUTADORA",
      andine: "COMPUTADORA",
      "southern-cone": "COMPUTADORA",
      mx: "COMPUTADORA",
    },
    acceptedAlternatives: ["COMPUTADOR"],
  },
  {
    conceptId: "bus",
    defaultWord: "AUTOBÚS",
    variants: {
      latam: "AUTOBÚS",
      caribbean: "GUAGUA",
      andine: "AUTOBÚS",
      "southern-cone": "AUTOBÚS",
      mx: "AUTOBÚS",
    },
    acceptedAlternatives: ["BUS", "CAMIÓN", "COLECTIVO", "GUAGUA"],
    reviewNote: "Caso muy regional; las alternativas por país se revisarán antes del lanzamiento.",
  },
  {
    conceptId: "banana",
    defaultWord: "BANANA",
    variants: { latam: "BANANA", caribbean: "GUINEO", andine: "BANANA", "southern-cone": "BANANA", mx: "BANANA" },
    acceptedAlternatives: ["GUINEO"],
    reviewNote: "Guineo/banana are regional names for the same fruit; never teach them as separate new concepts.",
  },
  {
    conceptId: "papaya",
    defaultWord: "PAPAYA",
    variants: { latam: "PAPAYA", caribbean: "LECHOSA", andine: "PAPAYA", "southern-cone": "PAPAYA", mx: "PAPAYA" },
    acceptedAlternatives: ["LECHOSA"],
    reviewNote: "Lechosa is a Caribbean regional name for papaya; share one concept/visual identity.",
  },
  {
    conceptId: "passion-fruit",
    defaultWord: "MARACUYÁ",
    variants: { latam: "MARACUYÁ", caribbean: "CHINOLA", andine: "MARACUYÁ", "southern-cone": "MARACUYÁ", mx: "MARACUYÁ" },
    acceptedAlternatives: ["CHINOLA"],
    reviewNote: "Chinola/maracuyá are regional names for the same fruit; share one concept/visual identity.",
  },
  {
    conceptId: "grapefruit",
    defaultWord: "TORONJA",
    variants: { latam: "TORONJA", caribbean: "TORONJA", andine: "POMELO", "southern-cone": "POMELO", mx: "TORONJA" },
    acceptedAlternatives: ["POMELO"],
    reviewNote: "Toronja/pomelo are regional names for grapefruit; do not count them as two new concepts.",
  },
];

export function wordForRegion(lexeme: RegionalLexeme, region: Region): string {
  return lexeme.variants[region] ?? lexeme.variants.latam ?? lexeme.defaultWord;
}

export function findRegionalLexeme(conceptId: string): RegionalLexeme | undefined {
  return REGIONAL_LEXEMES.find((lexeme) => lexeme.conceptId === conceptId);
}
