import type { LearningMode, MasteryState, WordProgress } from "@mmdp/core";
import { touchSyncClock } from "./syncClock";

const KEY = "mmdp-progress-v1";

export interface CurriculumTrackProgress {
  currentChapterOrder: number;
  completedChapterIds: string[];
}

export type CurriculumProgress = Record<LearningMode, CurriculumTrackProgress>;

export interface ProfileProgress {
  stars: number;
  discovered: string[];
  golden: string[];
  words: Record<string, WordProgress>;
  /** Legacy global level kept for story unlocks and backward compatibility. */
  currentLevel: number;
  /** Legacy global completions kept for backward compatibility. */
  completedLevels: number[];
  /** New thematic progression. Reading, writing and mixed advance independently. */
  curriculum: CurriculumProgress;
}

function emptyTrack(): CurriculumTrackProgress {
  return { currentChapterOrder: 1, completedChapterIds: [] };
}

function emptyCurriculum(): CurriculumProgress {
  return {
    reading: emptyTrack(),
    writing: emptyTrack(),
    mixed: emptyTrack(),
  };
}

function empty(): ProfileProgress {
  return {
    stars: 0,
    discovered: [],
    golden: [],
    words: {},
    currentLevel: 1,
    completedLevels: [],
    curriculum: emptyCurriculum(),
  };
}

function normalizeTrack(progress?: Partial<CurriculumTrackProgress>): CurriculumTrackProgress {
  return {
    currentChapterOrder: Math.max(1, Math.floor(progress?.currentChapterOrder ?? 1)),
    completedChapterIds: [...new Set(progress?.completedChapterIds ?? [])],
  };
}

function normalizeCurriculum(progress?: Partial<CurriculumProgress>): CurriculumProgress {
  return {
    reading: normalizeTrack(progress?.reading),
    writing: normalizeTrack(progress?.writing),
    mixed: normalizeTrack(progress?.mixed),
  };
}

function normalize(progress?: Partial<ProfileProgress>): ProfileProgress {
  return {
    stars: progress?.stars ?? 0,
    discovered: progress?.discovered ?? [],
    golden: progress?.golden ?? [],
    words: progress?.words ?? {},
    currentLevel: Math.max(1, Math.min(48, progress?.currentLevel ?? 1)),
    completedLevels: progress?.completedLevels ?? [],
    // Old profiles did not have curriculum data. They intentionally begin the
    // new themed route at chapter 1 instead of inheriting the flawed prototype
    // level, while keeping stars/mastery/story unlocks intact.
    curriculum: normalizeCurriculum(progress?.curriculum),
  };
}

export function loadProgress(profileId: string): ProfileProgress {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, Partial<ProfileProgress>>;
    return normalize(all[profileId]);
  } catch {
    return empty();
  }
}

export function saveProgress(profileId: string, progress: ProfileProgress) {
  let all: Record<string, ProfileProgress> = {};
  try { all = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch {}
  all[profileId] = normalize(progress);
  localStorage.setItem(KEY, JSON.stringify(all));
  touchSyncClock();
}

export function curriculumTrack(progress: ProfileProgress, mode: LearningMode): CurriculumTrackProgress {
  return progress.curriculum[mode];
}

export function completeCurriculumChapter(
  progress: ProfileProgress,
  mode: LearningMode,
  chapterId: string,
  chapterOrder: number,
): ProfileProgress {
  const track = progress.curriculum[mode];
  const completedChapterIds = track.completedChapterIds.includes(chapterId)
    ? track.completedChapterIds
    : [...track.completedChapterIds, chapterId];
  const nextTrack: CurriculumTrackProgress = {
    completedChapterIds,
    currentChapterOrder: Math.max(track.currentChapterOrder, chapterOrder + 1),
  };
  return {
    ...progress,
    curriculum: {
      ...progress.curriculum,
      [mode]: nextTrack,
    },
  };
}

export function masteryLabel(state: MasteryState): string {
  return ({ new: "Nueva", practicing: "En práctica", learned: "Aprendida", mastered: "Dominada" })[state];
}
