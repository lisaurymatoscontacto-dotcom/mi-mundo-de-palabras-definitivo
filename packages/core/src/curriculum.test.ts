import { describe, expect, it } from "vitest";
import { CANDIDATE_WORDS } from "./candidate.words";
import {
  CURRICULUM_CHAPTERS,
  NEW_WORDS_PER_CHAPTER,
  REVIEW_WORDS_PER_CHAPTER,
  WORDS_PER_CHAPTER,
  balancedNewWordCounts,
  chaptersForCategory,
} from "./curriculum";

describe("themed curriculum", () => {
  it("uses twenty-card chapter targets", () => {
    expect(WORDS_PER_CHAPTER).toBe(20);
    expect(NEW_WORDS_PER_CHAPTER).toBe(16);
    expect(REVIEW_WORDS_PER_CHAPTER).toBe(4);
    expect(balancedNewWordCounts(350)).toEqual([20, ...Array(15).fill(16), ...Array(6).fill(15)]);
  });

  it("brings every world back in twenty-two numbered chapters", () => {
    for (const category of Object.keys(CANDIDATE_WORDS)) {
      const chapters = chaptersForCategory(category);
      expect(chapters).toHaveLength(22);
      expect(chapters[0].label).toBe(`${category} 1`);
      expect(chapters[1].label).toBe(`${category} 2`);
      expect(chapters[21].label).toBe(`${category} 22`);
    }
  });

  it("introduces every candidate exactly once inside its own world", () => {
    for (const [category, bank] of Object.entries(CANDIDATE_WORDS)) {
      const introduced = chaptersForCategory(category).flatMap((chapter) => chapter.newWords);
      expect(introduced).toEqual(bank);
      expect(new Set(introduced).size).toBe(bank.length);
    }
  });

  it("keeps every full-bank chapter at twenty cards with explicit review", () => {
    for (const category of Object.keys(CANDIDATE_WORDS)) {
      const chapters = chaptersForCategory(category);
      expect(chapters[0].newWords).toHaveLength(20);
      expect(chapters[0].reviewCount).toBe(0);
      expect(chapters[0].targetSize).toBe(20);
      for (const chapter of chapters.slice(1)) {
        expect(chapter.targetSize).toBe(20);
        expect(chapter.reviewCount).toBeGreaterThanOrEqual(4);
        expect(chapter.reviewCount).toBeLessThanOrEqual(5);
        expect(new Set(chapter.newWords).size).toBe(chapter.newWords.length);
        expect(chapter.reviewPool.every((word) => !chapter.newWords.includes(word))).toBe(true);
      }
    }
  });

  it("interleaves worlds before returning to chapter two", () => {
    expect(CURRICULUM_CHAPTERS).toHaveLength(264);
    expect(CURRICULUM_CHAPTERS.slice(0, 12).every((chapter) => chapter.chapterNumber === 1)).toBe(true);
    expect(CURRICULUM_CHAPTERS[12].chapterNumber).toBe(2);
    expect(CURRICULUM_CHAPTERS[12].category).toBe("Animales");
  });
});
