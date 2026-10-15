import { describe, expect, it } from "vitest";
import { analyzeSpanishOrthography } from "./orthography";

describe("Spanish orthographic editorial analysis", () => {
  it("flags RR and writing ambiguity", () => {
    const result = analyzeSpanishOrthography("PERRO");
    expect(result.regularity).toBe("contextual");
    expect(result.features).toContain("rr");
  });

  it("flags QU and silent H", () => {
    expect(analyzeSpanishOrthography("QUESO").features).toContain("qu");
    expect(analyzeSpanishOrthography("HUEVO").features).toContain("h-silent");
  });

  it("keeps a simple word regular while still flagging writing ambiguity", () => {
    const result = analyzeSpanishOrthography("VACA");
    expect(result.regularity).toBe("regular");
    expect(result.features).toContain("b-v");
  });
});
