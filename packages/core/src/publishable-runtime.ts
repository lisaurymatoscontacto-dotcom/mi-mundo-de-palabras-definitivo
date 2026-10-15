import type { Region, WordCard } from "./index";
import type { LexiconEntry } from "./lexicon";
import { validateLexiconEntry } from "./lexicon";

export interface PublishableCard {
  card: WordCard;
  visualUrl?: string;
  illustrationUrl?: string;
  audioUrl: string;
  conceptId: string;
}

export interface PublishableRuntimeOptions {
  region: Region;
  assetBaseUrl?: string;
}

function assetUrl(baseUrl: string | undefined, assetId: string) {
  if (/^https?:\/\//i.test(assetId) || assetId.startsWith("/")) return assetId;
  const base = (baseUrl ?? "/assets").replace(/\/$/, "");
  return `${base}/${assetId.replace(/^\//, "")}`;
}

function regionalWord(entry: LexiconEntry, region: Region) {
  return entry.regionalForms.find((form) => form.region === region)?.word
    ?? entry.regionalForms.find((form) => form.region === "latam")?.word
    ?? entry.defaultWord;
}

function minimumAge(entry: LexiconEntry) {
  const aoa = entry.pedagogy.ageOfAcquisitionYears;
  if (aoa === undefined || !Number.isFinite(aoa)) return 4;
  return Math.max(4, Math.min(10, Math.ceil(aoa)));
}

function resolveVisual(entry: LexiconEntry, assetBaseUrl?: string) {
  const preferred = entry.assets.visual;
  if (preferred) {
    const visual = preferred.kind === "emoji"
      ? preferred.value
      : assetUrl(assetBaseUrl, preferred.value);
    return {
      visual,
      visualKind: preferred.kind,
      visualLicense: preferred.license,
      visualSourceUrl: preferred.sourceUrl,
      visualAttribution: preferred.attribution,
      visualUrl: preferred.kind === "emoji" ? undefined : visual,
      illustrationUrl: preferred.kind === "image" ? visual : undefined,
    } as const;
  }

  if (entry.assets.illustrationId) {
    const illustrationUrl = assetUrl(assetBaseUrl, entry.assets.illustrationId);
    return {
      visual: illustrationUrl,
      visualKind: "image" as const,
      visualLicense: "legacy-owned" as const,
      visualSourceUrl: undefined,
      visualAttribution: undefined,
      visualUrl: illustrationUrl,
      illustrationUrl,
    };
  }

  return null;
}

export function toPublishableCard(entry: LexiconEntry, options: PublishableRuntimeOptions): PublishableCard | null {
  if (entry.status !== "approved") return null;
  const validation = validateLexiconEntry(entry, true);
  const resolvedVisual = resolveVisual(entry, options.assetBaseUrl);
  if (!validation.valid || !resolvedVisual || !entry.assets.audioId) return null;

  const word = regionalWord(entry, options.region).toLocaleUpperCase("es");
  const audioUrl = assetUrl(options.assetBaseUrl, entry.assets.audioId);
  const card: WordCard = {
    id: entry.id,
    word,
    category: entry.category,
    visual: resolvedVisual.visual,
    visualKind: resolvedVisual.visualKind,
    visualLicense: resolvedVisual.visualLicense,
    visualSourceUrl: resolvedVisual.visualSourceUrl,
    visualAttribution: resolvedVisual.visualAttribution,
    audioUrl,
    syllables: entry.syllables,
    readingDifficulty: entry.difficulty.reading,
    writingDifficulty: entry.difficulty.writing,
    minAge: minimumAge(entry),
    regions: [...new Set(entry.regionalForms.map((form) => form.region))],
    golden: entry.goldenEligible,
    demoOnly: false,
  };

  return {
    card,
    visualUrl: resolvedVisual.visualUrl,
    illustrationUrl: resolvedVisual.illustrationUrl,
    audioUrl,
    conceptId: entry.conceptId,
  };
}

export function buildPublishableCards(entries: LexiconEntry[], options: PublishableRuntimeOptions): PublishableCard[] {
  return entries
    .map((entry) => toPublishableCard(entry, options))
    .filter((entry): entry is PublishableCard => entry !== null)
    .sort((a, b) => a.card.readingDifficulty - b.card.readingDifficulty || a.card.word.localeCompare(b.card.word, "es"));
}
