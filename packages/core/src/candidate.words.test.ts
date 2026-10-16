import { describe, expect, it } from "vitest";
import { CANDIDATE_WORDS, CANDIDATE_WORD_COUNT, UNIQUE_CANDIDATE_WORD_COUNT } from "./candidate.words";

describe("candidate lexicon", () => {
  it("contains 4,200 themed candidate positions", () => {
    expect(CANDIDATE_WORD_COUNT).toBe(4200);
    expect(Object.keys(CANDIDATE_WORDS)).toHaveLength(12);
  });

  it("keeps exactly 350 candidate concepts in every world", () => {
    for (const words of Object.values(CANDIDATE_WORDS)) {
      expect(words).toHaveLength(350);
      expect(new Set(words).size).toBe(350);
    }
  });

  it("contains at least 3,500 genuinely unique display words across worlds", () => {
    expect(UNIQUE_CANDIDATE_WORD_COUNT).toBeGreaterThanOrEqual(3500);
    expect(UNIQUE_CANDIDATE_WORD_COUNT).toBeLessThanOrEqual(5000);
  });

  it("does not duplicate the same concept inside a world", () => {
    for (const [category, words] of Object.entries(CANDIDATE_WORDS)) {
      expect(new Set(words).size, category).toBe(words.length);
    }
  });

  it("contains only normalized Spanish display characters", () => {
    const allowed = /^[A-ZÁÉÍÓÚÜÑ0-9 -]+$/u;
    for (const [category, words] of Object.entries(CANDIDATE_WORDS)) {
      for (const word of words) {
        expect(word, `${category}: ${word}`).toBe(word.trim());
        expect(allowed.test(word), `${category}: ${word}`).toBe(true);
      }
    }
  });
});
