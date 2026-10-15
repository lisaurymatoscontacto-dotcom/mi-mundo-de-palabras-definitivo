import { describe, expect, it } from "vitest";
import { DEMO_WORDS, LEVELS, buildSession, getLevel, nextMastery } from "./index";

describe("progression", () => {
  it("defines exactly 48 levels across 8 stages", () => {
    expect(LEVELS).toHaveLength(48);
    expect(getLevel(1).stage).toBe(1);
    expect(getLevel(48).stage).toBe(8);
  });

  it("clamps level lookups safely", () => {
    expect(getLevel(-10).level).toBe(1);
    expect(getLevel(999).level).toBe(48);
  });
});

describe("mastery", () => {
  it("moves a word to learned and mastered after repeated correct reads", () => {
    const base = { wordId: "gato", correctReads: 0, incorrectReads: 0, mastery: "new" as const };
    const one = nextMastery(base, true);
    const two = nextMastery(one, true);
    const three = nextMastery(two, true);
    expect(one.mastery).toBe("practicing");
    expect(two.mastery).toBe("learned");
    expect(three.mastery).toBe("mastered");
  });

  it("counts incorrect attempts without granting mastery", () => {
    const base = { wordId: "gato", correctReads: 0, incorrectReads: 0, mastery: "new" as const };
    const result = nextMastery(base, false);
    expect(result.incorrectReads).toBe(1);
    expect(result.correctReads).toBe(0);
    expect(result.mastery).toBe("practicing");
  });
});

describe("adaptive session builder", () => {
  it("prioritizes words being practiced", () => {
    const session = buildSession(DEMO_WORDS, {
      age: 7,
      mode: "reading",
      region: "latam",
      size: 5,
      progress: {
        gato: { wordId: "gato", correctReads: 0, incorrectReads: 3, mastery: "practicing" },
      },
    });
    expect(session[0]?.id).toBe("gato");
  });

  it("respects theme filters", () => {
    const session = buildSession(DEMO_WORDS, {
      age: 7,
      mode: "reading",
      region: "latam",
      category: "Animales",
      size: 10,
    });
    expect(session.length).toBeGreaterThan(0);
    expect(session.every((word) => word.category === "Animales")).toBe(true);
  });
});
