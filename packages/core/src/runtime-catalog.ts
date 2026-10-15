import type { WordCard } from "./index";
import { DEMO_CATEGORIES, DEMO_WORDS } from "./index";

const PILOT_WORDS = DEMO_WORDS.map((word) => ({ ...word, syllables: [...word.syllables], regions: [...word.regions] }));

export function applyRuntimeWordCatalog(words: WordCard[]) {
  const source = words.length ? words : PILOT_WORDS;
  DEMO_WORDS.splice(0, DEMO_WORDS.length, ...source);
  const categories = [...new Set(source.map((word) => word.category))];
  DEMO_CATEGORIES.splice(0, DEMO_CATEGORIES.length, ...categories);
  return { wordCount: DEMO_WORDS.length, production: words.length > 0 };
}

export function restorePilotCatalog() {
  return applyRuntimeWordCatalog([]);
}
