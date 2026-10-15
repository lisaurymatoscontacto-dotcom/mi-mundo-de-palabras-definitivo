import type { MasteryState, WordProgress } from "@mmdp/core";
import { touchSyncClock } from "./syncClock";

const KEY = "mmdp-progress-v1";

export interface ProfileProgress {
  stars: number;
  discovered: string[];
  golden: string[];
  words: Record<string, WordProgress>;
  currentLevel: number;
  completedLevels: number[];
}

function empty(): ProfileProgress {
  return { stars: 0, discovered: [], golden: [], words: {}, currentLevel: 1, completedLevels: [] };
}

function normalize(progress?: Partial<ProfileProgress>): ProfileProgress {
  return {
    stars: progress?.stars ?? 0,
    discovered: progress?.discovered ?? [],
    golden: progress?.golden ?? [],
    words: progress?.words ?? {},
    currentLevel: Math.max(1, Math.min(48, progress?.currentLevel ?? 1)),
    completedLevels: progress?.completedLevels ?? [],
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

export function masteryLabel(state: MasteryState): string {
  return ({ new: "Nueva", practicing: "En práctica", learned: "Aprendida", mastered: "Dominada" })[state];
}
