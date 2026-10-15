import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_WORDS } from "../packages/core/src/index";
import { canPublishAsset, type AssetCatalogDocument } from "../packages/core/src/assets";
import { automaticEmojiForWord } from "../packages/core/src/asset-production";
import { applyAssetCatalog, loadRuntimeCards } from "../apps/web/src/runtimeContent";
import { cardMediaUrls } from "../apps/web/src/offlineMedia";

const catalog = JSON.parse(await readFile("content/assets.catalog.json", "utf8")) as AssetCatalogDocument;
const reviews = JSON.parse(await readFile("content/asset-reviews/pilot-photos.json", "utf8"));
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
afterEach(() => vi.unstubAllGlobals());

describe("reviewed pilot photos", () => {
  it.each(["MAR", "PLATO", "VASO"])("publishes %s as a verified local photo with intact provenance", async (word) => {
    const asset = catalog.assets.find((entry) => entry.word === word)!;
    const review = reviews.assets.find((entry: { id: string }) => entry.id === asset.id);
    expect(canPublishAsset(asset)).toBe(true);
    expect(asset.asset_type).toBe("photo");
    expect(asset.license).toBe("CC0-1.0");
    expect(asset.emoji_unicode).toBeNull();
    expect(automaticEmojiForWord(word)).toBeUndefined();
    expect(review).toMatchObject({review_status: "approved", source_url: asset.source_url, download_url: asset.download_url, author: asset.author, license: asset.license});
    expect(review.source_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(review.review_note.length).toBeGreaterThan(40);
    for (const [path, digest, maxSize] of [
      [asset.asset_path!, review.asset_sha256, 960],
      [asset.thumbnail_path!, review.thumbnail_sha256, 320],
    ] as const) {
      const bytes = await readFile(resolve("apps/web/public/content", path));
      expect(sha256(bytes)).toBe(digest);
      const metadata = await sharp(bytes).metadata();
      expect(metadata.format).toBe("webp");
      expect(metadata.width).toBeGreaterThan(100);
      expect(metadata.height).toBeGreaterThan(100);
      expect(Math.max(metadata.width!, metadata.height!)).toBeLessThanOrEqual(maxSize);
    }
    const cards = applyAssetCatalog(DEMO_WORDS, catalog).filter((card) => card.word === word);
    expect(cards).toHaveLength(1);
    expect(cards[0].visual).toBe(`/content/${asset.asset_path}`);
    expect(cards[0].visualKind).toBe("photo");
    expect(cards[0].visualSourceUrl).toBe(asset.source_url);
    expect(cardMediaUrls(cards)).toContain(`/content/${asset.asset_path}`);
    for (const status of ["pending_review", "rejected"] as const) {
      const unapproved = {...catalog, assets: catalog.assets.map((entry) => entry.id === asset.id ? {...entry, review_status: status} : entry)};
      expect(applyAssetCatalog(DEMO_WORDS, unapproved).some((card) => card.word === word)).toBe(false);
    }
  });

  it("keeps the reviewed hybrid pilot when both metadata requests fail offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Offline")));
    const cards = await loadRuntimeCards("latam");
    expect(cards).toHaveLength(DEMO_WORDS.length);
    expect(cards.filter((card) => card.visualKind === "emoji")).toHaveLength(18);
    expect(cards.filter((card) => card.visualKind === "photo")).toHaveLength(6);
    for (const word of ["MAR", "PLATO", "VASO"]) {
      expect(cards.find((card) => card.word === word)?.visualKind).toBe("photo");
    }
    expect(cardMediaUrls(cards).every((url) => url.startsWith("/content/"))).toBe(true);
  });

  it("publishes the exact reviewed catalog to the offline content directory", async () => {
    expect(await readFile("apps/web/public/content/assets.catalog.json", "utf8"))
      .toBe(await readFile("content/assets.catalog.json", "utf8"));
  });
});