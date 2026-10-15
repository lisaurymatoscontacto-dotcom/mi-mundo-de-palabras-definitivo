import type { Region, WordCard } from "@mmdp/core";
import type { LexiconEntry } from "@mmdp/core/lexicon";
import { buildPublishableCards } from "@mmdp/core/publishable-runtime";

export interface ApprovedLexiconDocument {
  schemaVersion: 1;
  entries: LexiconEntry[];
}

export function cardsFromApprovedDocument(document: ApprovedLexiconDocument, region: Region): WordCard[] {
  if (document.schemaVersion !== 1 || !Array.isArray(document.entries)) return [];
  return buildPublishableCards(document.entries, { region, assetBaseUrl: "/content" })
    .map((entry) => entry.card);
}

export async function loadProductionCards(region: Region): Promise<WordCard[]> {
  try {
    const response = await fetch("/content/lexicon.approved.json", { cache: "no-cache" });
    if (!response.ok) return [];
    const document = await response.json() as ApprovedLexiconDocument;
    return cardsFromApprovedDocument(document, region);
  } catch {
    return [];
  }
}
