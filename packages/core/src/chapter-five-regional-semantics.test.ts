import { describe, expect, it } from "vitest";
import { chaptersForCategory } from "./curriculum";
import { REGIONAL_LEXEMES } from "./regional-vocabulary";

const EXPECTED_COMIDA_FIVE = ["YUCA","CEREAL","YOGUR","LENTEJA","MANDARINA","TORONJA","LIMA","GUAYABA","PAPAYA","MARACUYÁ","GRANADA","CIRUELA","NECTARINA","ALBARICOQUE","FRAMBUESA","MORA"] as const;

function conceptKey(word: string) {
  const lexeme = REGIONAL_LEXEMES.find((item) =>
    item.defaultWord === word ||
    item.acceptedAlternatives?.includes(word) ||
    Object.values(item.variants).includes(word),
  );
  return lexeme ? `regional:${lexeme.conceptId}` : `word:${word}`;
}

describe("Comida 5 regional semantics", () => {
  it("pins sixteen genuinely distinct early concepts", () => {
    const chapters = chaptersForCategory("Comida");
    const chapterFive = chapters.find((chapter) => chapter.chapterNumber === 5);
    expect(chapterFive?.newWords).toEqual([...EXPECTED_COMIDA_FIVE]);
    expect(new Set((chapterFive?.newWords ?? []).map(conceptKey)).size).toBe(16);
  });

  it("does not reintroduce a regional synonym already taught in chapters 1-4", () => {
    const chapters = chaptersForCategory("Comida");
    const earlierKeys = new Set(chapters.filter((chapter) => chapter.chapterNumber < 5).flatMap((chapter) => chapter.newWords).map(conceptKey));
    const chapterFive = chapters.find((chapter) => chapter.chapterNumber === 5)!;
    for (const word of chapterFive.newWords) expect(earlierKeys.has(conceptKey(word)), word).toBe(false);
  });

  it("models the four known synonym families as shared concepts", () => {
    const key = (word: string) => conceptKey(word);
    expect(key("BANANA")).toBe(key("GUINEO"));
    expect(key("PAPAYA")).toBe(key("LECHOSA"));
    expect(key("MARACUYÁ")).toBe(key("CHINOLA"));
    expect(key("TORONJA")).toBe(key("POMELO"));
  });
});
