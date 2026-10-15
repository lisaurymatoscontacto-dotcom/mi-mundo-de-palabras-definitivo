import { describe, expect, it } from "vitest";
import type { AssetRecord } from "@mmdp/core/assets";
import { collectAssetCredits } from "./assetCredits";

const approved: AssetRecord = {
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
};

describe("asset credits", () => {
  it("deduplicates approved required attribution", () => {
    expect(collectAssetCredits([
      approved,
      { ...approved, id: "animales.pato", source_url: "https://github.com/jdecked/twemoji/blob/main/assets/svg/1f986.svg" },
    ])).toEqual([
      {
        key: "Twemoji graphics, CC-BY 4.0.",
        text: "Twemoji graphics, CC-BY 4.0.",
        sourceUrl: "https://github.com/jdecked/twemoji/blob/main/assets/svg/1f431.svg",
      },
    ]);
  });

  it("hides pending or attribution-free assets", () => {
    expect(collectAssetCredits([
      { ...approved, review_status: "pending_review" },
      { ...approved, id: "casa.mesa", attribution_required: false },
    ])).toEqual([]);
  });
});
