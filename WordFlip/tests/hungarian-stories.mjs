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

const italianWindow={};
vm.runInNewContext(fs.readFileSync(new URL('../dist/italian-stories-data.js',import.meta.url),'utf8'),{window:italianWindow});
for(const [language,set,opening,closing] of [
  ['Italian',italianWindow.WordFlipItalianStories,'«','»'],
  ['Hungarian',stories,'„','”']
]){
  let quotations=0;
  for(const story of set){
    let balance=0;
    for(const [word] of story.words){
      if(word.startsWith(opening)){balance++;quotations++;}
      if(word.includes(closing)){balance--;}
      assert.ok(balance===0||balance===1,language+' invalid quotation nesting: '+story.title);
    }
    assert.equal(balance,0,language+' unclosed quotation: '+story.title);
  }
  assert.ok(quotations>=30,language+' dialogue should use quotation marks');
}
assert.match(reader,/wordflipActivityHome/);
assert.match(reader,/activity-practice/);
assert.match(reader,/activity-stories/);
assert.match(reader,/story-library-back/);
assert.doesNotMatch(reader,/className='pill stories-pill'/);
console.log('Dialogue punctuation and separate activity navigation validated');

const practiceHandler=reader.match(/practiceButton\.onclick=\(\)=>\{([\s\S]*?)\n  \};/);
assert.ok(practiceHandler,'Practice button must have its own handler');
assert.match(practiceHandler[1],/classList\.remove\('training'/,'Practice button should open category choice, not a card');
assert.doesNotMatch(practiceHandler[1],/classList\.add\('training'/,'Practice button must not directly start a session');
const trainingLayout=fs.readFileSync(new URL('../dist/training-layout.js',import.meta.url),'utf8');
assert.match(trainingLayout,/home-launch/,'Category chooser must have a Start practice button');
console.log('Practice category-first navigation validated');

assert.match(reader,/root\.querySelector\('\.story-read-view \.story-back'\)\.onclick=closeReading/,'Reader back button must target reader screen, not library');
assert.match(reader,/listBack\.onclick=showHub/,'Library back button must return to activities');
assert.doesNotMatch(reader,/root\.querySelector\('\.story-back'\)\.onclick=closeReading/,'Generic selector accidentally binds to library back button');
console.log('Story back-navigation selectors validated');

assert.doesNotMatch(reader,/new MutationObserver\(updateLanguage\)/,
  'Navigation must not mutate observed body classes recursively');
assert.match(reader,/langSwitch\?\.addEventListener\('click'/,
  'The language switcher must close story screens');
assert.match(reader,/getElementById\('settingsButton'\)\?\.addEventListener\('click'/,
  'Settings must remain accessible while reading');
console.log('Story navigation observer regression validated');
