import { describe, expect, it } from "vitest";
import type { WordCard, WordProgress } from "@mmdp/core";
import { buildCurriculumChapters } from "@mmdp/core/curriculum";
import { buildCurriculumSession } from "./curriculumSession";

function card(word: string, category = "Animales"): WordCard {
  return {
    id: word.toLocaleLowerCase("es"),
    word,
    category,
    visual: "⭐",
    visualKind: "emoji",
    syllables: [word],
    readingDifficulty: 1,
    writingDifficulty: 1,
    minAge: 4,
    regions: ["latam"],
  };
}

describe("curriculum session builder", () => {
  const bank = { Animales: Array.from({ length: 36 }, (_, index) => `ANIMAL ${index + 1}`) };
  const chapters = buildCurriculumChapters(bank);

  it("builds the first chapter from twenty unique new cards", () => {
    const chapter = chapters[0];
    const available = chapter.newWords.map((word) => card(word));
    const result = buildCurriculumSession(chapter, available);
    expect(result.ready).toBe(true);
    expect(result.cards).toHaveLength(20);
    expect(result.newCards).toHaveLength(20);
    expect(result.reviewCards).toHaveLength(0);
    expect(new Set(result.cards.map((entry) => entry.id)).size).toBe(20);
  });

  it("uses difficult previous cards for explicit review without duplicates", () => {
    const chapter = chapters[1];
    const allWords = [...chapter.reviewPool, ...chapter.newWords];
    const available = allWords.map((word) => card(word));
    const progress: Record<string, WordProgress> = {};
    const difficult = card(chapter.reviewPool[7]);
    progress[difficult.id] = { wordId: difficult.id, correctReads: 0, incorrectReads: 4, mastery: "practicing" };

    const result = buildCurriculumSession(chapter, available, progress);
    expect(result.ready).toBe(true);
    expect(result.cards).toHaveLength(20);
    expect(result.reviewCards).toHaveLength(chapter.reviewCount);
    expect(result.reviewCards[0].word).toBe(difficult.word);
    expect(new Set(result.cards.map((entry) => entry.id)).size).toBe(20);
  });

  it("reports missing content instead of inventing or repeating cards", () => {
    const chapter = chapters[0];
    const available = chapter.newWords.slice(0, 7).map((word) => card(word));
    const result = buildCurriculumSession(chapter, available);
    expect(result.ready).toBe(false);
    expect(result.cards).toHaveLength(7);
    expect(result.missingNewWords).toHaveLength(13);
    expect(new Set(result.cards.map((entry) => entry.id)).size).toBe(7);
  });
});
