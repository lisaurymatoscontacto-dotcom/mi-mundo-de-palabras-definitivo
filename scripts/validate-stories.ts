import { STORIES, validateStories, storyWordCount } from '../packages/core/src/stories';
const errors = validateStories();
if(errors.length) { console.error(errors.join('\n'));process.exit(1); }
console.log('Stories OK: '+STORIES.length+' original stories across 8 stages.');
for(let stage=1;stage<=8;stage++) console.log('Stage '+stage+': '+STORIES.filter(s=>s.stage===stage).map(s=>s.title+' ('+storyWordCount(s)+' words)').join('; '));
