import { readFile, writeFile } from "node:fs/promises";

const path = "scripts/materialize-reviewed-curriculum-block.ts";
let source = await readFile(path, "utf8");

function replaceOnce(before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one target occurrence, found ${count}`);
  source = source.replace(before, after);
}

replaceOnce(
  `import { validateAssetCatalog, type AssetCatalogDocument, type AssetRecord } from "../packages/core/src/assets";`,
  `import {\n  canPublishAsset,\n  validateAssetCatalog,\n  type AssetCatalogDocument,\n  type AssetLicenseId,\n  type AssetRecord,\n} from "../packages/core/src/assets";`,
  "asset imports",
);

replaceOnce(
  `function requireReviewedEmojiCard(byKey: Map<string, WordCard>, category: string, word: string) {\n  const card = byKey.get(cardKey(category, word));\n  if (!card) {\n    throw new Error(\`${"${category} / ${word}: no explicitly curated transition card exists. Add and review the card before materializing the chapter."}\`);\n  }\n  if (card.visualKind !== "emoji" || card.visualLicense !== "unicode-emoji") {\n    throw new Error(\`${"${category} / ${word}: generic block materializer only handles explicitly reviewed emoji cards. Use the photo/custom review pipeline instead."}\`);\n  }\n  if (!card.visual.trim()) throw new Error(\`${"${category} / ${word}: reviewed emoji card has no visual."}\`);\n  return card;\n}`,
  `function requireReviewedCard(byKey: Map<string, WordCard>, category: string, word: string) {\n  const card = byKey.get(cardKey(category, word));\n  if (!card) {\n    throw new Error(\`${"${category} / ${word}: no explicitly curated transition card exists. Add and review the card before materializing the chapter."}\`);\n  }\n\n  if (card.visualKind === "emoji") {\n    if (card.visualLicense !== "unicode-emoji") {\n      throw new Error(\`${"${category} / ${word}: reviewed emoji card must use visualLicense=unicode-emoji before Twemoji materialization."}\`);\n    }\n    if (!card.visual.trim()) throw new Error(\`${"${category} / ${word}: reviewed emoji card has no visual."}\`);\n    return card;\n  }\n\n  if (card.visualKind === "photo") {\n    if (card.visualLicense !== "cc0-1.0" && card.visualLicense !== "public-domain") {\n      throw new Error(\`${"${category} / ${word}: reviewed photo card must be CC0 or Public Domain."}\`);\n    }\n    if (!card.visualSourceUrl?.trim()) {\n      throw new Error(\`${"${category} / ${word}: reviewed photo card requires visualSourceUrl provenance."}\`);\n    }\n    return card;\n  }\n\n  throw new Error(\`${"${category} / ${word}: reusable publisher supports reviewed emoji cards and already-approved photo cards only."}\`);\n}\n\nfunction expectedPhotoLicense(card: WordCard): AssetLicenseId {\n  if (card.visualLicense === "cc0-1.0") return "CC0-1.0";\n  if (card.visualLicense === "public-domain") return "PUBLIC-DOMAIN";\n  throw new Error(\`${"${card.category} / ${card.word}: unsupported photo license ${String(card.visualLicense)}."}\`);\n}\n\nfunction requireApprovedPhotoAsset(card: WordCard, asset: AssetRecord | undefined) {\n  const id = \`${"${contentSlug(card.category)}.${contentSlug(card.word)}"}\`;\n  if (!asset) {\n    throw new Error(\`${"${id}: reviewed photo card has no catalog record. Stage, inspect and explicitly approve the photo before publishing this chapter."}\`);\n  }\n  if (asset.word !== card.word || asset.category !== card.category) {\n    throw new Error(\`${"${id}: approved catalog record conflicts with reviewed photo card."}\`);\n  }\n  if (asset.asset_type !== "photo") {\n    throw new Error(\`${"${id}: reviewed photo card requires asset_type=photo, received ${asset.asset_type}."}\`);\n  }\n  if (!canPublishAsset(asset)) {\n    throw new Error(\`${"${id}: photo is not publishable. It must pass metadata validation and explicit review_status=approved."}\`);\n  }\n  if (asset.license !== expectedPhotoLicense(card)) {\n    throw new Error(\`${"${id}: photo license ${asset.license} does not match reviewed card license ${card.visualLicense}."}\`);\n  }\n  if (asset.source_url !== card.visualSourceUrl) {\n    throw new Error(\`${"${id}: photo provenance differs from the reviewed card visualSourceUrl."}\`);\n  }\n  if (!asset.thumbnail_path?.trim()) {\n    throw new Error(\`${"${id}: approved curriculum photo requires a local thumbnail_path."}\`);\n  }\n  if (/^https?:\\/\\//i.test(asset.thumbnail_path)) {\n    throw new Error(\`${"${id}: approved curriculum photo thumbnail must be local for offline use."}\`);\n  }\n  return asset;\n}`,
  "reviewed card guard",
);

replaceOnce(
  `chapter.newWords.map((word) => requireReviewedEmojiCard(cardMap, chapter.category, word)),`,
  `chapter.newWords.map((word) => requireReviewedCard(cardMap, chapter.category, word)),`,
  "reviewed card mapping",
);

replaceOnce(
  `  const now = new Date().toISOString();\n\n  for (const card of reviewedCards) {`,
  `  const now = new Date().toISOString();\n  let verifiedPhotos = 0;\n\n  for (const card of reviewedCards) {`,
  "photo counter",
);

replaceOnce(
  `    const existing = byId.get(id);\n    if (existing?.review_status === "approved") {`,
  `    const existing = byId.get(id);\n\n    if (card.visualKind === "photo") {\n      const photo = requireApprovedPhotoAsset(card, existing);\n      verifiedPhotos += 1;\n      console.log(\`Verified approved photo: ${"${id} -> ${photo.asset_path}"}\`);\n      continue;\n    }\n\n    if (existing?.review_status === "approved") {`,
  "photo publication branch",
);

replaceOnce(
  `      if (existing.word !== card.word || existing.category !== card.category) {\n        throw new Error(\`${"${id}: approved catalog record conflicts with reviewed transition card."}\`);\n      }\n      console.log(\`Already approved: ${"${id}"}\`);`,
  `      if (existing.word !== card.word || existing.category !== card.category) {\n        throw new Error(\`${"${id}: approved catalog record conflicts with reviewed transition card."}\`);\n      }\n      if (existing.asset_type !== "emoji" || !canPublishAsset(existing)) {\n        throw new Error(\`${"${id}: reviewed emoji card conflicts with a non-publishable or non-emoji approved record."}\`);\n      }\n      console.log(\`Already approved: ${"${id}"}\`);`,
  "approved emoji guard",
);

replaceOnce(
  `  console.log(\`Reviewed block materialized: chapters ${"${start}-${start + count - 1}, ${reviewedCards.length} new card placements, ${downloaded.size} newly fetched Twemoji files."}\`);`,
  `  console.log(\`Reviewed block materialized: chapters ${"${start}-${start + count - 1}, ${reviewedCards.length} new card placements, ${downloaded.size} newly fetched Twemoji files, ${verifiedPhotos} pre-approved photos verified."}\`);`,
  "completion log",
);

await writeFile(path, source, "utf8");
console.log("Reusable curriculum publisher upgraded for pre-approved CC0/Public Domain photos.");
