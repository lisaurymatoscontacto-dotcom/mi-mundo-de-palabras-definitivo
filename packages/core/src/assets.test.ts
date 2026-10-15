import { describe, expect, it } from "vitest";
import { canPublishAsset, validateAssetRecord, type AssetRecord } from "./assets";

const base: AssetRecord = {
  id: "animales.gato",
  word: "GATO",
  normalized_word: "gato",
  category: "Animales",
  world: "animals",
  difficulty: 1,
  asset_type: "emoji",
  asset_path: "emoji/twemoji/1f431.svg",
  source: "Twemoji",
  source_url: "https://github.com/jdecked/twemoji/blob/main/assets/svg/1f431.svg",
  author: "Twemoji contributors",
  license: "CC-BY-4.0",
  attribution_required: true,
  attribution_text: "Twemoji graphics, CC-BY 4.0.",
  verified: true,
  downloaded_at: "2026-10-14T14:45:00.000Z",
  review_status: "approved",
  emoji_unicode: "🐱",
};

describe("asset catalog validation", () => {
  it("allows a verified local approved emoji asset", () => {
    expect(validateAssetRecord(base)).toEqual([]);
    expect(canPublishAsset(base)).toBe(true);
  });

  it("never treats a remote approved asset as offline-ready", () => {
    const remote = { ...base, asset_path: "https://example.com/cat.svg" };
    expect(validateAssetRecord(remote)).toContain("animales.gato: approved asset_path must be local for offline use");
    expect(canPublishAsset(remote)).toBe(false);
  });

  it("rejects attribution-required assets without attribution text", () => {
    expect(validateAssetRecord({ ...base, attribution_text: null })).toContain(
      "animales.gato: attribution_text is required when attribution_required=true",
    );
  });

  it("keeps missing concepts explicitly unresolved", () => {
    const missing: AssetRecord = {
      ...base,
      id: "casa.vaso",
      word: "VASO",
      normalized_word: "vaso",
      asset_type: "missing",
      asset_path: null,
      source: null,
      source_url: null,
      author: null,
      license: "UNKNOWN",
      attribution_required: false,
      attribution_text: null,
      verified: false,
      downloaded_at: null,
      review_status: "missing",
    };
    expect(validateAssetRecord(missing)).toEqual([]);
    expect(canPublishAsset(missing)).toBe(false);
  });

  it("does not allow CC-BY photos in the strict automatic photo policy", () => {
    const photo: AssetRecord = {
      ...base,
      id: "casa.mesa",
      word: "MESA",
      normalized_word: "mesa",
      asset_type: "photo",
      asset_path: "photos/casa/mesa.webp",
      license: "CC-BY-4.0",
      review_status: "pending_review",
      downloaded_at: null,
    };
    expect(validateAssetRecord(photo)).toContain("casa.mesa: photo must be CC0-1.0 or PUBLIC-DOMAIN");
  });
});
