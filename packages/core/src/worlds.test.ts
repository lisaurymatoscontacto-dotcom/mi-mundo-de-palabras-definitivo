import { describe, expect, it } from "vitest";
import { CANDIDATE_WORDS } from "./candidate.words";
import { LEARNING_WORLDS, worldForCategory } from "./worlds";

describe("learning worlds", () => {
  it("covers every launch candidate category exactly once", () => {
    const categories = Object.keys(CANDIDATE_WORDS).sort((a, b) => a.localeCompare(b, "es"));
    const worldCategories = LEARNING_WORLDS.map((world) => world.category).sort((a, b) => a.localeCompare(b, "es"));
    expect(worldCategories).toEqual(categories);
    expect(new Set(LEARNING_WORLDS.map((world) => world.id)).size).toBe(LEARNING_WORLDS.length);
  });

  it("keeps a stable 1..12 navigation order", () => {
    expect(LEARNING_WORLDS.map((world) => world.order)).toEqual(Array.from({ length: 12 }, (_, index) => index + 1));
  });

  it("finds a world by category", () => {
    expect(worldForCategory("Océano")?.icon).toBe("🌊");
  });
});
