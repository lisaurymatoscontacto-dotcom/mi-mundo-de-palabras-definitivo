import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";
import { normalizeAssetWord } from "../packages/core/src/asset-queue";
import { contentSlug } from "../packages/core/src/asset-production";
import { validateAssetCatalog, type AssetCatalogDocument, type AssetRecord, type AssetLicenseId } from "../packages/core/src/assets";
import { worldForCategory } from "../packages/core/src/worlds";

const CATALOG_PATH = resolve("content/assets.catalog.json");
const REVIEW_PATH = resolve("content/asset-reviews/ocean-chapter-four.json");
const CONTACT_PATH = resolve("content/asset-reviews/ocean-chapter-four-contact.webp");
const PUBLIC_ROOT = resolve("apps/web/public/content");
const USER_AGENT = "MiMundoDePalabras/0.1 (https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo)";

const replacements = [
  {
    oldId: "oceano.caballitodemar",
    word: "MANATÍ",
    query: "Trichechus manatus USFWS underwater manatee",
    title: "File:Close up image of manatee underwater.jpg",
  },
  {
    oldId: "oceano.raya",
    word: "CACHALOTE",
    query: "Physeter macrocephalus NOAA aerial sperm whale",
    title: "File:Sperm whale Tim Cole NMFS crop (cropped).jpg",
  },
  {
    oldId: "oceano.anguila",
    word: "BARRACUDA",
    query: "Sphyraena barracuda NOAA photograph",
    title: "File:Sphyraena barracuda by NOAA.jpg",
  },
  {
    oldId: "oceano.atun",
    word: "ALBATROS",
    query: "albatross USFWS photograph",
    title: "File:Short tailed albatross.jpg",
  },
  {
    oldId: "oceano.pezespada",
    word: "GAVIOTA",
    query: "gull USFWS photograph",
    title: "File:Larus hyperboreus-USFWS.jpg",
  },
  {
    oldId: "oceano.almeja",
    word: "FRAILECILLO",
    query: "Fratercula puffin USFWS photograph",
    title: "File:Fratercula corniculataUSFWSSL0002774.jpg",
  },
  {
    oldId: "oceano.anemona",
    word: "MORENA",
    query: "Gymnothorax moray eel NOAA photograph",
    title: "File:Gymnothorax eurostus.jpg",
  },
] as const;

interface ReviewAsset {
  id: string;
  word: string;
  query: string;
  selected_title: string;
  source_url: string;
  download_url: string;
  author: string;
  license: AssetLicenseId;
  asset_path: string;
  thumbnail_path: string;
  source_sha256: string;
  asset_sha256: string;
  thumbnail_sha256: string;
  visual_review: "pending" | "approved" | "rejected";
}

interface ReviewDocument {
  generated_at: string;
  status: string;
  assets: ReviewAsset[];
}

function hash(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function stripHtml(value: string | undefined) {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchRetry(url: string, attempts = 5) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (response.ok) return response;
      if (response.status !== 429 && response.status < 500) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      lastError = new Error(`HTTP ${response.status} for ${url}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1200 * attempt));
  }
  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch ${url}`);
}

function licenseFromMetadata(metadata: Record<string, { value?: string }>): AssetLicenseId {
  const raw = `${metadata.LicenseShortName?.value ?? ""} ${metadata.UsageTerms?.value ?? ""}`.toLowerCase();
  if (raw.includes("cc0") || raw.includes("creative commons zero")) return "CC0-1.0";
  if (raw.includes("public domain")) return "PUBLIC-DOMAIN";
  throw new Error(`Source is not explicitly CC0/Public Domain: ${raw || "missing license metadata"}`);
}

async function fetchCommonsFile(title: string) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1920",
    titles: title,
    origin: "*",
  });
  const response = await fetchRetry(`https://commons.wikimedia.org/w/api.php?${params}`);
  const payload = await response.json() as {
    query?: { pages?: Record<string, { missing?: string; imageinfo?: Array<{ url: string; thumburl?: string; extmetadata?: Record<string, { value?: string }> }> }> };
  };
  const page = Object.values(payload.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!page || page.missing !== undefined || !info) throw new Error(`${title}: Wikimedia file not found`);
  const metadata = info.extmetadata ?? {};
  const license = licenseFromMetadata(metadata);
  const author = stripHtml(metadata.Artist?.value) || "Wikimedia Commons contributor";
  const downloadUrl = info.thumburl ?? info.url;
  const sourceUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  return { downloadUrl, sourceUrl, author, license };
}

async function removeOldFiles(catalog: AssetCatalogDocument, ids: Set<string>) {
  for (const asset of catalog.assets) {
    if (!ids.has(asset.id)) continue;
    for (const relative of [asset.asset_path, asset.thumbnail_path]) {
      if (!relative) continue;
      await rm(resolve(PUBLIC_ROOT, relative), { force: true });
    }
  }
}

async function materializePhoto(word: string, title: string) {
  const source = await fetchCommonsFile(title);
  const response = await fetchRetry(source.downloadUrl);
  const sourceBuffer = Buffer.from(await response.arrayBuffer());
  const slug = contentSlug(word);
  const assetPath = `photos/oceano/${slug}.webp`;
  const thumbnailPath = `photos/oceano/${slug}.thumb.webp`;
  const assetBuffer = await sharp(sourceBuffer)
    .rotate()
    .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const thumbBuffer = await sharp(assetBuffer)
    .resize({ width: 320, height: 320, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 76 })
    .toBuffer();
  for (const [relative, buffer] of [[assetPath, assetBuffer], [thumbnailPath, thumbBuffer]] as const) {
    const target = resolve(PUBLIC_ROOT, relative);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, buffer);
  }
  return {
    ...source,
    assetPath,
    thumbnailPath,
    sourceSha256: hash(sourceBuffer),
    assetSha256: hash(assetBuffer),
    thumbnailSha256: hash(thumbBuffer),
  };
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[char] ?? char));
}

async function rebuildContactSheet(review: ReviewDocument) {
  if (review.assets.length !== 16) throw new Error(`Expected 16 ocean review assets, got ${review.assets.length}`);
  const cellW = 300;
  const cellH = 235;
  const overlays: sharp.OverlayOptions[] = [];
  for (let index = 0; index < review.assets.length; index += 1) {
    const asset = review.assets[index];
    const x = (index % 4) * cellW;
    const y = Math.floor(index / 4) * cellH;
    const thumb = await sharp(resolve(PUBLIC_ROOT, asset.thumbnail_path))
      .resize({ width: 260, height: 175, fit: "contain", background: "white" })
      .png()
      .toBuffer();
    overlays.push({ input: thumb, left: x + 20, top: y + 10 });
    const title = asset.selected_title.replace(/^File:/, "").slice(0, 42);
    const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="48">
      <rect width="280" height="48" fill="white"/>
      <text x="140" y="19" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="black">${escapeXml(asset.word)}</text>
      <text x="140" y="38" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="black">${escapeXml(title)}</text>
    </svg>`);
    overlays.push({ input: label, left: x + 10, top: y + 184 });
  }
  await sharp({ create: { width: 1200, height: 940, channels: 3, background: "white" } })
    .composite(overlays)
    .webp({ quality: 88 })
    .toFile(CONTACT_PATH);
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as AssetCatalogDocument;
  const review = JSON.parse(await readFile(REVIEW_PATH, "utf8")) as ReviewDocument;
  const initial = validateAssetCatalog(catalog);
  if (!initial.valid) throw new Error(`Invalid starting catalog:\n${initial.errors.join("\n")}`);

  const oldIds = new Set(replacements.map((item) => item.oldId));
  await removeOldFiles(catalog, oldIds);
  catalog.assets = catalog.assets.filter((asset) => !oldIds.has(asset.id));
  review.assets = review.assets.filter((asset) => !oldIds.has(asset.id));

  const world = worldForCategory("Océano");
  if (!world) throw new Error("Ocean world is not configured");
  const now = new Date().toISOString();

  for (const item of replacements) {
    const photo = await materializePhoto(item.word, item.title);
    const id = `oceano.${contentSlug(item.word)}`;
    if (catalog.assets.some((asset) => asset.id === id)) throw new Error(`${id}: replacement would duplicate an existing catalog asset`);
    if (review.assets.some((asset) => asset.id === id)) throw new Error(`${id}: replacement would duplicate a review candidate`);
    const label = photo.license === "CC0-1.0" ? "CC0 1.0" : "Public Domain";
    const record: AssetRecord = {
      id,
      word: item.word,
      normalized_word: normalizeAssetWord(item.word),
      category: "Océano",
      world: world.id,
      difficulty: 3,
      asset_type: "photo",
      asset_path: photo.assetPath,
      source: "Wikimedia Commons",
      source_url: photo.sourceUrl,
      download_url: photo.downloadUrl,
      author: photo.author,
      license: photo.license,
      attribution_required: false,
      attribution_text: `${photo.author} · Wikimedia Commons · ${label}`,
      verified: true,
      downloaded_at: now,
      review_status: "pending_review",
      emoji_unicode: null,
      thumbnail_path: photo.thumbnailPath,
      notes: [
        "Ocean chapter-four replacement staging: exact photo source and zero-obligation license verified; visual approval remains separate.",
        `Curated source: ${item.title}`,
      ],
    };
    catalog.assets.push(record);
    review.assets.push({
      id,
      word: item.word,
      query: item.query,
      selected_title: item.title,
      source_url: photo.sourceUrl,
      download_url: photo.downloadUrl,
      author: photo.author,
      license: photo.license,
      asset_path: photo.assetPath,
      thumbnail_path: photo.thumbnailPath,
      source_sha256: photo.sourceSha256,
      asset_sha256: photo.assetSha256,
      thumbnail_sha256: photo.thumbnailSha256,
      visual_review: "pending",
    });
    console.log(`Staged replacement: ${item.oldId} -> ${id} (${item.title})`);
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1200));
  }

  const expected = [
    "ORCA", "NARVAL", "MORSA", "MANTA", "PEZPAYASO", "BELUGA", "ESTRELLA", "ERIZODEMAR", "PELICANO",
    "MANATÍ", "CACHALOTE", "BARRACUDA", "ALBATROS", "GAVIOTA", "FRAILECILLO", "MORENA",
  ];
  const present = new Set(review.assets.map((asset) => asset.word));
  for (const word of expected) if (!present.has(word)) throw new Error(`Final review batch is missing ${word}`);
  if (review.assets.length !== expected.length) throw new Error(`Final review batch must contain exactly 16 assets; got ${review.assets.length}`);
  if (review.assets.some((asset) => asset.visual_review !== "pending")) throw new Error("Replacement workflow must not approve photos");

  catalog.generated_at = now;
  review.generated_at = now;
  review.status = "pending_visual_review";
  const finalValidation = validateAssetCatalog(catalog);
  if (!finalValidation.valid) throw new Error(`Replacement batch produced invalid catalog:\n${finalValidation.errors.join("\n")}`);
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await writeFile(REVIEW_PATH, `${JSON.stringify(review, null, 2)}\n`, "utf8");
  await rebuildContactSheet(review);
  console.log("Ocean chapter-four review batch refined to 16 legal photo candidates; all remain pending visual approval.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
