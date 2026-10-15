import { afterEach, describe, expect, it } from "vitest";
import { DEMO_CATEGORIES, DEMO_WORDS, type WordCard } from "./index";
import { applyRuntimeWordCatalog, restorePilotCatalog } from "./runtime-catalog";

const productionCard: WordCard = {
  id: "animales.gato.production",
  word: "GATO",
  category: "Animales",
  visual: "/content/illustrations/animales/gato.webp",
  visualKind: "image",
  audioUrl: "/content/audio/es-419/gato.mp3",
  syllables: ["GA", "TO"],
  readingDifficulty: 1,
  writingDifficulty: 1,
  minAge: 4,
  regions: ["latam"],
  demoOnly: false,
};

afterEach(() => restorePilotCatalog());

describe("runtime catalog", () => {
  it("replaces the pilot arrays in place so existing imports see production content", () => {
    const originalReference = DEMO_WORDS;
    applyRuntimeWordCatalog([productionCard]);
    expect(DEMO_WORDS).toBe(originalReference);
    expect(DEMO_WORDS).toHaveLength(1);
    expect(DEMO_WORDS[0].id).toBe(productionCard.id);
    expect(DEMO_CATEGORIES).toEqual(["Animales"]);
  });

  it("restores the pilot when no approved content is available", () => {
    applyRuntimeWordCatalog([productionCard]);
    const result = restorePilotCatalog();
    expect(result.production).toBe(false);
    expect(DEMO_WORDS.length).toBeGreaterThan(1);
    expect(DEMO_WORDS.some((word) => word.demoOnly)).toBe(true);
  });
});
