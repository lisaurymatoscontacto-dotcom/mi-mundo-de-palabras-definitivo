import { describe, expect, it } from "vitest";
import { validateBackup } from "./backup";

describe("backup validation", () => {
  it("accepts a valid v1 backup", () => {
    expect(validateBackup({
      app: "mi-mundo-de-palabras",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      profiles: [],
      progress: {},
      activeProfileId: null,
    })).toBe(true);
  });

  it("rejects unrelated JSON", () => {
    expect(validateBackup({ app: "otra-app", schemaVersion: 1, profiles: [], progress: {} })).toBe(false);
  });
});
