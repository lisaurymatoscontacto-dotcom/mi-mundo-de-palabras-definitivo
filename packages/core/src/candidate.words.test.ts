import { describe, expect, it } from "vitest";
import { CANDIDATE_WORDS, CANDIDATE_WORD_COUNT } from "./candidate.words";

describe("candidate lexicon", () => {
  it("contains the planned 384 unique concepts", () => {
    const words = Object.values(CANDIDATE_WORDS).flat();
    expect(CANDIDATE_WORD_COUNT).toBe(384);
    expect(words).toHaveLength(384);
    expect(new Set(words).size).toBe(384);
  });

  it("keeps every theme non-empty", () => {
    for (const words of Object.values(CANDIDATE_WORDS)) {
      expect(words.length).toBeGreaterThan(0);
    }
  });
});
