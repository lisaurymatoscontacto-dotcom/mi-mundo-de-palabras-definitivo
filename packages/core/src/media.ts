export type VisualKind = "emoji" | "photo" | "image";

/**
 * Licenses accepted by the runtime. Automatic photo sourcing remains stricter
 * than general free-media sourcing: photos are limited to Public Domain / CC0.
 * Bundled emoji artwork can carry CC-BY metadata (Twemoji), while a raw Unicode
 * character can still use the unicode-emoji marker.
 */
export type VisualLicense =
  | "unicode-emoji"
  | "cc-by-4.0"
  | "public-domain"
  | "cc0-1.0"
  | "legacy-owned";

export interface VisualMetadata {
  kind: VisualKind;
  license: VisualLicense;
  sourceUrl?: string;
  attribution?: string;
}

export const ZERO_OBLIGATION_PHOTO_LICENSES = new Set<VisualLicense>([
  "public-domain",
  "cc0-1.0",
]);

export function isZeroObligationPhotoLicense(license: VisualLicense | undefined) {
  return license !== undefined && ZERO_OBLIGATION_PHOTO_LICENSES.has(license);
}

export function validateVisualMetadata(metadata: VisualMetadata, value: string): string[] {
  const errors: string[] = [];
  if (!value.trim()) errors.push("visual value is empty");

  if (metadata.kind === "emoji") {
    if (metadata.license !== "unicode-emoji" && metadata.license !== "cc-by-4.0") {
      errors.push("emoji visual must use unicode-emoji or cc-by-4.0 license marker");
    }
    if (metadata.license === "cc-by-4.0" && !metadata.sourceUrl?.trim()) {
      errors.push("CC-BY emoji artwork requires a source URL for provenance");
    }
    return errors;
  }

  if (metadata.kind === "photo") {
    if (!isZeroObligationPhotoLicense(metadata.license)) {
      errors.push("photo must be public-domain or CC0");
    }
    if (!metadata.sourceUrl?.trim()) {
      errors.push("photo requires a source URL for provenance");
    }
  }

  return errors;
}
