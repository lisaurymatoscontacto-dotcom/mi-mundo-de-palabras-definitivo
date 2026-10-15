import { describe, expect, it } from "vitest";
import { backTargetForScreen, shuffledLetterTokens, togglePickedLetter } from "./appUi";

describe("writing letter shuffle", () => {
  it("does not leave a normal word already solved", () => {
    for (const word of ["GATO", "CASA", "PERRO", "QUESO", "MARIPOSA"]) {
      const shuffled = shuffledLetterTokens(word);
      expect(shuffled.map((token) => token.letter).join("")).not.toBe(word);
    }
  });

  it("preserves every original letter position as a unique token", () => {
    const shuffled = shuffledLetterTokens("ELEFANTE");
    expect(shuffled).toHaveLength(8);
    expect([...shuffled.map((token) => token.index)].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("is stable for the same word so rerenders do not reshuffle under the child", () => {
    expect(shuffledLetterTokens("BICICLETA")).toEqual(shuffledLetterTokens("BICICLETA"));
  });
});


describe("writing letter undo", () => {
  it("returns a used letter to the bank when tapped again", () => {
    const used = togglePickedLetter([], "2:A");
    expect(used).toEqual(["2:A"]);
    expect(togglePickedLetter(used, "2:A")).toEqual([]);
  });
});

describe("mobile back navigation", () => {
  it("moves through app screens instead of exiting", () => {
    expect(backTargetForScreen("play")).toBe("themes");
    expect(backTargetForScreen("themes")).toBe("home");
    expect(backTargetForScreen("album")).toBe("home");
    expect(backTargetForScreen("parent")).toBe("home");
    expect(backTargetForScreen("home")).toBe("profiles");
    expect(backTargetForScreen("profiles")).toBe("profiles");
  });
});
