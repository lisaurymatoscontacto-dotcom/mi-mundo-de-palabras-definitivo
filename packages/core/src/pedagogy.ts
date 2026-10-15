export type SyllableStructure = "V" | "CV" | "VC" | "CVC" | "CCV" | "CCVC" | "OTHER";
export type OrthographicRegularity = "regular" | "contextual" | "exceptional";
export type EvidenceConfidence = "high" | "medium" | "review";

export interface PedagogicalMetadata {
  /** Estructura de cada sílaba: CV, CVC, CCV, etc. */
  syllableStructures: SyllableStructure[];
  /** Número aproximado de fonemas; útil para separar longitud ortográfica de fonológica. */
  phonemeCount?: number;
  /** Frecuencia/familiaridad infantil normalizada más adelante desde corpus reales. */
  childFrequencyPercentile?: number;
  /** Edad de adquisición léxica cuando exista evidencia para la palabra. */
  ageOfAcquisitionYears?: number;
  /** 1–5, reservado para valores obtenidos o calibrados desde datos reales. */
  familiarity?: number;
  /** 1–5; especialmente importante porque nuestras cartas requieren conceptos visualizables. */
  imageability?: number;
  orthographicRegularity: OrthographicRegularity;
  /** Rasgos que elevan complejidad: rr, qu, gu, h, diptongo, grupo consonántico, etc. */
  orthographicFeatures: string[];
  /** Fuente/calidad de los metadatos para revisión editorial. */
  evidenceConfidence: EvidenceConfidence;
  /** Nota libre para revisión humana; nunca se muestra al niño. */
  reviewNote?: string;
}

export interface CalibratedDifficulty {
  reading: number;
  writing: number;
  /** Identifica la versión del modelo/rúbrica usada para poder recalibrar el banco. */
  rubricVersion: string;
}

export function isPedagogicallyReviewable(metadata: PedagogicalMetadata): boolean {
  return metadata.syllableStructures.length > 0 && metadata.orthographicRegularity.length > 0;
}

export function validateScale(value: number | undefined, min = 1, max = 5): boolean {
  return value === undefined || (Number.isFinite(value) && value >= min && value <= max);
}
