import { describe, expect, it } from "vitest";
import { twemojiCodepointCandidates } from "./twemoji";

describe("twemoji codepoint candidates", () => {
  it("returns one filename for a simple emoji", () => {
    expect(twemojiCodepointCandidates("🐱")).toEqual(["1f431"]);
  });

  it("prefers the common stripped variation-selector spelling", () => {
    expect(twemojiCodepointCandidates("☀️")).toEqual(["2600", "2600-fe0f"]);
  });

  it("keeps a preserved-selector fallback for ZWJ gender sequences", () => {
    expect(twemojiCodepointCandidates("🧜‍♀️")).toEqual([
      "1f9dc-200d-2640",
      "1f9dc-200d-2640-fe0f",
    ]);
  });
});
