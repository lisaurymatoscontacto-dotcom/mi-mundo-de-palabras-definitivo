import type { Region } from "./index";
import type { VisualKind, VisualLicense } from "./media";
import { validateVisualMetadata } from "./media";
import type { CalibratedDifficulty, PedagogicalMetadata } from "./pedagogy";

export type LexiconStatus = "candidate" | "research" | "editorial-review" | "approved" | "retired";

export interface VisualAssetRef {
  kind: VisualKind;
  value: string;
  license: VisualLicense;
  sourceUrl?: string;
  attribution?: string;
}

export interface ContentAssetRefs {
  /** Preferred production visual: Unicode emoji, CC0/public-domain photo, or legacy owned image. */
  visual?: VisualAssetRef;
  /** Legacy illustration path kept for backward compatibility while catalogs migrate. */
  illustrationId?: string;
  /** Stable key for pre-generated/recorded pronunciation. */
  audioId?: string;
  /** Emoji is development-only fallback when no production visual has been approved yet. */
  developmentFallback?: string;
}

export interface RegionalForm {
  region: Region;
  word: string;
  acceptedAlternatives?: string[];
}

export interface EvidenceReference {
  sourceId: string;
  fields: string[];
  note?: string;
}

export interface LexiconEntry {
  id: string;
  conceptId: string;
  category: string;
  defaultWord: string;
  regionalForms: RegionalForm[];
  syllables: string[];
  pedagogy: PedagogicalMetadata;
  difficulty: CalibratedDifficulty;
  evidence: EvidenceReference[];
  assets: ContentAssetRefs;
  status: LexiconStatus;
  goldenEligible: boolean;
  editorialNotes?: string[];
}

export interface LexiconValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateLexiconEntry(entry: LexiconEntry, production = false): LexiconValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!entry.id.trim()) errors.push("missing id");
  if (!entry.conceptId.trim()) errors.push("missing conceptId");
  if (!entry.defaultWord.trim()) errors.push("missing defaultWord");
  if (!entry.category.trim()) errors.push("missing category");
  if (!entry.syllables.length) errors.push("missing syllables");
  if (entry.pedagogy.syllableStructures.length !== entry.syllables.length) {
    errors.push("syllable structure count does not match syllable count");
  }
  if (!entry.difficulty.rubricVersion) errors.push("missing difficulty rubric version");
  if (!entry.evidence.length) warnings.push("entry has no evidence references");
  if (!entry.regionalForms.some((form) => form.region === "latam")) {
    warnings.push("entry has no Latin America default regional form");
  }

  if (entry.assets.visual) {
    const visualErrors = validateVisualMetadata(
      {
        kind: entry.assets.visual.kind,
        license: entry.assets.visual.license,
        sourceUrl: entry.assets.visual.sourceUrl,
        attribution: entry.assets.visual.attribution,
      },
      entry.assets.visual.value,
    );
    errors.push(...visualErrors);
  }

  if (production || entry.status === "approved") {
    if (!entry.assets.visual && !entry.assets.illustrationId) {
      errors.push("approved entry requires a production visual");
    }
    if (!entry.assets.audioId) errors.push("approved entry requires pronunciation audio");
    if (entry.pedagogy.evidenceConfidence === "review") errors.push("approved entry cannot have review-only evidence confidence");
    if (!entry.evidence.length) errors.push("approved entry requires evidence references");
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateLexicon(entries: LexiconEntry[], production = false): LexiconValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();
  const concepts = new Set<string>();

  for (const entry of entries) {
    if (ids.has(entry.id)) errors.push(`duplicate id: ${entry.id}`);
    ids.add(entry.id);
    if (concepts.has(entry.conceptId)) warnings.push(`concept appears more than once: ${entry.conceptId}`);
    concepts.add(entry.conceptId);
    const result = validateLexiconEntry(entry, production);
    errors.push(...result.errors.map((error) => `${entry.id}: ${error}`));
    warnings.push(...result.warnings.map((warning) => `${entry.id}: ${warning}`));
  }

  return { valid: errors.length === 0, errors, warnings };
}
