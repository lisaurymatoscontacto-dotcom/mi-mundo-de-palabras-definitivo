import { describe, expect, it } from "vitest";
import { pickSpatialTarget } from "./tvNavigationGeometry";

describe("TV spatial navigation", () => {
  const from = { x: 100, y: 100 };

  it("prefers a control on the same row for ArrowRight", () => {
    const target = pickSpatialTarget(from, "ArrowRight", [
      { item: "diagonal", point: { x: 150, y: 180 } },
      { item: "right", point: { x: 190, y: 105 } },
    ]);
    expect(target).toBe("right");
  });

  it("does not choose controls behind the requested direction", () => {
    const target = pickSpatialTarget(from, "ArrowLeft", [
      { item: "right", point: { x: 20, y: 105 } },
      { item: "wrong", point: { x: 180, y: 100 } },
    ]);
    expect(target).toBe("right");
  });

  it("returns null when no candidate exists in that direction", () => {
    expect(pickSpatialTarget(from, "ArrowUp", [
      { item: "down", point: { x: 100, y: 180 } },
    ])).toBeNull();
  });
});
