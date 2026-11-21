import fs from 'node:fs';

const source=[
  fs.readFileSync(new URL('./content/italian-core.txt',import.meta.url),'utf8'),
  fs.readFileSync(new URL('./content/italian-expansion.txt',import.meta.url),'utf8')
].join('\n');
const grammarLines=fs.readFileSync(new URL('./content/italian-grammar-words.txt',import.meta.url),'utf8').split(/\r?\n/);
const grammar={adverb:[],preposition:[]};
let grammarSection;
for(const raw of grammarLines){
  const line=raw.trim();
  if(line.startsWith('# adverbs'))grammarSection='adverb';
  else if(line.startsWith('# prepositions'))grammarSection='preposition';
  else if(line&&!line.startsWith('#'))grammar[grammarSection].push(line.split('|'));
}
const sections={noun:[],verb:[],adjective:[],function:[],phrase:[]};
let section;
for(const raw of source.split(/\r?\n/)){
  const line=raw.trim();
  if(line.startsWith('# article'))section='noun';
  else if(line.startsWith('# infinitive'))section='verb';
  else if(line.startsWith('# adjective'))section='adjective';
  else if(line.startsWith('# functional'))section='function';
  else if(line.startsWith('# phrases'))section='phrase';
  else if(line&&!line.startsWith('#')){
    const entry=line.split('|');
    if(!sections[section].some(existing=>existing[0]===entry[0]))sections[section].push(entry);
  }
}
const quotas={noun:280,verb:190,adjective:120,function:60,phrase:150};
for(const [kind,amount] of Object.entries(quotas))if(sections[kind].length<amount)throw Error(`${kind}: expected ${amount}, got ${sections[kind].length}`);

// Preserve every previously issued ID so existing Italian review records survive expansion.
let oldCards=[];
try{oldCards=JSON.parse(fs.readFileSync(new URL('./dist/italian-cards.json',import.meta.url),'utf8'));}catch{}
const previousIds=new Map(oldCards.map(c=>[`${c.category}\u0000${c.it}`,c.id]));
const nextId={};
for(const c of oldCards){
  const number=Number(c.id.match(/-(\d+)$/)?.[1]||0);
  nextId[c.category]=Math.max(nextId[c.category]||0,number);
}
const cards=[];
const add=(type,it,en,exampleIt,exampleEn,extra={})=>{
  const key=`${type}\u0000${it}`;
  const id=previousIds.get(key)||`it-${type}-${nextId[type]=(nextId[type]||0)+1}`;
  cards.push({id,category:type,it,en,exampleIt,exampleEn,priority:0,level:'A1–A2',...extra});
};

for(const [it,en] of sections.noun.slice(0,quotas.noun)){
  const article=it.split(' ')[0];
  if(!/^(il|lo|la|l')/.test(article)){
    add('word',it,en,`${it[0].toUpperCase()}${it.slice(1)} sono qui.`,`${en[0].toUpperCase()}${en.slice(1)}, I am here.`,{partOfSpeech:'adverb'});
    continue;
  }
  const feminineElisions=new Set(["l'acqua","l'arancia","l'insalata","l'università","l'idea","l'ora","l'estate","l'isola","l'entrata","l'uscita","l'amica","l'età","l'erba","l'attenzione","l'immagine","l'opinione","l'abitudine","l'aria","l'amicizia","l'arte","l'esperienza"]);
  const gender=article==='la'||feminineElisions.has(it)?'feminine':'masculine';
  add('word',it,`the ${en}`,`Cerco ${it}.`,`I'm looking for the ${en}.`,{partOfSpeech:'noun',article,gender});
}
for(const [it,en] of sections.verb.slice(0,quotas.verb)){
  const gloss=en.split(' / ')[0];
  const reflexive=it.endsWith('si');
  const infinitive=reflexive?it.slice(0,-2)+'mi':it;
  add('word',it,`to ${en}`,`Voglio ${infinitive}.`,`I want to ${gloss}.`,{partOfSpeech:'verb'});
}
for(const [it,en] of sections.adjective.slice(0,quotas.adjective)){
  const gloss=en.split(' / ')[0];
  add('word',it,en,`È ${it}.`,`It is ${gloss}.`,{partOfSpeech:'adjective',note:'Masculine singular form'});
}
for(const [it,en,exampleIt,exampleEn] of sections.function.slice(0,quotas.function)){
  const commonPrepositions=new Set(['con','senza','per','a','di','da','in','su','tra','prima','dopo','nonostante','oltre','verso']);
  const commonAdverbs=new Set(['anche','non','sempre','mai','qui','lì','molto','poco','allora','comunque','quindi','invece','infatti','magari','forse','probabilmente','certamente','ovviamente','proprio','appena','ancora','già','soltanto','quasi','insieme','subito','intanto','piuttosto','abbastanza','troppo','almeno','perfino','neanche']);
  const partOfSpeech=commonPrepositions.has(it)?'preposition':commonAdverbs.has(it)?'adverb':'function word';
  add('word',it,en,exampleIt,exampleEn,{partOfSpeech});
}
for(const [it,en] of sections.phrase.slice(0,quotas.phrase))add('phrase',it,en,it,en);
// The conversational corpus is kept as source data so regenerated builds retain
// stable IDs, topics, proficiency levels and the original translations.
function parseCsv(input){
  const rows=[];let row=[],value='',quoted=false;
  for(let i=0;i<input.length;i++){
    const ch=input[i];
    if(ch==='"'){
      if(quoted&&input[i+1]==='"'){value+='"';i++;}else quoted=!quoted;
    }else if(ch===','&&!quoted){row.push(value);value='';}
    else if((ch==='\n'||ch==='\r')&&!quoted){
      if(ch==='\r'&&input[i+1]==='\n')i++;
      row.push(value);if(row.some(Boolean))rows.push(row);row=[];value='';
    }else value+=ch;
  }
  row.push(value);if(row.some(Boolean))rows.push(row);
  const headers=rows.shift().map(h=>h.replace(/^\uFEFF/,''));
  return rows.map(fields=>Object.fromEntries(headers.map((h,i)=>[h,fields[i]||''])));
}
const phraseTopics={
  'Greetings and politeness':'everyday','Introductions and meeting people':'social',
  'Understanding and asking questions':'everyday','Family and relatives':'family',
  'Keeping in touch with family':'family','School and children':'family',
  'Work and everyday projects':'everyday','Home, moving and neighbourhood':'everyday',
  'Birthdays and congratulations':'celebrations','Easter and spring celebrations':'celebrations',
  'Christmas and New Year':'celebrations','Small talk and weather':'social',
  'Opinions and interests':'social','Making plans and invitations':'social',
  'Restaurants and reservations':'food','Cafés, bars and bakeries':'food',
  'Shopping and clothes':'shopping','Supermarkets and markets':'shopping',
  'Directions around town':'travel','Trains, buses and taxis':'travel',
  'Hotels and accommodation':'travel','Sightseeing and leisure':'travel',
  'Health, problems and practical help':'help','Everyday time and routines':'everyday',
  'Phones, messages and communication':'everyday'
};
const normalisePhrase=s=>s.toLocaleLowerCase('it').normalize('NFC').replace(/[.!?…’'“”\s]+/g,' ').trim();
const seenPhrase=new Set(cards.filter(c=>c.category==='phrase').map(c=>normalisePhrase(c.it)));
let duplicatePhrases=0;
for(const row of parseCsv(fs.readFileSync(new URL('./content/italian-conversational-1000.csv',import.meta.url),'utf8'))){
  if(!row.italian||!row.english)throw Error(`Missing translation in ${row.id}`);
  const key=normalisePhrase(row.italian);
  if(seenPhrase.has(key)){duplicatePhrases++;continue;}
  seenPhrase.add(key);
  const topic=phraseTopics[row.category]||'everyday';
  add('phrase',row.italian,row.english,row.italian,row.english,{
    topic,level:row.cefr_level||'A1',register:row.register,
    grammarFocus:row.grammar_focus,sourceCategory:row.category,
    corpusId:row.id
  });
}
for(const card of cards.filter(c=>c.category==='phrase'&&!c.topic)){
  const text=`${card.it} ${card.en}`.toLowerCase();
  card.topic=/famigl|madre|padre|figli|mother|father|family|sister|brother/.test(text)?'family':
    /ristorant|caffè|mang|bevo|pizza|restaurant|coffee|eat|drink/.test(text)?'food':
    /quanto cost|negozio|compr|shop|buy|cost/.test(text)?'shopping':
    /stazion|treno|autobus|strada|train|station|street/.test(text)?'travel':
    /auguri|compleanno|natale|birthday|christmas/.test(text)?'celebrations':
    /aiut|problema|help|problem/.test(text)?'help':
    /amico|piacere|come stai|friend|how are/.test(text)?'social':'everyday';
  card.level='A1';
}
for(const [it,en,exampleIt,exampleEn] of grammar.adverb){
  if(!cards.some(c=>c.category==='word'&&c.it===it))add('word',it,en,exampleIt,exampleEn,{partOfSpeech:'adverb'});
}
for(const [it,en,exampleIt,exampleEn] of grammar.preposition){
  add('preposition',it,en,exampleIt,exampleEn,{partOfSpeech:'preposition'});
}

const conjugations={
  essere:['to be','sono','sei','è','siamo','siete','sono'],
  avere:['to have','ho','hai','ha','abbiamo','avete','hanno'],
  andare:['to go','vado','vai','va','andiamo','andate','vanno'],
  fare:['to do / make','faccio','fai','fa','facciamo','fate','fanno'],
  parlare:['to speak','parlo','parli','parla','parliamo','parlate','parlano'],
  mangiare:['to eat','mangio','mangi','mangia','mangiamo','mangiate','mangiano'],
  bere:['to drink','bevo','bevi','beve','beviamo','bevete','bevono'],
  potere:['to be able to','posso','puoi','può','possiamo','potete','possono'],
  volere:['to want','voglio','vuoi','vuole','vogliamo','volete','vogliono'],
  sapere:['to know','so','sai','sa','sappiamo','sapete','sanno']
};
const people=['I','you (singular)','he / she','we','you (plural)','they'];
const italianPeople=['io','tu','lui / lei','noi','voi','loro'];
const englishForms={
  essere:['I am','you are','he / she is','we are','you are (plural)','they are'],
  avere:['I have','you have','he / she has','we have','you have (plural)','they have'],
  andare:['I go','you go','he / she goes','we go','you go (plural)','they go'],
  fare:['I make','you make','he / she makes','we make','you make (plural)','they make'],
  parlare:['I speak','you speak','he / she speaks','we speak','you speak (plural)','they speak'],
  mangiare:['I eat','you eat','he / she eats','we eat','you eat (plural)','they eat'],
  bere:['I drink','you drink','he / she drinks','we drink','you drink (plural)','they drink'],
  potere:['I can','you can','he / she can','we can','you can (plural)','they can'],
  volere:['I want','you want','he / she wants','we want','you want (plural)','they want'],
  sapere:['I know','you know','he / she knows','we know','you know (plural)','they know']
};
const contexts={
  essere:['qui','here'],avere:['tempo','time'],andare:['a casa','home'],
  fare:['una torta','a cake'],parlare:['italiano','Italian'],
  mangiare:['una mela','an apple'],bere:['acqua','water'],
  potere:['entrare','come in'],volere:['un caffè','a coffee'],
  sapere:['la risposta','the answer']
};
for(const [inf,[meaning,...forms]] of Object.entries(conjugations))forms.forEach((form,i)=>{
  const [italianContext,englishContext]=contexts[inf];
  const englishForm=englishForms[inf][i];
  const italianPronoun=italianPeople[i];
  const englishExample=`${englishForm.replace('he / she','he').replace(' (plural)','')} ${englishContext}.`;
  const examplePronoun=italianPronoun==='lui / lei'?'Lui':`${italianPronoun[0].toUpperCase()}${italianPronoun.slice(1)}`;
  const italianExample=`${examplePronoun} ${form} ${italianContext}.`;
  add('verb',`${inf} · ${people[i]} · present`,form,italianExample,`${englishExample[0].toUpperCase()}${englishExample.slice(1)}`,{person:people[i],infinitive:inf,meaning,form,tense:'present',italianPronoun,englishForm});
});

// Gender drills are deliberately independent from ordinary vocabulary recall.
for(const noun of cards.filter(c=>c.category==='word'&&c.partOfSpeech==='noun').slice(0,60)){
  add('article',noun.en.replace(/^the /,''),noun.it,`Articolo: ${noun.it}`,`Article: ${noun.en}`,{article:noun.article,gender:noun.gender});
}

// Interleave the earliest training items across word types and practical speech.
// This prevents the first 100 unlocked cards from being entirely nouns.
const groupOf=c=>c.category==='word'?c.partOfSpeech==='noun'?'noun':c.partOfSpeech==='verb'?'vocabularyVerb':c.partOfSpeech==='adjective'?'adjective':c.partOfSpeech==='adverb'?'adverb':c.partOfSpeech==='preposition'?'preposition':'function':c.category;
const groups={noun:[],vocabularyVerb:[],adjective:[],adverb:[],function:[],phrase:[],verb:[],article:[],preposition:[]};
for(const card of cards)groups[groupOf(card)].push(card);
// A1 material is introduced before A2 in Automatic mode; targeted A2 study
// remains available immediately through the Phrases drawer.
groups.phrase.sort((a,b)=>(a.level==='A2')-(b.level==='A2'));
const pattern=['noun','vocabularyVerb','phrase','adjective','preposition','noun','vocabularyVerb','phrase','verb','adverb','adjective','phrase','function'];
let cursor=0,priority=1;
const activeCount=cards.filter(c=>c.category!=='article').length;
while(priority<=activeCount){
  const key=pattern[cursor++%pattern.length];
  const next=groups[key].shift();
  if(next)next.priority=priority++;
}
// Retired standalone article drills are retained with their original IDs, but
// placed last and excluded from ordinary practice. Noun cards retain articles.
for(const card of groups.article)card.priority=priority++;

fs.writeFileSync(new URL('./dist/italian-cards.json',import.meta.url),JSON.stringify(cards,null,2)+'\n');
const tally=Object.fromEntries(['word','phrase','verb','preposition','article'].map(k=>[k,cards.filter(c=>c.category===k).length]));
console.log('Italian cards:',tally);
console.log('Conversation corpus duplicates omitted:',duplicatePhrases);
