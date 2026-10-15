import { describe, expect, it } from "vitest";
import type { LexiconEntry } from "./lexicon";
import { buildPublishableCards, toPublishableCard } from "./publishable-runtime";

const approved: LexiconEntry = {
  id: "carro",
  conceptId: "vehicle.car",
  category: "Transporte",
  defaultWord: "CARRO",
  regionalForms: [
    { region: "latam", word: "CARRO" },
    { region: "southern-cone", word: "AUTO" },
  ],
  syllables: ["CA", "RRO"],
  pedagogy: {
    syllableStructures: ["CV", "CCV"],
    ageOfAcquisitionYears: 4.2,
    orthographicRegularity: "contextual",
    orthographicFeatures: ["rr"],
    evidenceConfidence: "high",
  },
  difficulty: { reading: 3, writing: 4, rubricVersion: "v1" },
  evidence: [{ sourceId: "fixture", fields: ["aoa"] }],
  assets: { illustrationId: "illustrations/car.webp", audioId: "audio/car.mp3" },
  status: "approved",
  goldenEligible: true,
};

describe("publishable runtime", () => {
  it("uses the regional form and resolves legacy owned assets", () => {
    const result = toPublishableCard(approved, { region: "southern-cone", assetBaseUrl: "/content" });
    expect(result?.card.word).toBe("AUTO");
    expect(result?.illustrationUrl).toBe("/content/illustrations/car.webp");
    expect(result?.audioUrl).toBe("/content/audio/car.mp3");
    expect(result?.card.demoOnly).toBe(false);
  });

  it("publishes a vetted photo with provenance", () => {
    const result = toPublishableCard({
      ...approved,
      id: "mesa",
      defaultWord: "MESA",
      regionalForms: [{ region: "latam", word: "MESA" }],
      assets: {
        visual: {
          kind: "photo",
          value: "photos/casa/mesa.webp",
          license: "cc0-1.0",
          sourceUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
          attribution: "Example · Wikimedia Commons",
        },
        audioId: "audio/es-419/mesa.mp3",
      },
    }, { region: "latam", assetBaseUrl: "/content" });

    expect(result?.card.visualKind).toBe("photo");
    expect(result?.card.visual).toBe("/content/photos/casa/mesa.webp");
    expect(result?.card.visualLicense).toBe("cc0-1.0");
    expect(result?.card.visualSourceUrl).toContain("commons.wikimedia.org");
  });

  it("publishes Unicode emoji without an image file", () => {
    const result = toPublishableCard({
      ...approved,
      id: "gato",
      defaultWord: "GATO",
      regionalForms: [{ region: "latam", word: "GATO" }],
      assets: {
        visual: { kind: "emoji", value: "🐱", license: "unicode-emoji" },
        audioId: "audio/es-419/gato.mp3",
      },
    }, { region: "latam", assetBaseUrl: "/content" });

    expect(result?.card.visualKind).toBe("emoji");
    expect(result?.card.visual).toBe("🐱");
    expect(result?.visualUrl).toBeUndefined();
  });

  it("rejects non-approved content", () => {
    expect(toPublishableCard({ ...approved, status: "editorial-review" }, { region: "latam" })).toBeNull();
  });

  it("returns only production-safe cards", () => {
    const list = buildPublishableCards([
      approved,
      { ...approved, id: "draft", conceptId: "draft", status: "candidate" },
    ], { region: "latam" });
    expect(list).toHaveLength(1);
    expect(list[0].card.id).toBe("carro");
  });
});
