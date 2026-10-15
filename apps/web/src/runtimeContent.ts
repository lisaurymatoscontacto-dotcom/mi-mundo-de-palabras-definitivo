import { DEMO_WORDS, type Region, type VisualLicense, type WordCard } from "@mmdp/core";
import { canPublishAsset, type AssetCatalogDocument, type AssetLicenseId, type AssetRecord } from "@mmdp/core/assets";
import { loadProductionCards } from "./contentCatalog";
import bundledAssetCatalog from "../../../content/assets.catalog.json";

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

function cardKey(card: Pick<WordCard, "category" | "word">) {
  return `${normalizeKey(card.category)}::${normalizeKey(card.word)}`;
}

function assetKey(asset: Pick<AssetRecord, "category" | "normalized_word">) {
  return `${normalizeKey(asset.category)}::${normalizeKey(asset.normalized_word)}`;
}

function runtimeLicense(license: AssetLicenseId): VisualLicense | undefined {
  if (license === "CC-BY-4.0") return "cc-by-4.0";
  if (license === "CC0-1.0") return "cc0-1.0";
  if (license === "PUBLIC-DOMAIN") return "public-domain";
  if (license === "OWNED") return "legacy-owned";
  return undefined;
}

function localContentUrl(path: string) {
  return `/content/${path.replace(/^\/+/, "")}`;
}

export function withoutRemoteVisualDependencies(cards: WordCard[]) {
  return cards.filter((card) => {
    if (card.visualKind !== "photo" && card.visualKind !== "image") return true;
    return !/^https?:\/\//i.test(card.visual);
  });
}

export function applyAssetCatalog(cards: WordCard[], document: AssetCatalogDocument): WordCard[] {
  if (document.schema_version !== 1 || !Array.isArray(document.assets)) return withoutRemoteVisualDependencies(cards);

  const assets = new Map(document.assets.map((asset) => [assetKey(asset), asset]));

  return cards.flatMap((card) => {
    const asset = assets.get(cardKey(card));
    if (!asset) return withoutRemoteVisualDependencies([card]);

    // Once a concept has entered the central asset catalog, that editorial state
    // becomes authoritative. Pending/rejected/missing media must not silently fall
    // back to an old demo visual that could be ambiguous or legally stale.
    if (!canPublishAsset(asset)) return [];

    const common = {
      ...card,
      visualSourceUrl: asset.source_url ?? undefined,
      visualAttribution: asset.attribution_text ?? undefined,
      visualLicense: runtimeLicense(asset.license),
    };

    if (asset.asset_type === "emoji") {
      if (!asset.asset_path) return [];
      return [{
        ...common,
        // The semantic Unicode value remains in asset metadata, but rendering uses
        // the reviewed bundled SVG path so the UI scales without a hardcoded map.
        visual: localContentUrl(asset.asset_path),
        visualKind: "emoji" as const,
      }];
    }

    if (asset.asset_type === "photo") {
      if (!asset.asset_path) return [];
      return [{
        ...common,
        visual: localContentUrl(asset.asset_path),
        visualKind: "photo" as const,
      }];
    }

    if (asset.asset_type === "custom") {
      if (!asset.asset_path) return [];
      return [{
        ...common,
        visual: localContentUrl(asset.asset_path),
        visualKind: "image" as const,
      }];
    }

    return [];
  });
}

export async function loadAssetCatalog(): Promise<AssetCatalogDocument | null> {
  try {
    const response = await fetch("/content/assets.catalog.json", { cache: "no-cache" });
    if (!response.ok) return null;
    const document = await response.json() as AssetCatalogDocument;
    if (document.schema_version !== 1 || !Array.isArray(document.assets)) return null;
    return document;
  } catch {
    return null;
  }
}

export async function loadRuntimeCards(region: Region): Promise<WordCard[]> {
  const production = await loadProductionCards(region);
  const baseCards = production.length ? production : DEMO_WORDS;
  // Keep reviewed local visuals available when the metadata request fails offline.
  const catalog = await loadAssetCatalog() ?? bundledAssetCatalog as AssetCatalogDocument;
  return applyAssetCatalog(baseCards, catalog);
}
