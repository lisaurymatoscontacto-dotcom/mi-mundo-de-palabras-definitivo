import { automaticEmojiForWord, contentSlug } from "./asset-production";
import type { AssetRecord } from "./assets";
import { worldForCategory } from "./worlds";

export interface AssetQueueOptions {
  limit?: number;
  selectedIds?: ReadonlySet<string>;
}

export function normalizeAssetWord(word: string) {
  return word
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

export function candidateAssetId(category: string, word: string) {
  return `${contentSlug(category)}.${contentSlug(word)}`;
}

export function createQueuedAssetRecord(category: string, word: string): AssetRecord {
  const world = worldForCategory(category);
  if (!world) throw new Error(`No learning world configured for category: ${category}`);
  const emojiCandidate = automaticEmojiForWord(word);

  return {
    id: candidateAssetId(category, word),
    word,
    normalized_word: normalizeAssetWord(word),
    category,
    world: world.id,
    difficulty: null,
    asset_type: "missing",
    asset_path: null,
    source: null,
    source_url: null,
    download_url: null,
    author: null,
    license: "UNKNOWN",
    attribution_required: false,
    attribution_text: null,
    verified: false,
    downloaded_at: null,
    review_status: "missing",
    emoji_unicode: emojiCandidate ?? null,
    thumbnail_path: null,
    notes: [
      emojiCandidate
        ? `Emoji automático conservador sugerido: ${emojiCandidate}; requiere materialización y revisión.`
        : "Sin emoji automático seguro; buscar foto CC0/Dominio Público o resolver manualmente.",
      "Dificultad pendiente de sincronizar desde el lexicón enriquecido.",
    ],
  };
}

export function enqueueMissingAssetRecords(
  categories: Record<string, string[]>,
  existing: readonly AssetRecord[],
  options: AssetQueueOptions = {},
) {
  const limit = Math.max(0, Math.floor(options.limit ?? 25));
  const existingIds = new Set(existing.map((asset) => asset.id));
  const queued: AssetRecord[] = [];

  for (const [category, words] of Object.entries(categories)) {
    for (const word of words) {
      if (queued.length >= limit) return queued;
      const id = candidateAssetId(category, word);
      if (existingIds.has(id)) continue;
      if (options.selectedIds?.size && !options.selectedIds.has(id)) continue;
      queued.push(createQueuedAssetRecord(category, word));
      existingIds.add(id);
    }
  }

  return queued;
}
