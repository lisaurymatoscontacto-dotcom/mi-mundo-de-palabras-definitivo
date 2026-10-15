import { describe, expect, it } from "vitest";
import type { AssetRecord } from "./assets";
import { createQueuedAssetRecord, enqueueMissingAssetRecords } from "./asset-queue";

describe("asset queue", () => {
  it("creates honest missing records without inventing difficulty", () => {
    const record = createQueuedAssetRecord("Casa", "VASO");
    expect(record).toMatchObject({
      id: "casa.vaso",
      normalized_word: "vaso",
      world: "home",
      difficulty: null,
      asset_type: "missing",
      review_status: "missing",
      emoji_unicode: null,
    });
  });

  it("records a strict emoji candidate only for safe concepts", () => {
    expect(createQueuedAssetRecord("Animales", "PERRO").emoji_unicode).toBe("🐶");
    expect(createQueuedAssetRecord("Escuela", "GOMA").emoji_unicode).toBeNull();
  });

  it("queues only missing records up to the requested batch limit", () => {
    const existing = [createQueuedAssetRecord("Animales", "GATO")] as AssetRecord[];
    const queued = enqueueMissingAssetRecords(
      { Animales: ["GATO", "PATO", "VACA", "PERRO"] },
      existing,
      { limit: 2 },
    );
    expect(queued.map((asset) => asset.id)).toEqual(["animales.pato", "animales.vaca"]);
  });

  it("honors explicit concept ids", () => {
    const queued = enqueueMissingAssetRecords(
      { Casa: ["MESA", "VASO"], Escuela: ["GOMA"] },
      [],
      { limit: 5, selectedIds: new Set(["escuela.goma"]) },
    );
    expect(queued.map((asset) => asset.id)).toEqual(["escuela.goma"]);
  });
});
