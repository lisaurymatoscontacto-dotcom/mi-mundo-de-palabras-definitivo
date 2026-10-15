import { describe, expect, it } from "vitest";
import { validateLexiconEntry, type LexiconEntry } from "./lexicon";

const base: LexiconEntry = {
  id: "gato",
  conceptId: "cat",
  category: "Animales",
  defaultWord: "GATO",
  regionalForms: [{ region: "latam", word: "GATO" }],
  syllables: ["GA", "TO"],
  pedagogy: {
    syllableStructures: ["CV", "CV"],
    ageOfAcquisitionYears: 2.4,
    imageability: 5,
    orthographicRegularity: "regular",
    orthographicFeatures: [],
    evidenceConfidence: "high",
  },
  difficulty: { reading: 1, writing: 1, rubricVersion: "0.1-provisional" },
  evidence: [{ sourceId: "alonso-2015-aoa", fields: ["ageOfAcquisitionYears"] }],
  assets: { illustrationId: "illustrations/animals/cat-v1.webp", audioId: "audio/es-419/gato-v1.mp3" },
  status: "approved",
  goldenEligible: true,
};

describe("lexicon publishing validation", () => {
  it("accepts an evidenced entry with production assets", () => {
    expect(validateLexiconEntry(base, true).valid).toBe(true);
  });

  it("accepts a zero-obligation photo with provenance", () => {
    const result = validateLexiconEntry({
      ...base,
      assets: {
        visual: {
          kind: "photo",
          value: "photos/casa/mesa.webp",
          license: "cc0-1.0",
          sourceUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
        },
        audioId: "audio/es-419/mesa.mp3",
      },
    }, true);
    expect(result.valid).toBe(true);
  });

  it("rejects approved cards without visual or audio", () => {
    const result = validateLexiconEntry({ ...base, assets: {} }, true);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("approved entry requires a production visual");
    expect(result.errors).toContain("approved entry requires pronunciation audio");
  });

  it("rejects photos that are not public-domain or CC0", () => {
    const result = validateLexiconEntry({
      ...base,
      assets: {
        visual: {
          kind: "photo",
          value: "https://example.com/photo.jpg",
          license: "legacy-owned",
          sourceUrl: "https://example.com/source",
        },
        audioId: "audio/es-419/gato.mp3",
      },
    }, true);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("photo must be public-domain or CC0");
  });

  it("rejects mismatched syllable structures", () => {
    const result = validateLexiconEntry({
      ...base,
      pedagogy: { ...base.pedagogy, syllableStructures: ["CV"] },
    });
    expect(result.valid).toBe(false);
  });
});
