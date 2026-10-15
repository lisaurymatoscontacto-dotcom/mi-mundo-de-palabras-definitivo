import type { OrthographicRegularity } from "./pedagogy";

export interface OrthographicAnalysis {
  regularity: OrthographicRegularity;
  features: string[];
}

/**
 * Editorial heuristic for candidate ranking. It deliberately flags broadly:
 * reviewers decide final treatment before a word can become approved content.
 */
export function analyzeSpanishOrthography(displayWord: string): OrthographicAnalysis {
  const word = displayWord.normalize("NFC").toLocaleLowerCase("es");
  const features = new Set<string>();

  if (word.includes("rr")) features.add("rr");
  if (/qu[eiéí]/.test(word)) features.add("qu");
  if (/gu[eiéí]/.test(word)) features.add("gu");
  if (/c[eiéí]/.test(word)) features.add("c-contextual");
  if (/g[eiéí]/.test(word)) features.add("g-contextual");
  if (word.includes("h")) features.add("h-silent");

  // Writing ambiguities are intentionally broader than reading rules.
  if (/[bv]/.test(word)) features.add("b-v");
  if (/[j]|g[eiéí]/.test(word)) features.add("j-g");
  if (/[csz]/.test(word)) features.add("c-s-z");
  if (/ll|y/.test(word)) features.add("ll-y");

  const contextual = ["rr", "qu", "gu", "c-contextual", "g-contextual", "h-silent"]
    .some((feature) => features.has(feature));

  return {
    regularity: contextual ? "contextual" : "regular",
    features: [...features],
  };
}
