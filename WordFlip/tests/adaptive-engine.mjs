import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../dist/adaptive-engine.js',import.meta.url),'utf8'),context);
const adaptive=context.window.WordFlipAdaptive;
const card={id:'dog',priority:4,category:'word',it:'cane',en:'dog'};
const history={};
assert.equal(adaptive.pickDirection(card,history,'it','auto'),false,'start with recognition');
history['dog:it-en']={reviews:1,correct:1,streak:1,due:0};
assert.equal(adaptive.pickDirection(card,history,'it','auto'),true,'early recall for familiar words');
history['dog:en-it']={reviews:1,correct:0,consecutiveMisses:1,due:0};
assert.equal(adaptive.pickDirection(card,history,'it','auto'),true,'one recall error is not a regression');
history['dog:en-it'].consecutiveMisses=2;
adaptive.updatedRecallSupport({history,card,language:'it',reverse:true,rating:'again',now:1000});
assert.equal(adaptive.pickDirection(card,history,'it','auto'),false,'repeat recall failures trigger support');
adaptive.updatedRecallSupport({history,card,language:'it',reverse:false,rating:'knew',now:1000});
assert.equal(adaptive.pickDirection(card,history,'it','auto'),true,'successful recognition returns to recall');
const cards=Array.from({length:40},(_,i)=>({id:`c${i}`,priority:i+1,category:['word','phrase','verb','preposition'][i%4]}));
const engine={unlocked:()=>40};
const newSession=adaptive.createSession({cards,history:{},engine,language:'it',category:'all',direction:'auto',length:20,pace:'normal',now:1000});
assert.equal(newSession.length,10,'first automatic session introduces a controlled number of words');
assert.equal(new Set(newSession.map(c=>c.learningGroup)).size,4,'new session includes all available groups');
const focused=adaptive.createSession({cards,history:{},engine,language:'it',category:'verb',direction:'en-hu',length:20,now:1000});
assert.equal(focused.length,10,'focused mode uses the whole available category');
assert(focused.every(c=>c.reverse&&c.category==='verb'));
const topicCards=[{id:'fam',category:'phrase',topic:'family',level:'A1',priority:1},{id:'train',category:'phrase',topic:'travel',level:'A1',priority:2},{id:'fam2',category:'phrase',topic:'family',level:'A2',priority:3}];
const topicSession=adaptive.createSession({cards:topicCards,history:{},engine,language:'it',category:'phrase',direction:'auto',length:20,phraseTopics:['family'],phraseLevel:'A1',now:1000});
assert.deepEqual(topicSession.map(c=>c.id),['fam'],'topic and CEFR filters must both apply to focused Italian phrases');
const oldHistory={'c39:it-en':{reviews:4,correct:3,streak:2,due:0}};
const restricted={unlocked:()=>10};
const continued=adaptive.createSession({cards,history:oldHistory,engine:restricted,language:'it',category:'all',direction:'auto',length:10,now:1000});
assert(continued.some(c=>c.id==='c39'),'previously studied cards must survive a changed unlock boundary');
for(const language of ['it','hu']){
  const prefix=language==='it'?'it':'hu';
  const bank=Array.from({length:30},(_,i)=>({id:`${prefix}${i}`,priority:i+1,category:'word'}));
  const learned=Object.fromEntries(bank.slice(0,5).flatMap(c=>[
    [`${c.id}:${language}-en`,{reviews:3,correct:3,streak:3,due:999999,last:900}],
    [`${c.id}:en-${language}`,{reviews:3,correct:3,streak:3,due:999999,last:900}]
  ]));
  const more=adaptive.createSession({cards:bank,history:learned,engine:{unlocked:()=>5},language,category:'all',direction:'auto',length:12,now:1000});
  assert(more.some(c=>c.isNew&&c.priority>5),`${language}: automatic unlocks new vocabulary after reaching the boundary`);
  assert(more.filter(c=>c.isNew).length<=6,`${language}: normal pace still caps new material`);
  assert(more.every(c=>c.priority<=23),`${language}: the next vocabulary batch is priority-ordered`);
  const exhausted=bank.slice(0,5);
  const refreshed=adaptive.createSession({cards:exhausted,history:learned,engine:{unlocked:()=>5},language,category:'all',direction:'auto',length:5,now:1000});
  assert.equal(refreshed.length,0,`${language}: future-due cards must rest during normal sessions`);
  const extra=adaptive.createSession({cards:exhausted,history:learned,engine:{unlocked:()=>5},
    language,category:'all',direction:'auto',length:5,extraOnly:true,now:1000});
  assert.equal(extra.length,5,`${language}: optional extra practice offers familiar material`);
  assert(extra.every(c=>!c.isNew&&!c.isDue),`${language}: extra practice only uses studied, non-due cards`);
}
const huVerb={id:'v1',category:'verb',priority:31,hu:'menni · én · present',en:'megyek — I go',exampleHu:'Munkába megyek.',exampleEn:"I'm going to work."};
const huHistory={};
assert.equal(adaptive.hungarianVerbStage(huVerb,huHistory,'auto'),'recognition');
huHistory['v1:hu-recognition']={reviews:1,correct:1,streak:1,due:0};
assert.equal(adaptive.hungarianVerbStage(huVerb,huHistory,'auto'),'guided');
huHistory['v1:hu-guided']={reviews:1,correct:1,streak:1,due:0};
assert.equal(adaptive.hungarianVerbStage(huVerb,huHistory,'auto'),'production');
huHistory['v1:hu-production']={reviews:2,correct:0,consecutiveMisses:2,due:0};
adaptive.updatedVerbSupport({history:huHistory,card:{...huVerb,verbStage:'production'},rating:'again',now:1000});
assert.equal(adaptive.hungarianVerbStage(huVerb,huHistory,'auto'),'guided','repeated production errors return to guided practice');
adaptive.updatedVerbSupport({history:huHistory,card:{...huVerb,verbStage:'guided'},rating:'knew',now:1000});
assert.equal(adaptive.hungarianVerbStage(huVerb,huHistory,'auto'),'production','guided success retries production');
const guided=adaptive.createSession({cards:[huVerb],history:{},engine:{unlocked:()=>40},language:'hu',category:'verb',direction:'auto',verbMode:'guided',length:10,now:1000});
assert.equal(guided[0].verbStage,'guided','focused manual practice can select a stage');
const original={ 'v1:hu-en':{reviews:3,correct:2,streak:2,due:0}};
assert.equal(adaptive.hungarianVerbStage(huVerb,original,'auto'),'guided','legacy conjugation success is not treated as productive mastery');
console.log('Adaptive selection passed: recognition, recall, support, pacing, categories and focus');

// Presentation order is randomised only after adaptive selection.
const sourceCards=Array.from({length:12},(_,i)=>({id:'shuffle-'+i,category:'word'}));
const originalIds=sourceCards.map(c=>c.id);
const seededRandom=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const firstOrder=adaptive.shuffleSession(sourceCards,null,seededRandom(1));
const secondOrder=adaptive.shuffleSession(sourceCards,firstOrder[0].id,seededRandom(2));
const thirdOrder=adaptive.shuffleSession(sourceCards,secondOrder[0].id,seededRandom(3));
for(const shuffled of [firstOrder,secondOrder,thirdOrder]){
  assert.equal(shuffled.length,sourceCards.length,'Shuffling must not drop or add cards');
  assert.equal(new Set(shuffled.map(c=>c.id)).size,sourceCards.length,'Shuffling must preserve unique cards');
  assert.deepEqual(shuffled.map(c=>c.id).sort(),originalIds.slice().sort(),'Selection remains unchanged');
}
assert.deepEqual(sourceCards.map(c=>c.id),originalIds,'Shuffling cannot modify scheduler output');
assert.notDeepEqual(firstOrder.map(c=>c.id),secondOrder.map(c=>c.id),'Fresh sessions should not repeat a fixed order');
assert.notEqual(secondOrder[0].id,firstOrder[0].id,'Second session must start with a different card');
assert.notEqual(thirdOrder[0].id,secondOrder[0].id,'Third session must start with a different card');
assert.deepEqual(adaptive.shuffleSession([],null,seededRandom(1)),[],'No cards should remain empty');
assert.equal(adaptive.shuffleSession([sourceCards[0]],sourceCards[0].id,seededRandom(1))[0],sourceCards[0],
  'Single-card sessions must still work');
const quizCards=[{record:{id:'q1'},type:'recognition'},{record:{id:'q2'},type:'recall'},{record:{id:'q3'},type:'application'}];
const shuffledQuiz=adaptive.shuffleSession(quizCards,'q2',()=>0);
assert.notEqual(shuffledQuiz[0].record.id,'q2','Cheatsheet sessions also avoid repeated first cards');
assert.equal(new Set(shuffledQuiz).size,3,'Cheatsheet question variants must remain intact');
const appSource=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
assert.match(appSource,/function shuffleSelectedQueue\(\)/,'All sessions must use the presentation shuffle');
assert.equal((appSource.match(/    shuffleSelectedQueue\(\);/g)||[]).length,2,
  'Both normal and progress-derived practice sessions must shuffle');
console.log('Session shuffling: adaptive selection preserved, independent orders, no repeated starting card.');

const promoted=[{id:'promoted',priority:1,category:'word'}];
const promotedHistory={'promoted:it-en':{reviews:2,correct:2,streak:2,due:999999},
  'promoted:en-it':{reviews:0,due:999999}};
const promotedNormal=adaptive.createSession({cards:promoted,history:promotedHistory,
  engine:{unlocked:()=>1},language:'it',category:'all',direction:'auto',length:10,now:1000});
assert.equal(promotedNormal.length,0,'A future-due promoted recall direction must not be presented early');
const promotedExtra=adaptive.createSession({cards:promoted,history:promotedHistory,
  engine:{unlocked:()=>1},language:'it',category:'all',direction:'auto',length:10,extraOnly:true,now:1000});
assert.equal(promotedExtra.length,1,'Optional extra practice can include a promoted direction');
console.log('Strict due dates, new-card limits and opt-in extra reinforcement passed.');
