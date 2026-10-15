import { describe, expect, it } from "vitest";
import { completeCurriculumChapter, curriculumTrack, type ProfileProgress } from "./progress";

const legacyProgress = (): ProfileProgress => ({
  stars: 12,
  discovered: ["gato"],
  golden: [],
  words: {},
  currentLevel: 4,
  completedLevels: [1, 2, 3],
});

describe("curriculum progress", () => {
  it("migrates legacy profiles to chapter one without losing old progress", () => {
    const progress = legacyProgress();
    expect(curriculumTrack(progress, "reading")).toEqual({ currentChapterOrder: 1, completedChapterIds: [] });
    expect(progress.currentLevel).toBe(4);
    expect(progress.stars).toBe(12);
  });

  it("advances reading independently from writing", () => {
    const completed = completeCurriculumChapter(legacyProgress(), "reading", "animals-1", 1);
    expect(curriculumTrack(completed, "reading")).toEqual({ currentChapterOrder: 2, completedChapterIds: ["animals-1"] });
    expect(curriculumTrack(completed, "writing")).toEqual({ currentChapterOrder: 1, completedChapterIds: [] });
  });

  it("does not duplicate a completed chapter", () => {
    const once = completeCurriculumChapter(legacyProgress(), "reading", "animals-1", 1);
    const twice = completeCurriculumChapter(once, "reading", "animals-1", 1);
    expect(curriculumTrack(twice, "reading").completedChapterIds).toEqual(["animals-1"]);
  });
});
