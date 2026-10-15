import type { WordCard } from "@mmdp/core";
import { bundledEmojiUrl } from "./emojiAssets";

const MEDIA_CACHE = "mmdp-card-media-v3";

function emojiMediaUrl(card: WordCard) {
  if (card.visualKind !== "emoji") return undefined;
  if (/^\/(?!\/)/.test(card.visual) || /\.svg(?:[?#].*)?$/i.test(card.visual)) return card.visual;
  return bundledEmojiUrl(card.visual);
}

export function cardMediaUrls(cards: WordCard[]) {
  return [...new Set(cards.flatMap((card) => {
    const urls: string[] = [];
    if ((card.visualKind === "image" || card.visualKind === "photo") && card.visual) urls.push(card.visual);
    const emojiUrl = emojiMediaUrl(card);
    if (emojiUrl) urls.push(emojiUrl);
    if (card.audioUrl) urls.push(card.audioUrl);
    return urls;
  }))];
}

export async function prefetchCardMedia(cards: WordCard[]) {
  const urls = cardMediaUrls(cards);
  if (!urls.length || !("caches" in window)) return { requested: urls.length, cached: 0 };

  const cache = await caches.open(MEDIA_CACHE);
  let cached = 0;

  await Promise.all(urls.map(async (url) => {
    try {
      const existing = await cache.match(url);
      if (existing) {
        cached += 1;
        return;
      }
      const response = await fetch(url, { credentials: "same-origin" });
      if (!response.ok) return;
      await cache.put(url, response.clone());
      cached += 1;
    } catch {
      // Offline or unavailable media must never block a learning session.
    }
  }));

  return { requested: urls.length, cached };
}

export async function clearOfflineCardMedia() {
  if (!("caches" in window)) return false;
  return caches.delete(MEDIA_CACHE);
}
