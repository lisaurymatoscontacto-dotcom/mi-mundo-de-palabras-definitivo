import { describe, expect, it } from "vitest";
import { scoreDifficulty } from "./pedagogy.scoring";

const meta = (structures: ("CV" | "CVC" | "CCV")[], features: string[] = []) => ({
  syllableStructures: structures,
  orthographicRegularity: "regular" as const,
  orthographicFeatures: features,
  evidenceConfidence: "review" as const,
});

describe("pedagogical difficulty rubric", () => {
  it("keeps a short CV-CV word near the base difficulty", () => {
    const score = scoreDifficulty({ letters: 4, syllables: 2, metadata: meta(["CV", "CV"]) });
    expect(score.reading).toBe(1);
    expect(score.writing).toBe(1);
  });

  it("makes consonant clusters harder than simple CV structures", () => {
    const simple = scoreDifficulty({ letters: 4, syllables: 2, metadata: meta(["CV", "CV"]) });
    const cluster = scoreDifficulty({ letters: 5, syllables: 2, metadata: meta(["CCV", "CV"]) });
    expect(cluster.reading).toBeGreaterThan(simple.reading);
  });

  it("can make writing harder than reading for ambiguous spelling", () => {
    const score = scoreDifficulty({ letters: 4, syllables: 2, metadata: meta(["CV", "CV"], ["b-v"]) });
    expect(score.writing).toBeGreaterThan(score.reading);
  });
});
