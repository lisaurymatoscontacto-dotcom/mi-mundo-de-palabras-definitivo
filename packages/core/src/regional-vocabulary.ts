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
];

export function wordForRegion(lexeme: RegionalLexeme, region: Region): string {
  return lexeme.variants[region] ?? lexeme.variants.latam ?? lexeme.defaultWord;
}

export function findRegionalLexeme(conceptId: string): RegionalLexeme | undefined {
  return REGIONAL_LEXEMES.find((lexeme) => lexeme.conceptId === conceptId);
}
