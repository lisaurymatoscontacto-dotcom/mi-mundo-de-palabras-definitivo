import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const EXPECTED_BLOBS: Record<string, string> = {
  "1f431.svg": "cc75dcc68f5a8afc9de48f7a8417ea6a796afac4",
  "1f986.svg": "085c9006346839f4f04d9be09852a0136a39c0de",
  "1f404.svg": "4c791dcc621e04e80583b15112b9b4ce2165299e",
  "1f319.svg": "d98dc2f9f42ff601d50554564fe549ac1ee2f1f6",
  "1f3e0.svg": "0692739d5a936a061d3b60caadd7e3b536919ce5",
  "1f35e.svg": "7d2af4e751c661b9c7172295827f93a44cfe1bdf",
};

function gitBlobSha(bytes: Buffer) {
  const header = Buffer.from(`blob ${bytes.length}\0`);
  return createHash("sha1").update(header).update(bytes).digest("hex");
}

describe("bundled Twemoji provenance", () => {
  for (const [filename, expectedSha] of Object.entries(EXPECTED_BLOBS)) {
    it(`${filename} matches the verified upstream blob`, async () => {
      const bytes = await readFile(resolve("apps/web/public/content/emoji/twemoji", filename));
      expect(gitBlobSha(bytes)).toBe(expectedSha);
    });
  }
});
