import type { WordCard, WordProgress } from "@mmdp/core";
import type { CurriculumChapter } from "@mmdp/core/curriculum";

function normalizeWord(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleUpperCase("es")
    .trim();
}

function reviewScore(card: WordCard, progress: Record<string, WordProgress>) {
  const state = progress[card.id];
  if (!state) return 50;
  if (state.mastery === "practicing") return 400 + state.incorrectReads * 20;
  if (state.mastery === "learned") return 250 + state.incorrectReads * 10;
  if (state.mastery === "new") return 180;
  return 80 + state.incorrectReads * 5;
}

export interface CurriculumSessionResult {
  cards: WordCard[];
  newCards: WordCard[];
  reviewCards: WordCard[];
  missingNewWords: string[];
  missingReviewSlots: number;
  ready: boolean;
}

/**
 * Builds one themed chapter using exactly the words assigned by the curriculum.
 * No unrelated concept is substituted and no card is duplicated to fill space.
 */
export function buildCurriculumSession(
  chapter: CurriculumChapter,
  availableCards: readonly WordCard[],
  progress: Record<string, WordProgress> = {},
): CurriculumSessionResult {
  const categoryCards = availableCards.filter((card) => card.category === chapter.category);
  const byWord = new Map(categoryCards.map((card) => [normalizeWord(card.word), card]));

  const newCards: WordCard[] = [];
  const missingNewWords: string[] = [];
  for (const word of chapter.newWords) {
    const card = byWord.get(normalizeWord(word));
    if (card) newCards.push(card);
    else missingNewWords.push(word);
  }

  const newIds = new Set(newCards.map((card) => card.id));
  const reviewWords = new Set(chapter.reviewPool.map(normalizeWord));
  const reviewCards = categoryCards
    .filter((card) => reviewWords.has(normalizeWord(card.word)) && !newIds.has(card.id))
    .sort((a, b) =>
      reviewScore(b, progress) - reviewScore(a, progress)
      || (progress[b.id]?.lastSeenAt ?? "").localeCompare(progress[a.id]?.lastSeenAt ?? "")
      || a.word.localeCompare(b.word, "es"),
    )
    .slice(0, chapter.reviewCount);

  const missingReviewSlots = Math.max(0, chapter.reviewCount - reviewCards.length);
  const cards = [...newCards, ...reviewCards];
  return {
    cards,
    newCards,
    reviewCards,
    missingNewWords,
    missingReviewSlots,
    ready: missingNewWords.length === 0
      && missingReviewSlots === 0
      && cards.length === chapter.targetSize,
  };
}
