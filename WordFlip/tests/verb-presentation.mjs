import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../dist/verb-presentation.js',import.meta.url),'utf8'),sandbox);
const present=sandbox.window.WordFlipVerbPresentation.present;
const cards=JSON.parse(fs.readFileSync(new URL('../dist/cards.json',import.meta.url),'utf8')).filter(c=>c.category==='verb');
assert.equal(cards.length,10);
for(const card of cards){
  for(const stage of ['recognition','guided','production']){
    const view=present(card,stage);
    assert(view.front&&view.back&&view.spoken,`${card.id} ${stage}: complete card`);
    if(stage==='production'){
      assert.equal(view.front,card.exampleEn,`${card.id}: whole English prompt`);
      assert.equal(view.back,card.exampleHu,`${card.id}: whole Hungarian answer`);
      assert.equal(view.spoken,view.back,`${card.id}: speech matches revealed answer`);
    }else{
      const conjugated=card.en.split(' — ')[0];
      assert.equal(view.spoken,conjugated,`${card.id}: pronunciation is the conjugated verb`);
    }
  }
}
const dog=cards.find(c=>c.id==='v4');
assert.equal(present(dog,'production').front,'I see the dog.');
assert.equal(present(dog,'production').back,'Látom a kutyát.');
console.log('Hungarian verb presentations passed: all 10 verbs, 3 stages, spoken/display consistency');
