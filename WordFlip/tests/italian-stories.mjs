import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const context={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../dist/italian-stories-data.js',import.meta.url),'utf8'),context);
const stories=context.window.WordFlipItalianStories;
assert.equal(stories.length,10,'Italian Stories must contain ten stories');
const ids=new Set();
for(const story of stories){
  assert.ok(!ids.has(story.id),'Each story needs a unique id');
  ids.add(story.id);
  assert.ok(story.title&&story.subtitle);
  assert.ok(story.words.length>=100,'Each story should offer several minutes of beginner reading');
  for(const entry of story.words){
    assert.equal(entry.length,2);
    assert.ok(entry[0].trim(),'No empty Italian words');
    assert.ok(entry[1].trim(),'No missing English word glosses');
  }
}
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
assert.match(html,/italian-stories-data\.js/);
assert.match(html,/italian-stories\.js/);
assert.match(html,/italian-stories\.css/);
console.log('Italian Stories validated:',stories.length,'stories,',stories.reduce((sum,s)=>sum+s.words.length,0),'tappable words');
