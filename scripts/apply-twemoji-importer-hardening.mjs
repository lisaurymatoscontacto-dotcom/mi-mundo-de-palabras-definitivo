import { readFile, writeFile } from "node:fs/promises";

const path = "scripts/import-assets.ts";
let source = await readFile(path, "utf8");

function replaceOnce(label, before, after) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Importer hardening anchor not found: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Importer hardening anchor not unique: ${label}`);
  source = source.slice(0, first) + after + source.slice(first + before.length);
}

replaceOnce(
  "twemoji helper import",
  'import { CANDIDATE_WORDS } from "../packages/core/src/candidate.words";\n',
  'import { CANDIDATE_WORDS } from "../packages/core/src/candidate.words";\nimport { twemojiCodepointCandidates } from "../packages/core/src/twemoji";\n',
);

replaceOnce(
  "legacy codepoint helper",
`function emojiCodepoints(emoji: string) {
  return [...emoji]
    .map((char) => char.codePointAt(0)!)
    .filter((codepoint) => codepoint !== 0xfe0f)
    .map((codepoint) => codepoint.toString(16))
    .join("-");
}
`,
  "",
);

replaceOnce(
  "single-filename materializer",
`async function materializeEmoji(asset: AssetRecord) {
  const unicode = asset.emoji_unicode ?? automaticEmojiForWord(asset.word);
  if (!unicode) return false;
  const codepoints = emojiCodepoints(unicode);
  const relativePath = \`emoji/twemoji/\${codepoints}.svg\`;
  const target = resolve(PUBLIC_ROOT, relativePath);
  const downloadUrl = \`\${TWEMOJI_BASE}/\${codepoints}.svg\`;
  const response = await fetchWithRetry(downloadUrl, {}, \`Twemoji download for \${asset.word}\`);
  if (!response.ok) throw new Error(\`Twemoji download failed (\${response.status}) for \${asset.word}\`);
  const svg = await response.text();
  if (!/^\\s*<svg\\b/i.test(svg)) throw new Error(\`Twemoji response was not SVG for \${asset.word}\`);

  if (!dryRun) {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, svg, "utf8");
  }

  asset.asset_type = "emoji";
  asset.asset_path = relativePath;
  asset.source = "Twemoji";
  asset.source_url = \`\${TWEMOJI_SOURCE}/blob/\${TWEMOJI_REF}/assets/svg/\${codepoints}.svg\`;
  asset.download_url = downloadUrl;
  asset.author = "Twemoji contributors";
  asset.license = "CC-BY-4.0";
  asset.attribution_required = true;
  asset.attribution_text = "Twemoji graphics © Twitter, Inc. and other contributors, licensed CC-BY 4.0.";
  asset.verified = true;
  asset.downloaded_at = new Date().toISOString();
  asset.review_status = "pending_review";
  asset.emoji_unicode = unicode;
  asset.thumbnail_path = null;
  asset.notes = [...new Set([...(asset.notes ?? []), "Materialized automatically; pedagogical approval still required."])];
  return true;
}
`,
`async function materializeEmoji(asset: AssetRecord) {
  const unicode = asset.emoji_unicode ?? automaticEmojiForWord(asset.word);
  if (!unicode) return false;

  let resolved: { codepoints: string; relativePath: string; downloadUrl: string; svg: string } | null = null;
  const attempted: string[] = [];
  for (const codepoints of twemojiCodepointCandidates(unicode)) {
    const relativePath = \`emoji/twemoji/\${codepoints}.svg\`;
    const downloadUrl = \`\${TWEMOJI_BASE}/\${codepoints}.svg\`;
    attempted.push(codepoints);
    const response = await fetchWithRetry(downloadUrl, {}, \`Twemoji download for \${asset.word}\`);
    if (response.status === 404) continue;
    if (!response.ok) throw new Error(\`Twemoji download failed (\${response.status}) for \${asset.word}\`);
    const svg = await response.text();
    if (!/^\\s*<svg\\b/i.test(svg)) throw new Error(\`Twemoji response was not SVG for \${asset.word}\`);
    resolved = { codepoints, relativePath, downloadUrl, svg };
    break;
  }
  if (!resolved) throw new Error(\`Twemoji asset not found for \${asset.word}; tried \${attempted.join(", ")}\`);

  if (!dryRun) {
    const target = resolve(PUBLIC_ROOT, resolved.relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, resolved.svg, "utf8");
  }

  asset.asset_type = "emoji";
  asset.asset_path = resolved.relativePath;
  asset.source = "Twemoji";
  asset.source_url = \`\${TWEMOJI_SOURCE}/blob/\${TWEMOJI_REF}/assets/svg/\${resolved.codepoints}.svg\`;
  asset.download_url = resolved.downloadUrl;
  asset.author = "Twemoji contributors";
  asset.license = "CC-BY-4.0";
  asset.attribution_required = true;
  asset.attribution_text = "Twemoji graphics © Twitter, Inc. and other contributors, licensed CC-BY 4.0.";
  asset.verified = true;
  asset.downloaded_at = new Date().toISOString();
  asset.review_status = "pending_review";
  asset.emoji_unicode = unicode;
  asset.thumbnail_path = null;
  asset.notes = [...new Set([...(asset.notes ?? []), "Materialized automatically; pedagogical approval still required."])];
  return true;
}
`,
);

await writeFile(path, source, "utf8");
console.log("Twemoji importer hardening applied successfully.");
