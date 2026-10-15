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

  it("does not skip earlier chapters when a later chapter in the block is completed first", () => {
    const completed = completeCurriculumChapter(legacyProgress(), "reading", "nature-1", 4);
    expect(curriculumTrack(completed, "reading")).toEqual({ currentChapterOrder: 1, completedChapterIds: ["nature-1"] });
  });

  it("moves to chapter five only after all four chapters in the first block are complete", () => {
    let progress = legacyProgress();
    progress = completeCurriculumChapter(progress, "reading", "nature-1", 4);
    progress = completeCurriculumChapter(progress, "reading", "food-1", 3);
    progress = completeCurriculumChapter(progress, "reading", "animals-1", 1);
    progress = completeCurriculumChapter(progress, "reading", "home-1", 2);
    expect(curriculumTrack(progress, "reading").currentChapterOrder).toBe(5);
    expect(curriculumTrack(progress, "reading").completedChapterIds).toHaveLength(4);
  });

  it("does not duplicate a completed chapter", () => {
    const once = completeCurriculumChapter(legacyProgress(), "reading", "animals-1", 1);
    const twice = completeCurriculumChapter(once, "reading", "animals-1", 1);
    expect(curriculumTrack(twice, "reading").completedChapterIds).toEqual(["animals-1"]);
  });
});
