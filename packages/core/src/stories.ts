import catalog from '../../../content/stories.es.json';
import { getLevel } from './index';
export interface Story {
  id: string; stage: number; title: string; value: string; knowledge: string;
  pages: string[]; vocabulary: {word: string; meaning: string}[];
  questions: {prompt: string; options: string[]; answer: number; explanation: string}[];
  talk: string;
}
export const STORIES: readonly Story[] = catalog.stories;
export const STORY_PROVENANCE = catalog.provenance;
export const STORY_WORD_LIMITS = [0,45,65,90,115,140,160,185,220];
export function storyMinimumLevel(story: Story) { return (story.stage - 1) * 6 + 1; }
export function storiesForLevel(level: number) {
  const stage = getLevel(level).stage;
  return STORIES.filter(story => story.stage <= stage);
}
export function storyWordCount(story: Story) {
  return story.pages.join(' ').match(/[\p{L}\p{M}]+/gu)?.length ?? 0;
}
export function validateStories(stories: readonly Story[] = STORIES): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const story of stories) {
    if (ids.has(story.id)) errors.push('Duplicate story: '+story.id);
    ids.add(story.id);
    if (!Number.isInteger(story.stage) || story.stage<1 || story.stage>8) errors.push(story.id+': invalid stage');
    if (!story.title || !story.value || !story.knowledge || !story.talk) errors.push(story.id+': missing editorial field');
    if (story.pages.length<3 || story.pages.some(p=>!p.trim())) errors.push(story.id+': missing reading pages');
    if (storyWordCount(story)>STORY_WORD_LIMITS[story.stage]) errors.push(story.id+': exceeds stage word limit ('+storyWordCount(story)+')');
    if (story.questions.length<2 || story.questions.some(q=>q.options.length<2 || !Number.isInteger(q.answer) || !q.options[q.answer] || !q.explanation)) errors.push(story.id+': invalid comprehension');
    if (story.vocabulary.some(v=>!v.word || !v.meaning)) errors.push(story.id+': missing vocabulary support');
  }
  for(let stage=1;stage<=8;stage++) if(!stories.some(s=>s.stage===stage)) errors.push('Missing stage '+stage);
  return errors;
}
