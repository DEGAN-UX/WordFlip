import fs from 'node:fs';
import path from 'node:path';

const root=import.meta.dirname;
const read=name=>fs.readFileSync(path.join(root,'content',name),'utf8');
const original=JSON.parse(fs.readFileSync(path.join(root,'content','starter-cards.json'),'utf8'));
const counts={noun:170,verb:120,adjective:75,adverb:40,pronoun:25,conjunction:20,postposition:20,suffix:30,phrase:50};
const result=[...original];
const posOf=c=>c.partOfSpeech||({word:({w1:'noun',w2:'noun',w3:'noun',w4:'noun',w5:'noun',w6:'noun',w7:'noun',w8:'noun',w9:'noun',w10:'noun',w11:'adjective',w12:'adjective',w13:'adjective',w14:'adverb',w15:'adverb',w16:'adverb',w17:'conjunction',w18:'conjunction',w19:'pronoun',w20:'pronoun'})[c.id],verb:'verb',suffix:'suffix',phrase:'phrase'})[c.category];
const seen=new Set(original.map(c=>`${posOf(c)}:${c.hu}`));
const current=Object.fromEntries(Object.keys(counts).map(k=>[k,original.filter(c=>posOf(c)===k).length]));
const vowels=/^[aáeéiíoóöőuúüű]/i;
const article=hu=>vowels.test(hu)?'az':'a';
const englishArticle=en=>/^[aeiou]/i.test(en)?'an':'a';
const add=(pos,hu,en,exampleHu,exampleEn)=>{
  if(current[pos]>=counts[pos]||seen.has(`${pos}:${hu}`))return;
  const category=['verb','suffix','phrase'].includes(pos)&&pos!=='verb'?pos:'word';
  const id=`exp_${pos}_${String(current[pos]+1).padStart(3,'0')}`;
  result.push({id,category,partOfSpeech:pos,hu,en,exampleHu,exampleEn,level:current[pos]<Math.floor(counts[pos]*.55)?'A1':'A2'});
  current[pos]++;seen.add(`${pos}:${hu}`);
};
const rows=read('expanded-lexicon.txt').split('\n').filter(l=>l&&!l.startsWith('#')).map(line=>{
  const [type,rest]=line.split('|');
  return {type,items:rest.split(';').map(pair=>{const at=pair.indexOf('=');return [pair.slice(0,at),pair.slice(at+1)];})};
});
const concrete=rows.filter(r=>r.type==='nounConcrete').flatMap(r=>r.items).slice(0,130);
const abstract=rows.filter(r=>r.type==='nounAbstract').flatMap(r=>r.items).filter(([hu])=>hu!=='órajel').slice(0,30);
for(const [i,[hu,en]] of concrete.entries()){
  const a=article(hu);
  if(i<30){
    add('noun',hu,en,`${a[0].toUpperCase()+a.slice(1)} ${hu} itt van.`,`The ${en} is here.`);
  }else if(i>=117){
    add('noun',hu,en,`${a[0].toUpperCase()+a.slice(1)} ${hu} finom.`,`The ${en} is delicious.`);
  }else{
    add('noun',hu,en,`Hol van ${a} ${hu}?`,`Where is the ${en}?`);
  }
}
for(const [hu,en] of abstract){
  const a=article(hu);
  add('noun',hu,en,`${a[0].toUpperCase()+a.slice(1)} ${hu} fontos.`,`The ${en} is important.`);
}
const unsuitable=new Set(['meghalni','születni','betegedni','fáradni','utálni','aggódni']);
const verbExamples={
  'kérni':['Segítséget szeretnék kérni.','I would like to ask for help.'],
  'adni':['Ajándékot szeretnék adni.','I would like to give a present.'],
  'kapni':['Szeretnék választ kapni.','I would like to get an answer.'],
  'venni':['Kenyeret szeretnék venni.','I would like to buy bread.'],
  'eladni':['El szeretném adni az autót.','I would like to sell the car.'],
  'fizetni':['Kártyával szeretnék fizetni.','I would like to pay by card.'],
  'keresni':['Munkát szeretnék keresni.','I would like to look for work.'],
  'találni':['Szeretnék jó munkát találni.','I would like to find a good job.'],
  'választani':['Szeretnék egy könyvet választani.','I would like to choose a book.'],
  'kérdezni':['Szeretnék valamit kérdezni.','I would like to ask something.'],
  'mondani':['Szeretnék valamit mondani.','I would like to say something.'],
  'mutatni':['Szeretnék egy képet mutatni.','I would like to show a picture.'],
  'hozni':['Szeretnék vizet hozni.','I would like to bring water.'],
  'vinni':['Szeretnék könyvet vinni.','I would like to take a book.'],
  'tenni':['Szeretnék rendet tenni.','I would like to tidy up.'],
  'rakni':['Szeretnék mindent a helyére rakni.','I would like to put everything in its place.'],
  'hagyni':['Szeretnék egy üzenetet hagyni.','I would like to leave a message.'],
  'ismerni':['Szeretnék több embert ismerni.','I would like to know more people.'],
  'tudni':['Szeretném tudni az igazságot.','I would like to know the truth.'],
  'érteni':['Szeretném érteni a mondatot.','I would like to understand the sentence.'],
  'hallani':['Szeretném hallani a zenét.','I would like to hear the music.'],
  'nézni':['Szeretnék filmet nézni.','I would like to watch a film.'],
  'emlékezni':['Szeretnék erre emlékezni.','I would like to remember this.']
};
for(const [hu,en] of rows.filter(r=>r.type==='verb').flatMap(r=>r.items)){
  if(unsuitable.has(hu))continue;
  const bare=en.startsWith('to ')?en.slice(3):en;
  const example=verbExamples[hu]||[`${hu[0].toUpperCase()+hu.slice(1)} szeretnék.`,`I would like to ${bare}.`];
  add('verb',hu,en,...example);
}
const personAdjs=new Set(['fiatal','idős','öreg','egészséges','beteg','boldog','szomorú','vidám','kedves','barátságos','udvarias','durva','okos','buta','éhes','szomjas','fáradt']);
for(const [hu,en] of rows.filter(r=>r.type==='adjective').flatMap(r=>r.items)){
  const who=personAdjs.has(hu)?'Ő':'Ez';
  const meaning=en.split(' / ')[0];
  add('adjective',hu,en,`${who} nagyon ${hu}.`,`${who==='Ő'?'He or she':'This'} is very ${meaning}.`);
}
const advSentences={
  itt:['Itt vagyok.','I am here.'],ott:['Ott van a bolt.','The shop is there.'],ide:['Ide jövök.','I am coming here.'],oda:['Oda megyek.','I am going there.'],innen:['Innen indulok.','I am leaving from here.'],onnan:['Onnan jövök.','I am coming from there.'],
  most:['Most tanulok.','I am studying now.'],tegnap:['Tegnap dolgoztam.','I worked yesterday.'],soha:['Soha nem kések.','I am never late.'],gyakran:['Gyakran olvasok.','I often read.'],ritkán:['Ritkán eszem húst.','I rarely eat meat.'],néha:['Néha teát iszom.','I sometimes drink tea.'],általában:['Általában korán kelek.','I usually get up early.'],
  hamar:['Hamar visszajövök.','I will be back soon.'],későn:['Későn érkezem.','I arrive late.'],korán:['Korán kelek.','I get up early.'],már:['Már itt vagyok.','I am already here.'],még:['Még itt vagyok.','I am still here.'],újra:['Újra próbálom.','I am trying again.'],először:['Először eszem.','First I eat.'],azután:['Azután elindulok.','Afterwards I set off.'],
  együtt:['Együtt tanulunk.','We study together.'],külön:['Külön fizetünk.','We pay separately.'],egyedül:['Egyedül utazom.','I travel alone.'],gyorsan:['Gyorsan sétálok.','I walk quickly.'],lassan:['Lassan beszélek.','I speak slowly.'],jól:['Jól vagyok.','I am well.'],rosszul:['Rosszul vagyok.','I feel unwell.'],könnyen:['Könnyen tanulok.','I learn easily.'],nehezen:['Nehezen értem.','I understand with difficulty.'],csendesen:['Csendesen beszélek.','I speak quietly.'],hangosan:['Hangosan énekelek.','I sing loudly.'],
  közel:['Közel lakom.','I live nearby.'],messze:['Messze lakom.','I live far away.'],otthon:['Otthon dolgozom.','I work at home.'],kint:['Kint várok.','I wait outside.'],bent:['Bent vagyok.','I am inside.'],fent:['Fent van a könyv.','The book is upstairs.'],lent:['Lent van a táska.','The bag is downstairs.']
};
for(const [hu,en] of rows.filter(r=>r.type==='adverb').flatMap(r=>r.items)){
  if(!advSentences[hu])continue;
  add('adverb',hu,en,...advSentences[hu]);
}
for(const line of read('grammar-and-phrases.txt').split('\n')){
  if(!line||line.startsWith('#'))continue;
  const [pos,hu,en,exHu,exEn]=line.split('|');
  add(pos,hu,en,exHu,exEn);
}
const missing=Object.entries(counts).filter(([key,n])=>current[key]!==n);
if(missing.length)throw Error('Vocabulary quota mismatch: '+JSON.stringify({current,missing}));
if(result.length!==550)throw Error(`Expected 550 including 50 phrases, got ${result.length}`);
// Keep original IDs and prioritise the familiar 50, then interleave subjects
// so early sessions do not become almost entirely nouns.
const first=original.map(c=>c.id);
const buckets=Object.fromEntries(Object.keys(counts).map(pos=>[pos,result.filter(c=>!first.includes(c.id)&&posOf(c)===pos)]));
const cycle=['noun','verb','noun','adjective','verb','adverb','noun','phrase','verb','pronoun','conjunction','postposition','suffix'];
let priority=1;
for(const id of first){const c=result.find(c=>c.id===id);c.priority=priority++;}
while(Object.values(buckets).some(b=>b.length)){
  for(const pos of cycle){if(buckets[pos].length)buckets[pos].shift().priority=priority++;}
}
result.forEach(card=>{card.partOfSpeech??=posOf(card);card.level??=card.priority<=300?'A1':'A2';});
fs.writeFileSync(path.join(root,'dist','cards.json'),JSON.stringify(result,null,2)+'\n');
console.log('Generated',result.length,'cards:',JSON.stringify(current));
