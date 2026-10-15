import { describe, expect, it } from "vitest";
import { validateSessionDraft } from "./sessionDraft";

const validDraft = {
  schemaVersion: 1 as const,
  profileId: "child-1",
  mode: "reading" as const,
  wordIds: ["gato", "pato", "casa"],
  index: 1,
  level: 3,
  sessionStartStars: 20,
  sessionCorrect: 1,
  missedWordIds: ["gato"],
  updatedAt: "2026-10-08T00:00:00.000Z",
};

describe("session drafts", () => {
  it("accepts a resumable session", () => {
    expect(validateSessionDraft(validDraft)).toBe(true);
  });

  it("rejects an index outside the session", () => {
    expect(validateSessionDraft({ ...validDraft, index: 3 })).toBe(false);
  });

  it("rejects invalid modes and levels", () => {
    expect(validateSessionDraft({ ...validDraft, mode: "voice" })).toBe(false);
    expect(validateSessionDraft({ ...validDraft, level: 49 })).toBe(false);
  });
});
