import fs from 'node:fs';
import assert from 'node:assert/strict';
const cards=JSON.parse(fs.readFileSync(new URL('../dist/italian-cards.json',import.meta.url),'utf8'));
const count=category=>cards.filter(c=>c.category===category).length;
assert.equal(count('word'),690);
assert(count('phrase')>=1000,'integrated conversation bank should contain at least 1,000 phrases');
assert.equal(count('verb'),60);
assert.equal(count('article'),60);
assert.equal(count('preposition'),41);
assert.equal(new Set(cards.map(c=>c.id)).size,cards.length,'every card needs a unique ID');
assert.equal(new Set(cards.map(c=>c.priority)).size,cards.length,'priorities must be unique');
const first=cards.filter(c=>c.priority<=100);
assert.equal(first.length,100);
for(const part of ['noun','verb','adjective','adverb','preposition'])assert(first.some(c=>c.partOfSpeech===part),`${part} must appear in the first 100`);
assert(first.some(c=>c.category==='phrase'),'conversation must appear in the first 100');
assert(!first.some(c=>c.category==='article'),'retired article drills should not appear in mixed practice');
for(const c of cards){assert(c.it&&c.en&&c.exampleIt&&c.exampleEn,`incomplete card ${c.id}`);}
for(const c of cards.filter(c=>c.category==='phrase')){
  assert(c.topic&&['A1','A2'].includes(c.level),`phrase missing topic or level ${c.id}`);
}
for(const c of cards.filter(c=>c.category==='verb')){
  assert(c.italianPronoun&&c.englishForm&&c.form,`incomplete conjugation ${c.id}`);
  assert.notEqual(c.englishForm,c.form,`conjugation answers must be distinguishable ${c.id}`);
  assert(!c.exampleIt.includes(' / '),`conjugation example should be a natural Italian sentence ${c.id}`);
  assert(!c.exampleEn.includes(' / '),`conjugation example should be a natural English sentence ${c.id}`);
}
console.log('Italian content passed:',cards.length,'cards and balanced first 100');
