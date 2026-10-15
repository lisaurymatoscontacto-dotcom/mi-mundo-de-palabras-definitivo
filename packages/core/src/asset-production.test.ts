import { describe, expect, it } from "vitest";
import { CANDIDATE_WORDS, CANDIDATE_WORD_COUNT } from "./candidate.words";
import { automaticEmojiForWord, contentSlug, createAssetProductionManifest, recommendedEmojiForWord } from "./asset-production";

describe("asset production manifest", () => {
  it("creates one deterministic task per candidate word", () => {
    const manifest = createAssetProductionManifest(CANDIDATE_WORDS);
    expect(manifest).toHaveLength(CANDIDATE_WORD_COUNT);
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const task of manifest) {
      if (seen.has(task.id)) duplicates.push(`${task.id} (${task.category}: ${task.word})`);
      seen.add(task.id);
    }
    expect(duplicates, `asset-id collisions: ${duplicates.join(", ")}`).toEqual([]);
  });

  it("creates stable accent-safe photo and audio paths", () => {
    expect(contentSlug("ARCOÍRIS")).toBe("arcoiris");
    const task = createAssetProductionManifest({ Casa: ["MESA"] })[0];
    expect(task.photoId).toBe("photos/casa/mesa.webp");
    expect(task.audioId).toBe("audio/es-419/mesa.mp3");
    expect(task.photoLicensePolicy).toBe("public-domain-or-cc0");
  });

  it("uses strict emoji automation when the concept is clear", () => {
    const task = createAssetProductionManifest({ Animales: ["GATO"] })[0];
    expect(task.recommendedVisualKind).toBe("emoji");
    expect(task.emojiCandidate).toBe("🐱");
    expect(task.photoId).toBeUndefined();
  });

  it("keeps broad editorial suggestions separate from automatic decisions", () => {
    expect(recommendedEmojiForWord("GOMA")).toBe("🧽");
    expect(automaticEmojiForWord("GOMA")).toBeUndefined();
    expect(automaticEmojiForWord("CUBO")).toBeUndefined();
    expect(automaticEmojiForWord("SUBMARINO")).toBeUndefined();
    expect(automaticEmojiForWord("FARO")).toBeUndefined();
    expect(automaticEmojiForWord("ESTÓMAGO")).toBeUndefined();
    expect(automaticEmojiForWord("COLUMPIO")).toBeUndefined();
  });

  it("falls back to a vetted photo task when emoji would be ambiguous", () => {
    const task = createAssetProductionManifest({ Casa: ["MESA"] })[0];
    expect(task.recommendedVisualKind).toBe("photo");
    expect(task.photoSourcePolicy).toBe("verified-source-required");
  });
});
