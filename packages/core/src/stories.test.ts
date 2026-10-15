import { describe, expect, it } from 'vitest';
import { STORIES, storiesForLevel, storyMinimumLevel, storyWordCount, validateStories, STORY_PROVENANCE } from './stories';
describe('graded original stories',()=> {
  it('validates original content, questions and all eight stages',()=> {
    expect(validateStories()).toEqual([]);
    expect(STORIES).toHaveLength(16);
    expect(STORY_PROVENANCE.kind).toBe('original');
    expect(STORY_PROVENANCE.specialistValidation).toBe('pending');
  });
  it.each([1,6,7,12,13,18,19,24,25,30,31,36,37,42,43,48])('only offers reached stages at level %i',level=>{
    const available=storiesForLevel(level);
    expect(available.every(s=>storyMinimumLevel(s)<=level)).toBe(true);
    expect(available).toHaveLength(Math.ceil(level/6)*2);
  });
  it('retains simpler stories and clamps out-of-range levels',()=> {
    expect(storiesForLevel(48)).toContain(STORIES[0]);
    expect(storiesForLevel(-5)).toHaveLength(2);
    expect(storiesForLevel(500)).toHaveLength(16);
  });
  it('increases average story length through the stages',()=> {
    const average=(stage:number)=>STORIES.filter(s=>s.stage===stage).reduce((n,s)=>n+storyWordCount(s),0)/2;
    for(let stage=2;stage<=8;stage++) expect(average(stage)).toBeGreaterThan(average(stage-1));
  });
  it('rejects malformed answer keys',()=> {
    const broken=structuredClone(STORIES);
    broken[0].questions[0].answer=99;
    expect(validateStories(broken)).toContain('lola-sopa: invalid comprehension');
  });
});
