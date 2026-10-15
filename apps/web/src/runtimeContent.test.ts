import { describe, expect, it } from "vitest";
import type { WordCard } from "@mmdp/core";
import type { AssetCatalogDocument, AssetRecord } from "@mmdp/core/assets";
import { applyAssetCatalog, withoutRemoteVisualDependencies } from "./runtimeContent";

const card = (id: string, word: string, category: string, visual: string): WordCard => ({
  id,
  word,
  category,
  visual,
  visualKind: "emoji",
  visualLicense: "unicode-emoji",
  syllables: [word],
  readingDifficulty: 1,
  writingDifficulty: 1,
  minAge: 4,
  regions: ["latam"],
  demoOnly: true,
});

const asset = (overrides: Partial<AssetRecord>): AssetRecord => ({
  id: "casa.mesa",
  word: "MESA",
  normalized_word: "mesa",
  category: "Casa",
  world: "home",
  difficulty: 1,
  asset_type: "photo",
  asset_path: "photos/casa/mesa.webp",
  source: "Wikimedia Commons",
  source_url: "https://commons.wikimedia.org/wiki/File:Table.jpg",
  author: "Fixture author",
  license: "PUBLIC-DOMAIN",
  attribution_required: false,
  attribution_text: "Fixture author · Public Domain",
  verified: true,
  downloaded_at: "2026-10-14T00:00:00.000Z",
  review_status: "approved",
  thumbnail_path: "photos/casa/mesa.thumb.webp",
  ...overrides,
});

function document(...assets: AssetRecord[]): AssetCatalogDocument {
  return { schema_version: 1, assets };
}

describe("runtime asset catalog", () => {
  it("replaces an approved demo visual with the local approved photo", () => {
    const result = applyAssetCatalog([card("mesa", "MESA", "Casa", "🪑")], document(asset({})));
    expect(result).toHaveLength(1);
    expect(result[0].visualKind).toBe("photo");
    expect(result[0].visual).toBe("/content/photos/casa/mesa.webp");
    expect(result[0].visualLicense).toBe("public-domain");
  });

  it("uses the catalog local path and CC-BY metadata for an approved bundled emoji", () => {
    const gato = asset({
      id: "animales.gato",
      word: "GATO",
      normalized_word: "gato",
      category: "Animales",
      world: "animals",
      asset_type: "emoji",
      asset_path: "emoji/twemoji/1f431.svg",
      source: "Twemoji",
      source_url: "https://github.com/jdecked/twemoji/blob/main/assets/svg/1f431.svg",
      author: "Twemoji contributors",
      license: "CC-BY-4.0",
      attribution_required: true,
      attribution_text: "Twemoji · CC-BY 4.0",
      emoji_unicode: "🐱",
    });
    const result = applyAssetCatalog([card("gato", "GATO", "Animales", "🐱")], document(gato));
    expect(result).toHaveLength(1);
    expect(result[0].visual).toBe("/content/emoji/twemoji/1f431.svg");
    expect(result[0].visualKind).toBe("emoji");
    expect(result[0].visualLicense).toBe("cc-by-4.0");
  });

  it("suppresses cataloged concepts until their asset is approved", () => {
    const pending = asset({ review_status: "pending_review" });
    expect(applyAssetCatalog([card("mesa", "MESA", "Casa", "🪑")], document(pending))).toEqual([]);
  });

  it("suppresses missing concepts instead of reviving an ambiguous legacy visual", () => {
    const missing = asset({
      id: "casa.vaso",
      word: "VASO",
      normalized_word: "vaso",
      asset_type: "missing",
      asset_path: null,
      source: null,
      source_url: null,
      author: null,
      license: "UNKNOWN",
      verified: false,
      downloaded_at: null,
      review_status: "missing",
      attribution_text: null,
      thumbnail_path: null,
    });
    expect(applyAssetCatalog([card("vaso", "VASO", "Casa", "🥛")], document(missing))).toEqual([]);
  });

  it("keeps uncataloged offline-safe demo concepts during the gradual migration", () => {
    const lobo = card("lobo", "LOBO", "Animales", "🐺");
    expect(applyAssetCatalog([lobo], document())).toEqual([lobo]);
  });

  it("never revives a remote photo when the catalog is unavailable", () => {
    const remote = {
      ...card("mesa", "MESA", "Casa", "https://example.com/mesa.jpg"),
      visualKind: "photo" as const,
      visualLicense: "public-domain" as const,
    };
    const local = card("lobo", "LOBO", "Animales", "🐺");
    expect(withoutRemoteVisualDependencies([remote, local])).toEqual([local]);
  });
});
