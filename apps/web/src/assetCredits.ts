import type { AssetCatalogDocument, AssetRecord } from "@mmdp/core/assets";

export interface AssetCredit {
  key: string;
  text: string;
  sourceUrl?: string;
}

export function collectAssetCredits(assets: AssetRecord[]): AssetCredit[] {
  const seen = new Set<string>();
  const credits: AssetCredit[] = [];

  for (const asset of assets) {
    if (asset.review_status !== "approved" || !asset.attribution_required || !asset.attribution_text?.trim()) continue;
    const text = asset.attribution_text.trim();
    if (seen.has(text)) continue;
    seen.add(text);
    credits.push({ key: text, text, sourceUrl: asset.source_url ?? undefined });
  }

  return credits.sort((a, b) => a.text.localeCompare(b.text, "es"));
}

export async function loadAssetCredits(): Promise<AssetCredit[]> {
  const response = await fetch("/content/assets.catalog.json", { cache: "no-cache" });
  if (!response.ok) return [];
  const document = await response.json() as AssetCatalogDocument;
  if (document.schema_version !== 1 || !Array.isArray(document.assets)) return [];
  return collectAssetCredits(document.assets);
}
