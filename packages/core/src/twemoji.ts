/**
 * Twemoji mostly stores emoji filenames without U+FE0F variation selectors, but
 * some ZWJ/gender sequences retain FE0F in the canonical SVG filename. Return
 * both spellings, stripped first for the common case and preserved as fallback.
 */
export function twemojiCodepointCandidates(emoji: string): string[] {
  const codepoints = [...emoji].map((char) => char.codePointAt(0)!);
  const stripped = codepoints
    .filter((codepoint) => codepoint !== 0xfe0f)
    .map((codepoint) => codepoint.toString(16))
    .join("-");
  const preserved = codepoints
    .map((codepoint) => codepoint.toString(16))
    .join("-");
  return [...new Set([stripped, preserved])];
}
