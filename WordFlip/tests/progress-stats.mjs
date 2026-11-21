import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../dist/progress-stats.js',import.meta.url),'utf8'),context);
const p=context.window.WordFlipProgress;
const cards=[{id:'one',category:'word'},{id:'two',category:'word'},{id:'three',category:'word'}];
const history={
  'one:it-en':{reviews:3,correct:2,streak:1,lastRating:'knew',recentRatings:['again','knew','knew']},
  'one:en-it':{reviews:1,correct:0,lastRating:'again',recentRatings:['again']},
  'two:it-en':{reviews:2,correct:1,streak:1,lastRating:'knew'},
  'three:en-it':{due:10000}
};
const stats=p.summarise(cards,history,'it');
assert.equal(stats.seen,2);assert.equal(stats.total,3);
assert.equal(stats.recognition.tested,2);assert.equal(stats.recall.tested,1);
assert.equal(stats.recall.value,0);
assert(p.confidence(history['one:it-en'])>2/3,'recent correct answers should outweigh older miss');
assert.equal(p.confidence(history['three:en-it']),null,'scheduled but untested is not failure');
const ratings=p.recordRecent({recentRatings:Array(8).fill('again')},'knew');
assert.equal(ratings.length,8);assert.equal(ratings.at(-1),'knew');
const patterns=[{patternId:'plural',category:'plurals'},{patternId:'case',category:'cases'}];
const cheat=p.cheatsheet(patterns,{'cheatsheet:plural:recognition':{reviews:1,correct:1,lastRating:'knew'}});
assert.equal(cheat.seen,1);assert.equal(cheat.recognition.tested,1);assert.equal(cheat.recall.tested,0);
console.log('Progress statistics passed: seen, untested, confidence and rolling results');
