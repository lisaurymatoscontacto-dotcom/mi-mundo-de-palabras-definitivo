import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const REVIEW_PATH = resolve("content/asset-reviews/ocean-chapter-four.json");
const PUBLIC_ROOT = resolve("apps/web/public/content");
const OUTPUT = resolve("content/asset-reviews/ocean-chapter-four-contact.webp");
const COLS = 4;
const CELL_W = 300;
const CELL_H = 235;

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[char] ?? char));
}

async function main() {
  const review = JSON.parse(await readFile(REVIEW_PATH, "utf8")) as {
    assets: Array<{ word: string; thumbnail_path: string; selected_title: string }>;
  };
  if (review.assets.length !== 16) throw new Error(`Expected 16 review assets, received ${review.assets.length}`);

  const composites: sharp.OverlayOptions[] = [];
  for (let index = 0; index < review.assets.length; index += 1) {
    const asset = review.assets[index];
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    const x = col * CELL_W;
    const y = row * CELL_H;
    const thumb = await sharp(resolve(PUBLIC_ROOT, asset.thumbnail_path))
      .resize({ width: 260, height: 175, fit: "contain", background: "white" })
      .png()
      .toBuffer();
    composites.push({ input: thumb, left: x + 20, top: y + 10 });

    const title = asset.selected_title.replace(/^File:/, "").slice(0, 42);
    const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="48">
      <rect width="280" height="48" fill="white"/>
      <text x="140" y="19" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="black">${escapeXml(asset.word)}</text>
      <text x="140" y="38" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="black">${escapeXml(title)}</text>
    </svg>`);
    composites.push({ input: label, left: x + 10, top: y + 184 });
  }

  await sharp({
    create: {
      width: COLS * CELL_W,
      height: 4 * CELL_H,
      channels: 3,
      background: "white",
    },
  })
    .composite(composites)
    .webp({ quality: 88 })
    .toFile(OUTPUT);
  console.log(`Ocean review contact sheet created: ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
