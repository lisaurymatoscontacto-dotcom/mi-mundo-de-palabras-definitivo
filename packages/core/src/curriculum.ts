import { CANDIDATE_WORDS } from "./candidate.words";
import { LEARNING_WORLDS } from "./worlds";

export const WORDS_PER_CHAPTER = 20;
export const NEW_WORDS_PER_CHAPTER = 16;
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
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Builds an interleaved curriculum: Animales 1, Casa 1, Comida 1, ...,
 * then those worlds return later as Animales 2, Casa 2, etc.
 *
 * Chapter 1 of a world introduces up to 20 new concepts. Later chapters
 * introduce up to 16 new concepts and reserve four slots for intentional
 * review chosen at runtime from previously seen/difficult words.
 */
export function buildCurriculumChapters(
  bank: Record<string, string[]> = CANDIDATE_WORDS,
): CurriculumChapter[] {
  const worldState = LEARNING_WORLDS.map((world) => ({
    world,
    words: bank[world.category] ?? [],
    offset: 0,
    chapterNumber: 1,
    seen: [] as string[],
  }));

  const chapters: CurriculumChapter[] = [];
  let order = 1;
  let madeProgress = true;

  while (madeProgress) {
    madeProgress = false;

    for (const state of worldState) {
      if (state.offset >= state.words.length) continue;
      madeProgress = true;

      const newCount = state.chapterNumber === 1 ? WORDS_PER_CHAPTER : NEW_WORDS_PER_CHAPTER;
      const newWords = state.words.slice(state.offset, state.offset + newCount);
      state.offset += newWords.length;

      const chapterNumber = state.chapterNumber;
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
