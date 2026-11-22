import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const window={};
vm.runInNewContext(fs.readFileSync(new URL('../dist/hungarian-stories-data.js',import.meta.url),'utf8'),{window});
const stories=window.WordFlipHungarianStories;
assert.equal(stories.length,10,'Ten Hungarian stories expected');
let total=0,annotated=0;
for(const story of stories){
  assert.ok(story.title&&story.subtitle);
  assert.ok(story.words.length>=70,'Story too short: '+story.title);
  for(const entry of story.words){
    assert.ok(entry[0]?.trim()&&entry[1]?.trim(),'Each Hungarian word must have an English translation');
    total++;
    if(entry[2]){
      annotated++;
      assert.ok(entry[2].length>1,'A grammar breakdown needs at least two parts');
      for(const part of entry[2])assert.ok(part[0]&&part[1]);
    }
  }
}
assert.ok(annotated>80,'Expected curated morphology breakdowns');
const reader=fs.readFileSync(new URL('../dist/italian-stories.js',import.meta.url),'utf8');
assert.match(reader,/hu-HU/);
assert.match(reader,/it-IT/);
assert.match(reader,/SpeechSynthesisUtterance/);
assert.match(reader,/WordFlipHungarianStories/);
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
assert.match(html,/hungarian-stories-data\.js/);
console.log('Hungarian Stories validated:',stories.length,'stories,',total,'words,',annotated,'morphology explanations; bilingual pronunciation configured');
