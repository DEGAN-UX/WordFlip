import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context=vm.createContext({window:{},localStorage:{getItem:()=>null,setItem(){}}});
for(const file of ['progress-stats.js','cheatsheet-data.js','cheatsheet-engine.js']){
  vm.runInContext(fs.readFileSync(new URL(`../dist/${file}`,import.meta.url),'utf8'),context);
}
const c=context.window.WordFlipCheatsheet;
assert.equal(c.records.length,100);
const expected={cases:38,plurals:6,accusative:6,possessives:10,'present-indefinite':12,'present-definite':12,'past-indefinite':6,'past-definite':6,conditional:4};
assert.deepEqual(Object.fromEntries(c.categories.map(([id])=>[id,c.records.filter(r=>r.category===id).length])),expected);
assert.equal(new Set(c.records.map(r=>r.id)).size,100);
assert.deepEqual(Array.from(c.records,r=>r.number),Array.from({length:100},(_,i)=>i+1));
let validated=0;
for(const record of c.records){
  for(const type of record.supportedQuestionTypes){
    const q=c.makeQuestion(record,type);
    assert(q,`Missing ${record.id} ${type}`);
    assert.equal(q.choices.length,4);
    assert.equal(new Set(q.choices).size,4);
    assert.equal(q.choices.filter(x=>x===q.correct).length,1);
    if(type!=='recognition')assert(!q.sub.includes(q.correct),`Answer leakage: ${record.id} ${type}`);
    validated++;
  }
}
assert(!c.records.find(r=>r.number===85).supportedQuestionTypes.includes('recognition'));
assert(!c.records.find(r=>r.number===91).supportedQuestionTypes.includes('recognition'));
assert.equal(c.records.find(r=>r.number===8).form,'házzal');
assert.equal(c.records.find(r=>r.number===5).form,'almát');
assert.equal(c.records.find(r=>r.number===97).form,'tanulnék');
const first=c.createSession({},c.categories.map(([id])=>id),20);
assert.equal(first.length,20);
assert.equal(new Set(first.map(x=>x.record.id)).size,20);
assert.deepEqual(Object.fromEntries(['recognition','recall','application'].map(type=>[type,first.filter(q=>q.type===type).length])),{recognition:10,recall:7,application:3});
const history={},q=first[0],key=c.key(q.record,q.type);
c.recordAnswer(history,q,false,1000);
assert.equal(history[key].misses,1);
c.recordAnswer(history,q,true,2000);
assert.equal(history[key].reviews,2);
assert.equal(history[key].correct,1);
assert.equal(history[key].streak,1);
assert(history[key].due>2000);
for(const [category] of c.categories){
  const session=c.createSession({},[category],20);
  assert(session.length>0);
  assert(session.every(q=>q.record.category===category));
}
console.log(`Cheatsheet passed: 100 records, ${validated} unique-answer variants, 9 categories and scheduling`);
