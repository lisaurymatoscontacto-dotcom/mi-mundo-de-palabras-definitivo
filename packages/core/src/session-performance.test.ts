import { describe, expect, it } from "vitest";
import { addMissedWord, evaluateSession } from "./session-performance";

describe("evaluateSession", () => {
  it("passes 8 of 10", () => {
    expect(evaluateSession({ totalWords: 10, correctWords: 8, missedWordIds: ["a", "b"] }).passed).toBe(true);
  });

  it("fails 7 of 10", () => {
    const result = evaluateSession({ totalWords: 10, correctWords: 7, missedWordIds: ["a", "b", "c"] });
    expect(result.passed).toBe(false);
    expect(result.requiredCorrect).toBe(8);
  });

  it("scales the 80 percent rule to shorter age-based sessions", () => {
    expect(evaluateSession({ totalWords: 6, correctWords: 5, missedWordIds: [] }).requiredCorrect).toBe(5);
    expect(evaluateSession({ totalWords: 8, correctWords: 7, missedWordIds: [] }).requiredCorrect).toBe(7);
  });
});

describe("addMissedWord", () => {
  it("does not duplicate a missed word", () => {
    expect(addMissedWord(addMissedWord([], "gato"), "gato")).toEqual(["gato"]);
  });
});
