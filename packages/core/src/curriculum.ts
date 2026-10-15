import { CANDIDATE_WORDS } from "./candidate.words";
import { LEARNING_WORLDS } from "./worlds";

export const WORDS_PER_CHAPTER = 20;
/** Preferred maximum of new concepts after a world's first chapter. */
export const NEW_WORDS_PER_CHAPTER = 16;
/** Preferred minimum review count; balanced chapters can use five reviews. */
export const REVIEW_WORDS_PER_CHAPTER = WORDS_PER_CHAPTER - NEW_WORDS_PER_CHAPTER;

export interface CurriculumChapter {
  id: string;
  order: number;
  category: string;
  worldId: string;
  worldName: string;
  chapterNumber: number;
  label: string;
  newWords: string[];
  reviewPool: string[];
  reviewCount: number;
  targetSize: number;
}

function slug(value: string) {
  return value
    .replace(/ñ/g, "ny")
    .replace(/Ñ/g, "NY")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Splits one world's bank so full-sized banks do not end with a tiny chapter.
 * For a 300-word world the result is:
 *   - chapter 1: 20 new
 *   - 10 chapters: 16 new + 4 review
 *   - 8 chapters: 15 new + 5 review
 * = 19 chapters, every one targeting exactly 20 cards.
 */
export function balancedNewWordCounts(totalWords: number): number[] {
  const total = Math.max(0, Math.floor(totalWords));
  if (total === 0) return [];
  if (total <= WORDS_PER_CHAPTER) return [total];

  const remaining = total - WORDS_PER_CHAPTER;
  const continuationCount = Math.ceil(remaining / NEW_WORDS_PER_CHAPTER);
  const base = Math.floor(remaining / continuationCount);
  const extra = remaining % continuationCount;
  return [
    WORDS_PER_CHAPTER,
    ...Array.from({ length: continuationCount }, (_, index) => base + (index < extra ? 1 : 0)),
  ];
}

/**
 * Builds an interleaved curriculum: Animales 1, Casa 1, Comida 1, ...,
 * then those worlds return later as Animales 2, Casa 2, etc.
 * Repetition is intentional review only; it is never filler duplication.
 */
export function buildCurriculumChapters(
  bank: Record<string, string[]> = CANDIDATE_WORDS,
): CurriculumChapter[] {
  const worldState = LEARNING_WORLDS.map((world) => {
    const words = bank[world.category] ?? [];
    return {
      world,
      words,
      chapterSizes: balancedNewWordCounts(words.length),
      offset: 0,
      chapterNumber: 1,
      seen: [] as string[],
    };
  });

  const chapters: CurriculumChapter[] = [];
  let order = 1;
  let madeProgress = true;

  while (madeProgress) {
    madeProgress = false;

    for (const state of worldState) {
      const newCount = state.chapterSizes[state.chapterNumber - 1];
      if (!newCount) continue;
      madeProgress = true;

      const newWords = state.words.slice(state.offset, state.offset + newCount);
      state.offset += newWords.length;
      const chapterNumber = state.chapterNumber;
      const reviewCount = chapterNumber === 1 ? 0 : Math.max(0, WORDS_PER_CHAPTER - newWords.length);

      chapters.push({
        id: `${state.world.id}-${chapterNumber}`,
        order,
        category: state.world.category,
        worldId: state.world.id,
        worldName: state.world.name,
        chapterNumber,
        label: `${state.world.category} ${chapterNumber}`,
        newWords,
        reviewPool: [...state.seen],
        reviewCount,
        targetSize: newWords.length + Math.min(reviewCount, state.seen.length),
      });

      state.seen.push(...newWords);
      state.chapterNumber += 1;
      order += 1;
    }
  }

  return chapters;
}

export const CURRICULUM_CHAPTERS = buildCurriculumChapters();

export function chapterById(id: string) {
  return CURRICULUM_CHAPTERS.find((chapter) => chapter.id === id);
}

export function chaptersForCategory(category: string) {
  return CURRICULUM_CHAPTERS.filter((chapter) => chapter.category === category);
}

export function chapterLabel(category: string, chapterNumber: number) {
  return `${category} ${chapterNumber}`;
}

export function chapterAssetKey(category: string, word: string) {
  return `${slug(category)}.${slug(word)}`;
}
