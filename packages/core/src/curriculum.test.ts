import { describe, expect, it } from "vitest";
import { CANDIDATE_WORDS } from "./candidate.words";
import {
  CURRICULUM_CHAPTERS,
  NEW_WORDS_PER_CHAPTER,
  REVIEW_WORDS_PER_CHAPTER,
  WORDS_PER_CHAPTER,
  chaptersForCategory,
} from "./curriculum";

describe("themed curriculum", () => {
  it("uses twenty-card chapter targets", () => {
    expect(WORDS_PER_CHAPTER).toBe(20);
    expect(NEW_WORDS_PER_CHAPTER).toBe(16);
    expect(REVIEW_WORDS_PER_CHAPTER).toBe(4);
  });

  it("brings every world back in numbered chapters", () => {
    for (const category of Object.keys(CANDIDATE_WORDS)) {
      const chapters = chaptersForCategory(category);
      expect(chapters.length).toBeGreaterThan(1);
      expect(chapters[0].label).toBe(`${category} 1`);
      expect(chapters[1].label).toBe(`${category} 2`);
    }
  });

  it("introduces every candidate exactly once inside its own world", () => {
    for (const [category, bank] of Object.entries(CANDIDATE_WORDS)) {
      const introduced = chaptersForCategory(category).flatMap((chapter) => chapter.newWords);
      expect(introduced).toEqual(bank);
      expect(new Set(introduced).size).toBe(bank.length);
    }
  });

  it("keeps review explicit instead of duplicating filler cards", () => {
    for (const chapter of CURRICULUM_CHAPTERS) {
      expect(new Set(chapter.newWords).size).toBe(chapter.newWords.length);
      expect(chapter.reviewPool.every((word) => !chapter.newWords.includes(word))).toBe(true);
    }
  });
});
