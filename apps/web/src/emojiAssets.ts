const BUNDLED_EMOJI_BY_UNICODE: Readonly<Record<string, string>> = {
  "🐱": "/content/emoji/twemoji/1f431.svg",
  "🦆": "/content/emoji/twemoji/1f986.svg",
  "🐄": "/content/emoji/twemoji/1f404.svg",
  "🌙": "/content/emoji/twemoji/1f319.svg",
  "🏠": "/content/emoji/twemoji/1f3e0.svg",
  "🍞": "/content/emoji/twemoji/1f35e.svg",
};

export function bundledEmojiUrl(unicode: string) {
  return BUNDLED_EMOJI_BY_UNICODE[unicode];
}

export function bundledEmojiUrls() {
  return [...new Set(Object.values(BUNDLED_EMOJI_BY_UNICODE))];
}
