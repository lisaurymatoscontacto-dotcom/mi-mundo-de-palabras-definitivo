import { describe, expect, it } from "vitest";
import { chaptersForCategory } from "./curriculum";
import { REGIONAL_LEXEMES } from "./regional-vocabulary";

const EXPECTED = { Casa: ["COLCHÓN","PISO","TECHO","PATIO","BAÑO","COCINA","TOALLA","NEVERA","ESTUFA","ALMOHADA","SÁBANA","CORTINA","LÁMPARA","ARMARIO","CUADRO","HORNO"], Comida: ["YUCA","CEREAL","YOGUR","LENTEJA","MANDARINA","TORONJA","LIMA","GUAYABA","PAPAYA","MARACUYÁ","GRANADA","CIRUELA","PESCADO","SALCHICHA","HARINA","CHURRO"], Naturaleza: ["LAGO","RAMA","ARENA","ACANTILADO","CAMPO","TIERRA","BOSQUE","CUEVA","CIELO","CASCADA","VALLE","SELVA","PRADO","CAÑÓN","OCÉANO","ARROYO"] } as const;
function conceptKey(word: string) {
  const lexeme = REGIONAL_LEXEMES.find((item) => item.defaultWord === word || item.acceptedAlternatives?.includes(word) || Object.values(item.variants).includes(word));
  return lexeme ? `regional:${lexeme.conceptId}` : `word:${word}`;
}

describe("chapter-five early curriculum semantics", () => {
  for (const [category, expected] of Object.entries(EXPECTED)) {
    it(`pins 16 reviewed concepts for ${category}`, () => {
      const chapter = chaptersForCategory(category).find((item) => item.chapterNumber === 5);
      expect(chapter?.newWords).toEqual([...expected]);
      expect(new Set((chapter?.newWords ?? []).map(conceptKey)).size).toBe(16);
    });
  }
  it("does not repeat regional synonyms already taught in Comida 1-4", () => {
    const chapters = chaptersForCategory("Comida");
    const previous = new Set(chapters.filter((c) => c.chapterNumber < 5).flatMap((c) => c.newWords).map(conceptKey));
    for (const word of chapters.find((c) => c.chapterNumber === 5)!.newWords) expect(previous.has(conceptKey(word)), word).toBe(false);
  });
  it("keeps known regional synonym families under one concept identity", () => {
    for (const [a,b] of [["BANANA","GUINEO"],["PAPAYA","LECHOSA"],["MARACUYÁ","CHINOLA"],["TORONJA","POMELO"],["BOMBILLA","FOCO"]]) expect(conceptKey(a)).toBe(conceptKey(b));
  });
  it("removes ambiguous/duplicate early entries", () => {
    expect(chaptersForCategory("Casa").find((c) => c.chapterNumber === 5)!.newWords).not.toContain("FOCO");
    const nature = chaptersForCategory("Naturaleza").find((c) => c.chapterNumber === 5)!.newWords;
    expect(nature).not.toContain("MONTE");
    expect(nature).not.toContain("TRUENO");
  });
});
