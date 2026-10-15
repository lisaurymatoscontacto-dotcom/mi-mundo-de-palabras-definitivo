import { describe, expect, it } from "vitest";
import type { WordCard } from "@mmdp/core";
import { cardMediaUrls } from "./offlineMedia";

const base: WordCard = {
  id: "gato",
  word: "GATO",
  category: "Animales",
  visual: "/assets/illustrations/animales/gato.webp",
  visualKind: "image",
  audioUrl: "/assets/audio/es-419/gato.mp3",
  syllables: ["GA", "TO"],
  readingDifficulty: 1,
  writingDifficulty: 1,
  minAge: 4,
  regions: ["latam"],
};

describe("offline card media", () => {
  it("collects approved visual and audio assets once", () => {
    expect(cardMediaUrls([base, { ...base, id: "gato-copy" }])).toEqual([
      "/assets/illustrations/animales/gato.webp",
      "/assets/audio/es-419/gato.mp3",
    ]);
  });

  it("collects photo cards for offline use", () => {
    expect(cardMediaUrls([{
      ...base,
      id: "mesa",
      visual: "/content/photos/casa/mesa.webp",
      visualKind: "photo",
      visualLicense: "cc0-1.0",
    }])).toEqual([
      "/content/photos/casa/mesa.webp",
      "/assets/audio/es-419/gato.mp3",
    ]);
  });

  it("collects direct catalog emoji SVG paths", () => {
    expect(cardMediaUrls([{
      ...base,
      visual: "/content/emoji/twemoji/1f431.svg",
      visualKind: "emoji",
      visualLicense: "cc-by-4.0",
      audioUrl: undefined,
    }])).toEqual(["/content/emoji/twemoji/1f431.svg"]);
  });

  it("keeps legacy bundled lookup during gradual migration but ignores unbundled system emoji", () => {
    const cards: WordCard[] = [
      {
        ...base,
        visual: "🐱",
        visualKind: "emoji",
        visualLicense: "unicode-emoji",
        audioUrl: undefined,
      },
      {
        ...base,
        id: "sol",
        word: "SOL",
        visual: "☀️",
        visualKind: "emoji",
        visualLicense: "unicode-emoji",
        audioUrl: undefined,
      },
    ];
    expect(cardMediaUrls(cards)).toEqual(["/content/emoji/twemoji/1f431.svg"]);
  });
});
