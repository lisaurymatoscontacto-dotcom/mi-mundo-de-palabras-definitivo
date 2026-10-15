import type { PedagogicalMetadata, SyllableStructure } from "./pedagogy";

export interface DifficultyInput {
  letters: number;
  syllables: number;
  metadata: PedagogicalMetadata;
}

export interface DifficultyBreakdown {
  reading: number;
  writing: number;
  reasons: string[];
  rubricVersion: "0.1-provisional";
}

function structureCost(structure: SyllableStructure): number {
  switch (structure) {
    case "V": return 0;
    case "CV": return 0;
    case "VC": return 1;
    case "CVC": return 1;
    case "CCV": return 2;
    case "CCVC": return 3;
    case "OTHER": return 3;
  }
}

const READING_CONTEXTUAL = new Set(["c-contextual", "g-contextual", "r-contextual", "qu", "gu", "rr", "h-silent"]);
const WRITING_AMBIGUOUS = new Set(["b-v", "j-g", "c-qu", "c-s-z", "ll-y", "h-silent", "g-j"]);

/**
 * Rúbrica inicial interpretable. Sirve para ordenar y revisar el banco antes de
 * calibración empírica. No debe citarse como una escala psicolingüística validada.
 */
export function scoreDifficulty(input: DifficultyInput): DifficultyBreakdown {
  const reasons: string[] = [];
  let reading = 1;
  let writing = 1;

  const maxStructure = Math.max(0, ...input.metadata.syllableStructures.map(structureCost));
  if (maxStructure > 0) {
    reading += maxStructure;
    writing += maxStructure;
    reasons.push(`estructura silábica compleja +${maxStructure}`);
  }

  if (input.syllables >= 3) {
    reading += 1;
    writing += 1;
    reasons.push("3 o más sílabas +1");
  }
  if (input.syllables >= 4) {
    reading += 1;
    writing += 1;
    reasons.push("4 o más sílabas +1 adicional");
  }

  if (input.letters >= 8) {
    reading += 1;
    writing += 1;
    reasons.push("longitud ortográfica alta +1");
  }

  const readingFeatures = input.metadata.orthographicFeatures.filter((feature) => READING_CONTEXTUAL.has(feature));
  if (readingFeatures.length) {
    reading += 1;
    reasons.push(`regla contextual de lectura (${readingFeatures.join(", ")}) +1`);
  }

  const writingFeatures = input.metadata.orthographicFeatures.filter((feature) => WRITING_AMBIGUOUS.has(feature));
  if (writingFeatures.length) {
    writing += Math.min(2, writingFeatures.length);
    reasons.push(`ambigüedad ortográfica de escritura (${writingFeatures.join(", ")}) +${Math.min(2, writingFeatures.length)}`);
  }

  if (input.metadata.ageOfAcquisitionYears !== undefined && input.metadata.ageOfAcquisitionYears <= 4) {
    reading = Math.max(1, reading - 1);
    reasons.push("adquisición léxica temprana −1 lectura");
  }

  if (input.metadata.imageability !== undefined && input.metadata.imageability >= 4.5) {
    reasons.push("alta imaginabilidad: apta para carta visual");
  }

  return {
    reading: Math.min(10, reading),
    writing: Math.min(10, writing),
    reasons,
    rubricVersion: "0.1-provisional",
  };
}
