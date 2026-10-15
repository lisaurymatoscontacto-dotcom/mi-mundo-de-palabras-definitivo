import { describe, expect, it } from "vitest";
import { CANDIDATE_WORDS, CANDIDATE_WORD_COUNT } from "./candidate.words";

describe("candidate lexicon", () => {
  it("contains the expanded 3,600 themed candidate concepts", () => {
    expect(CANDIDATE_WORD_COUNT).toBe(3600);
    expect(Object.keys(CANDIDATE_WORDS)).toHaveLength(12);
  });

  it("keeps exactly 300 candidate concepts in every world", () => {
    for (const words of Object.values(CANDIDATE_WORDS)) {
      expect(words).toHaveLength(300);
      expect(new Set(words).size).toBe(300);
    }
  });

  it("does not duplicate the same concept inside a world", () => {
    for (const [category, words] of Object.entries(CANDIDATE_WORDS)) {
      expect(new Set(words).size, category).toBe(words.length);
    }
  });
});
