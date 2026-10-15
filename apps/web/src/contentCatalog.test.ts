import { describe, expect, it } from "vitest";
import type { LexiconEntry } from "@mmdp/core/lexicon";
import { cardsFromApprovedDocument } from "./contentCatalog";

const approved: LexiconEntry = {
  id: "animales.gato",
  conceptId: "animales.gato",
  category: "Animales",
  defaultWord: "GATO",
  regionalForms: [{ region: "latam", word: "GATO" }],
  syllables: ["GA", "TO"],
  pedagogy: {
    syllableStructures: ["CV", "CV"],
    ageOfAcquisitionYears: 2.4,
    orthographicRegularity: "regular",
    orthographicFeatures: [],
    evidenceConfidence: "high",
  },
  difficulty: { reading: 1, writing: 1, rubricVersion: "fixture" },
  evidence: [{ sourceId: "fixture", fields: ["all"] }],
  assets: {
    illustrationId: "illustrations/animales/gato.webp",
    audioId: "audio/es-419/gato.mp3",
  },
  status: "approved",
  goldenEligible: false,
};

describe("production content catalog", () => {
  it("converts approved content into image/audio runtime cards", () => {
    const cards = cardsFromApprovedDocument({ schemaVersion: 1, entries: [approved] }, "latam");
    expect(cards).toHaveLength(1);
    expect(cards[0].visualKind).toBe("image");
    expect(cards[0].visual).toBe("/content/illustrations/animales/gato.webp");
    expect(cards[0].audioUrl).toBe("/content/audio/es-419/gato.mp3");
  });

  it("filters entries that are not approved", () => {
    const cards = cardsFromApprovedDocument({ schemaVersion: 1, entries: [{ ...approved, status: "editorial-review" }] }, "latam");
    expect(cards).toEqual([]);
  });
});
