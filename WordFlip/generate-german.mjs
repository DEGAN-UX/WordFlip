import fs from 'node:fs';
const core=JSON.parse(fs.readFileSync(new URL('./content/german-core.json',import.meta.url),'utf8'));
const grammar=JSON.parse(fs.readFileSync(new URL('./content/german-grammar.json',import.meta.url),'utf8'));
const cards=[...core,...grammar];
const ids=new Set();
for(const card of cards){
  if(!card.de||!card.en||!card.category||!card.id||ids.has(card.id))throw new Error('Invalid or duplicate German card '+card.id);
  ids.add(card.id);
  if(['case','article','order'].includes(card.category)&&(!card.prompt||!card.answer||!card.spoken||!card.note)){
    throw new Error('Incomplete German grammar drill '+card.id);
  }
}
const cadence=['word','phrase','case','verb','article','order','word','phrase','case','verb','order','article'];
const queues=Object.fromEntries([...new Set(cadence)].map(category=>[category,cards.filter(c=>c.category===category)]));
let rank=1;
while(rank<=cards.length){
  const before=rank;
  for(const category of cadence){
    const card=queues[category].shift();
    if(card)card.priority=rank++;
  }
  if(before===rank)throw new Error('German category cannot be prioritised');
}
fs.writeFileSync(new URL('./dist/german-cards.json',import.meta.url),JSON.stringify(cards)+'\n');
console.log('German cards:',Object.fromEntries([...new Set(cards.map(c=>c.category))].map(category=>[category,cards.filter(c=>c.category===category).length])));
