import { describe, expect, it } from "vitest";
import { curriculumBatches, currentCurriculumBatch } from "./CurriculumPath";

describe("curriculum unlock batches", () => {
  it("starts with the four approved introductory worlds", () => {
    const batches = curriculumBatches();
    expect(batches).toHaveLength(57);
    expect(batches[0].map((chapter) => chapter.label)).toEqual([
      "Animales 1",
      "Casa 1",
      "Comida 1",
      "Naturaleza 1",
    ]);
  });

  it("does not move forward until every chapter in the current block is complete", () => {
    const partial = currentCurriculumBatch(["home-1", "food-1", "nature-1"]);
    expect(partial.batchIndex).toBe(0);
    expect(partial.batch.map((chapter) => chapter.label)).toContain("Animales 1");

    const next = currentCurriculumBatch(["animals-1", "home-1", "food-1", "nature-1"]);
    expect(next.batchIndex).toBe(1);
    expect(next.batch.map((chapter) => chapter.label)).toEqual([
      "Cuerpo 1",
      "Ropa 1",
      "Transporte 1",
      "Escuela 1",
    ]);
  });

  it("returns to the first worlds as chapter two after all twelve chapter-one worlds", () => {
    const batches = curriculumBatches();
    expect(batches[3].map((chapter) => chapter.label)).toEqual([
      "Animales 2",
      "Casa 2",
      "Comida 2",
      "Naturaleza 2",
    ]);
  });
});
