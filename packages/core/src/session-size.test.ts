import { describe, expect, it } from "vitest";
import { buildSession, suggestedSessionSize, type WordCard } from "./index";

const word = (id: string): WordCard => ({
  id, word: id.toUpperCase(), category: "Prueba", visual: "⭐", syllables: [id.toUpperCase()],
  readingDifficulty: 1, writingDifficulty: 1, minAge: 4, regions: ["latam"],
});

describe("twenty-card curriculum sessions", () => {
  it("targets twenty cards for every supported age", () => {
    for (const age of [4, 5, 6, 7, 8, 9, 10]) expect(suggestedSessionSize(age)).toBe(20);
  });

  it("never repeats cards merely to fill an incomplete chapter", () => {
    const session = buildSession([word("gato"), word("pato"), word("rana"), word("mono")], {
      age: 5, mode: "reading", region: "latam", level: 1,
    });
    expect(session).toHaveLength(4);
    expect(session.map((card) => card.id)).toHaveLength(new Set(session.map((card) => card.id)).size);
    expect(new Set(session.map((card) => card.id))).toEqual(new Set(["gato", "pato", "rana", "mono"]));
  });
});
