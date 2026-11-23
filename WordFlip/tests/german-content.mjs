import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const dir=new URL('../dist/',import.meta.url);
const cards=JSON.parse(fs.readFileSync(new URL('german-cards.json',dir),'utf8'));
const categories=new Map();
const ids=new Set();
for(const c of cards){
  assert.ok(c.id&&c.de&&c.en,'German cards need complete prompts and answers');
  assert.ok(!ids.has(c.id),'German card IDs must be unique');ids.add(c.id);
  categories.set(c.category,(categories.get(c.category)||0)+1);
  if(['article','case','order'].includes(c.category)){
    assert.ok(c.prompt.includes('___')&&c.answer&&c.spoken,'Grammar drills need a blank, answer and complete spoken sentence: '+c.id);
    assert.ok(c.note,'Grammar drills need an explanation: '+c.id);
  }
  if(c.partOfSpeech==='noun')assert.match(c.de,/^(der|die|das) /,'Nouns need articles');
  assert.ok(c.level,'German cards need a learning level');
}
assert.ok(cards.length>=450);
for(const [c,count] of [['word',150],['verb',75],['phrase',75],['case',45],['article',25],['order',45]]){
  assert.ok((categories.get(c)||0)>=count,'Too few '+c+' cards');
}
const context={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('german-stories-data.js',dir),'utf8'),context);
const stories=context.window.WordFlipGermanStories;
assert.equal(stories.length,30,'German library must contain 30 B1-B2 stories');
const expectedLevel=i=>i<12?'B1':i<18?'B1+':i<24?'B2-':'B2';
assert.equal(stories.reduce((n,s)=>n+s.words.length,0)>3000,true,'German library should contain over 3000 tappable words');
for(const [index,story] of stories.entries()){
  assert.equal(story.id,index+1,'Stable consecutive story IDs required');
  assert.equal(story.level,expectedLevel(index),'Difficulty must progress from B1 to B2');
  assert.ok(story.title&&story.subtitle&&story.topic&&story.words.length>=90);
  for(const w of story.words)assert.ok(w.length===2&&w[0]?.trim()&&w[1]?.trim(),'Missing German word gloss');
}
const app=fs.readFileSync(new URL('app.js',dir),'utf8');
const reader=fs.readFileSync(new URL('italian-stories.js',dir),'utf8');
const adaptive=fs.readFileSync(new URL('adaptive-engine.js',dir),'utf8');
const index=fs.readFileSync(new URL('index.html',dir),'utf8');
assert.match(app,/wordflip-active-language/);
assert.match(app,/german-cards\.json/);
assert.match(app,/category==='order'/);
assert.match(reader,/WordFlipGermanStories/);
assert.match(reader,/de-CH/);
assert.match(adaptive,/de: \{word:/);
assert.match(index,/german-engine\.js/);
assert.match(index,/german-stories-data\.js/);
console.log('German module:',cards.length,'cards,',stories.length,'stories; all categories, glosses and integration verified');

console.log('30 German stories verified, with B1 → B2 progression and English gloss on every word');
