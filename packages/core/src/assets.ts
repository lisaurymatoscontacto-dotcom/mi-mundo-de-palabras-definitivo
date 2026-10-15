export type AssetType = "emoji" | "photo" | "custom" | "missing";
export type AssetReviewStatus = "approved" | "pending_review" | "rejected" | "missing";
export type AssetLicenseId =
  | "CC-BY-4.0"
  | "CC0-1.0"
  | "PUBLIC-DOMAIN"
  | "OWNED"
  | "UNKNOWN";

export interface AssetRecord {
  id: string;
  word: string;
  normalized_word: string;
  category: string;
  world: string;
  /** Null only while a newly queued concept has not yet been enriched by the lexicon pipeline. */
  difficulty: number | null;
  asset_type: AssetType;
  asset_path: string | null;
  source: string | null;
  source_url: string | null;
  download_url?: string | null;
  author: string | null;
  license: AssetLicenseId;
  attribution_required: boolean;
  attribution_text: string | null;
  verified: boolean;
  downloaded_at: string | null;
  review_status: AssetReviewStatus;
  emoji_unicode?: string | null;
  thumbnail_path?: string | null;
  notes?: string[];
}

export interface AssetCatalogDocument {
  schema_version: 1;
  generated_at?: string;
  assets: AssetRecord[];
}

export const REDISTRIBUTABLE_PHOTO_LICENSES = new Set<AssetLicenseId>([
  "CC0-1.0",
  "PUBLIC-DOMAIN",
]);

export function isRedistributablePhotoLicense(license: AssetLicenseId) {
  return REDISTRIBUTABLE_PHOTO_LICENSES.has(license);
}

export function validateAssetRecord(asset: AssetRecord): string[] {
  const errors: string[] = [];
  const prefix = asset.id ? `${asset.id}: ` : "";

  if (!asset.id.trim()) errors.push("asset is missing id");
  if (!asset.word.trim()) errors.push(`${prefix}word is required`);
  if (!asset.normalized_word.trim()) errors.push(`${prefix}normalized_word is required`);
  if (!asset.category.trim()) errors.push(`${prefix}category is required`);
  if (!asset.world.trim()) errors.push(`${prefix}world is required`);
  if (asset.difficulty !== null && (!Number.isFinite(asset.difficulty) || asset.difficulty < 1)) {
    errors.push(`${prefix}difficulty must be null or >= 1`);
  }

  if (asset.asset_type === "missing") {
    if (asset.review_status !== "missing") errors.push(`${prefix}missing asset must use review_status=missing`);
    if (asset.asset_path) errors.push(`${prefix}missing asset cannot have asset_path`);
    return errors;
  }

  if (!asset.asset_path?.trim()) errors.push(`${prefix}asset_path is required`);
  if (!asset.source?.trim()) errors.push(`${prefix}source is required`);
  if (!asset.source_url?.trim()) errors.push(`${prefix}source_url is required`);
  if (!asset.author?.trim()) errors.push(`${prefix}author is required`);
  if (asset.license === "UNKNOWN") errors.push(`${prefix}license cannot be UNKNOWN for a usable asset`);
  if (asset.attribution_required && !asset.attribution_text?.trim()) {
    errors.push(`${prefix}attribution_text is required when attribution_required=true`);
  }

  if (asset.asset_type === "photo" && !isRedistributablePhotoLicense(asset.license)) {
    errors.push(`${prefix}photo must be CC0-1.0 or PUBLIC-DOMAIN`);
  }

  if (asset.review_status === "approved") {
    if (asset.difficulty === null) errors.push(`${prefix}approved asset must have difficulty`);
    if (!asset.verified) errors.push(`${prefix}approved asset must be verified`);
    if (!asset.downloaded_at) errors.push(`${prefix}approved asset must have downloaded_at`);
    if (/^https?:\/\//i.test(asset.asset_path ?? "")) {
      errors.push(`${prefix}approved asset_path must be local for offline use`);
    }
  }

  return errors;
}

export function validateAssetCatalog(document: AssetCatalogDocument) {
  const errors: string[] = [];
  if (document.schema_version !== 1) errors.push("asset catalog schema_version must be 1");
  const ids = new Set<string>();
  for (const asset of document.assets) {
    if (ids.has(asset.id)) errors.push(`duplicate asset id: ${asset.id}`);
    ids.add(asset.id);
    errors.push(...validateAssetRecord(asset));
  }
  return { valid: errors.length === 0, errors };
}

export function canPublishAsset(asset: AssetRecord) {
  return validateAssetRecord(asset).length === 0 && asset.review_status === "approved";
}
