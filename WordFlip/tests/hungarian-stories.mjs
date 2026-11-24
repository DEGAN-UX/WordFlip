import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const window={};
vm.runInNewContext(fs.readFileSync(new URL('../dist/hungarian-stories-data.js',import.meta.url),'utf8'),{window});
const stories=window.WordFlipHungarianStories;
assert.equal(stories.length,50,'Fifty graded Hungarian stories expected');
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

const practiceHandler=reader.match(/function showPractice\(\)\{([\s\S]*?)\n  \}/);
assert.ok(practiceHandler,'Practice button must have its own handler');
assert.match(practiceHandler[1],/classList\.remove\('training'/,'Practice button should open category choice, not a card');
assert.doesNotMatch(practiceHandler[1],/classList\.add\('training'/,'Practice button must not directly start a session');
const trainingLayout=fs.readFileSync(new URL('../dist/training-layout.js',import.meta.url),'utf8');
assert.match(trainingLayout,/home-launch/,'Category chooser must have a Start practice button');
console.log('Practice category-first navigation validated');

assert.match(reader,/root\.querySelector\('\.story-read-view \.story-back'\)\.onclick=\(\)=>window\.WordFlipDrill\.run\('back',closeReading\)/,'Reader back button must target reader screen, not library');
assert.match(reader,/listBack\.onclick=\(\)=>window\.WordFlipDrill\.run\('back',\(\)=>window\.WordFlipGoToPractice\?\.\(\)\)/,'Library Back returns to Practice');
assert.doesNotMatch(reader,/root\.querySelector\('\.story-back'\)\.onclick=closeReading/,'Generic selector accidentally binds to library back button');
console.log('Story back-navigation selectors validated');

assert.doesNotMatch(reader,/new MutationObserver\(updateLanguage\)/,
  'Navigation must not mutate observed body classes recursively');
assert.match(reader,/window\.WordFlipHideStoryViews=/,
  'The language switcher must close story screens');
assert.match(reader,/getElementById\('settingsButton'\)\?\.addEventListener\('click'/,
  'Settings must remain accessible while reading');
console.log('Story navigation observer regression validated');

assert.doesNotMatch(reader,/Read again ↗|Read story ↗/,'Story tiles no longer show action text');
assert.match(reader,/story-choice-read-icon/,'Visited story shows open-book status icon');
const app=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const corner=fs.readFileSync(new URL('../dist/wordflip.css',import.meta.url),'utf8');
assert.match(app,/newCardCorner\.innerHTML='<span>NEW<\/span>'/,'NEW ribbon text has a rotation wrapper');
assert.match(corner,/\.new-card-corner>span\{[^}]*rotate\(45deg\)/,'NEW ribbon text rotated clockwise');
console.log('Story tile and NEW corner badge visual markup verified');

assert.match(corner,/\.face\.front\{overflow:hidden\}/,'Ribbon must clip to card radius');
assert.match(corner,/left:66\.667%;top:33\.333%/,'Ribbon label must sit at triangular centroid');
assert.match(corner,/transform:translate\(-50%,-50%\) rotate\(45deg\)/,'Ribbon label must remain centred while angled');

for(const [label,filename] of [['Italian','italian-stories-data.js'],['German','german-stories-data.js']]){
  const scoped={};
  vm.runInNewContext(fs.readFileSync(new URL('../dist/'+filename,import.meta.url),'utf8'),{window:scoped});
  const collection=label==='Italian'?scoped.WordFlipItalianStories:scoped.WordFlipGermanStories;
  assert.equal(collection.length,50,label+': expected fifty stories');
  assert.equal(new Set(collection.map(item=>item.id)).size,50,label+': IDs must remain stable and unique');
  assert.equal(new Set(collection.map(item=>item.title)).size,50,label+': distinct titles expected');
  for(const story of collection){
    assert.ok(story.title&&story.subtitle&&story.words.length>=70,label+': incomplete story '+story.id);
    for(const entry of story.words)assert.ok(entry[0]?.trim()&&entry[1]?.trim(),label+': missing gloss in story '+story.id);
  }
}
assert.equal(new Set(stories.map(story=>story.title)).size,50,'Hungarian story titles must be unique');
assert.match(reader,/grammar-inspector-sheet/,'Expandable Grammar Inspector should be available');
assert.match(reader,/grammar-inspector-paradigm/,'Grammar Inspector should present actual conjugations');
assert.match(reader,/readLabel\.textContent='Read'/,'Read status must include a visible label');
console.log('150 graded stories validated across Italian, Hungarian and German, with Grammar Inspector.');

const readerCSS=fs.readFileSync(new URL('../dist/italian-stories.css',import.meta.url),'utf8');
assert.match(readerCSS,/\.story-word-tooltip\{[^}]*pointer-events:auto;/,
  'Tooltips must intercept touches rather than passing them through to the story');
assert.match(reader,/if\(tooltip\.contains\(event\.target\)\)return;/,
  'Outside tap handling must preserve taps on tooltip controls');
assert.match(reader,/openInspector\\(selection\\);/,
  'Grammar Inspector button must open the current selected-word snapshot');
assert.match(readerCSS,/\.grammar-inspector-sheet\{z-index:3500\}/,
  'Expanded grammar bottom sheet must stack above the tooltip');
console.log('Touch event hit testing for tooltip and Grammar Inspector covered.');

const inspectorReader=fs.readFileSync(new URL('../dist/italian-stories.js',import.meta.url),'utf8');
assert.match(inspectorReader,/const selection=\{word,data:insight,language:activeLanguage\}/,
  'Grammar details must capture the current selected word and language');
assert.match(inspectorReader,/selection\.word!==activeWord/,
  'Stale detail buttons must not show data from a previously selected word');
assert.match(inspectorReader,/inspectorSelection=selection/,
  'Inspector must update its selected-word snapshot on every expansion');
assert.match(inspectorReader,/Wegen des Wetters bleiben wir zu Hause/,
  'German wegen explanation needs a contextual example');
console.log('Grammar Inspector selected-word binding and wegen examples verified');

assert.ok(reader.includes(String.raw`\p{L}`),
  'Grammar Inspector must use Unicode letter classes for word lookup');
assert.ok(!reader.includes(String.raw`\\p{L}`),
  'Double-escaped Unicode classes would collapse unrelated words onto wegen');
console.log('Unicode grammar lookup normalisation validated');
