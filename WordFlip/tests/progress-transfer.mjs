import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const sandbox={window:{},Date};
vm.runInNewContext(fs.readFileSync(new URL('../dist/progress-transfer.js',import.meta.url),'utf8'),sandbox);
const t=sandbox.window.WordFlipTransfer;
const progress={hu:{'w1:hu-en':{reviews:4,correct:2,misses:2,last:1000,due:1100},
  'cheatsheet:hu-grammar:plurals:plural:back:-ak:recognition':{reviews:2,correct:2,misses:0,last:1200}},
  it:{'it-word-1:it-en':{reviews:2,correct:1,misses:1,last:1000}}};
const lookup=t.contentLookup({hu:[{id:'w1',category:'word',hu:'ház',en:'house'}],it:[{id:'it-word-1',category:'word',it:'casa',en:'house'}]},
  [{patternId:'hu-grammar:plurals:plural:back:-ak',category:'plurals',form:'házak',english:'houses',stem:'ház',suffix:'-ak'}]);
const backup=t.createBackup(progress,lookup,'2026-11-17T00:00:00.000Z');
assert.equal(backup.version,2);
assert.equal(backup.cardContext.hu.length,2);
assert.equal(backup.cardContext.hu[0].source,'ház');
assert.equal(backup.cardContext.hu[1].source,'házak');
assert.equal(backup.summary.it.reviews,2);
assert.equal(t.validateBackup(backup),progress);
assert.equal(t.validateBackup({format:'wordflip-progress',version:1,progress}),progress,'v1 remains importable');
assert.throws(()=>t.validateBackup({format:'wordflip-progress',version:3,progress}));
assert.throws(()=>t.validateBackup({format:'wordflip-progress',version:2,progress:{hu:{a:{reviews:-1}},it:{}}}));
const current={hu:{'w1:hu-en':{reviews:5,last:2000}},it:{'it-word-2:it-en':{reviews:1,last:3000}}};
const merged=t.mergeProgress(current,progress);
assert.equal(merged.hu['w1:hu-en'].reviews,5,'newer current record wins');
assert.equal(merged.it['it-word-1:it-en'].reviews,2,'missing imported cards are added');
assert.equal(merged.it['it-word-2:it-en'].reviews,1,'unrelated current cards survive');
const report=t.createReport(progress,lookup,'2026-11-17T00:00:00.000Z');
assert.match(report,/ház → house/);
assert.match(report,/casa → house/);
assert.match(report,/plurals/);
assert.match(report,/Most difficult prompts/);
console.log('Progress transfers passed: v1/v2 validation, metadata, merge and readable report');
