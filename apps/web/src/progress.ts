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
  /** New thematic progression. Missing only on pre-migration/in-memory legacy state. */
  curriculum?: CurriculumProgress;
}

function emptyTrack(): CurriculumTrackProgress {
  return { currentChapterOrder: 1, completedChapterIds: [] };
}

export function emptyCurriculum(): CurriculumProgress {
  return {
    reading: emptyTrack(),
    writing: emptyTrack(),
    mixed: emptyTrack(),
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
    // Old profiles intentionally start the new themed route at chapter 1 rather
    // than inheriting the flawed prototype level. Stars/mastery/story progress
    // are preserved.
    curriculum: normalizeCurriculum(progress?.curriculum),
  };
}

export function loadProgress(profileId: string): ProfileProgress {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, Partial<ProfileProgress>>;
    return normalize(all[profileId]);
  } catch {
    return normalize();
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
  return normalizeCurriculum(progress.curriculum)[mode];
}

export function completeCurriculumChapter(
  progress: ProfileProgress,
  mode: LearningMode,
  chapterId: string,
  chapterOrder: number,
): ProfileProgress {
  const curriculum = normalizeCurriculum(progress.curriculum);
  const track = curriculum[mode];
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
      ...curriculum,
      [mode]: nextTrack,
    },
  };
}

export function masteryLabel(state: MasteryState): string {
  return ({ new: "Nueva", practicing: "En práctica", learned: "Aprendida", mastered: "Dominada" })[state];
}
