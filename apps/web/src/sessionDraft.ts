import type { LearningMode } from "@mmdp/core";

export interface SessionDraftV1 {
  schemaVersion: 1;
  profileId: string;
  mode: LearningMode;
  wordIds: string[];
  index: number;
  /** Legacy global level retained for old drafts/story compatibility. */
  level: number;
  category?: string;
  /** New themed curriculum chapter. Optional keeps old saved drafts valid. */
  chapterId?: string;
  sessionStartStars: number;
  sessionCorrect: number;
  missedWordIds: string[];
  updatedAt: string;
}

const PREFIX = "mmdp.sessionDraft.v1.";

export function validateSessionDraft(value: unknown): value is SessionDraftV1 {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<SessionDraftV1>;
  return draft.schemaVersion === 1
    && typeof draft.profileId === "string"
    && (draft.mode === "reading" || draft.mode === "writing" || draft.mode === "mixed")
    && Array.isArray(draft.wordIds)
    && draft.wordIds.length > 0
    && draft.wordIds.every((id) => typeof id === "string")
    && Number.isInteger(draft.index)
    && (draft.index ?? -1) >= 0
    && (draft.index ?? 0) < draft.wordIds.length
    && Number.isInteger(draft.level)
    && (draft.level ?? 0) >= 1
    && (draft.level ?? 0) <= 48
    && (draft.category === undefined || typeof draft.category === "string")
    && (draft.chapterId === undefined || typeof draft.chapterId === "string")
    && typeof draft.sessionStartStars === "number"
    && typeof draft.sessionCorrect === "number"
    && Array.isArray(draft.missedWordIds)
    && typeof draft.updatedAt === "string";
}

export function saveSessionDraft(draft: Omit<SessionDraftV1, "schemaVersion" | "updatedAt">) {
  const stored: SessionDraftV1 = {
    ...draft,
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(`${PREFIX}${draft.profileId}`, JSON.stringify(stored));
  return stored;
}

export function loadSessionDraft(profileId: string): SessionDraftV1 | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${profileId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!validateSessionDraft(parsed)) {
      localStorage.removeItem(`${PREFIX}${profileId}`);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(`${PREFIX}${profileId}`);
    return null;
  }
}

export function clearSessionDraft(profileId: string) {
  localStorage.removeItem(`${PREFIX}${profileId}`);
}
