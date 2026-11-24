import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=import.meta.dirname;
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const base=JSON.parse(read('content/italian-stories-original.json'));
const custom=JSON.parse(read('content/italian-stories-glossary.json'));
const context={window:{}};
for(const filename of ['content/italian-stories-expansion-a.js','content/italian-stories-expansion-b.js']){
  vm.runInNewContext(read(filename),context,{filename});
}
const extra=[...context.window.WordFlipItalianStoryExpansionA,...context.window.WordFlipItalianStoryExpansionB];
if(base.length!==10||extra.length!==30)throw new Error('Expected 10 original and 30 additional stories');

const normalize=w=>w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'').toLowerCase();
const originals={};
for(const story of base)for(const entry of story.words){
  const key=normalize(entry[0]);
  if(key&&!(key in originals))originals[key]=entry[1].replace(/[,.!?;:]+$/g,'');
}
const lexicon={...originals,...custom};
const missing=new Set();
const compiled=extra.map((story,i)=>{
  if(story.id!==i+11)throw new Error('Story ID progression is incorrect: '+story.id);
  const words=story.text.trim().split(/\s+/u).map(token=>{
    const gloss=lexicon[normalize(token)];
    if(!gloss){missing.add(normalize(token));return [token,''];}
    return [token,gloss];
  });
  if(words.length<110||words.length>220)throw new Error('Story length out of range: '+story.title+' '+words.length);
  return {id:story.id,title:story.title,subtitle:story.subtitle,level:story.level,topic:story.topic,words};
});
if(missing.size)throw new Error('Missing Italian glosses: '+[...missing].join(', '));
const levels=['pre-A1','A1-','A1','A1+','A1+/A2-','A2-','A2','B1'];
// Preserve newly authored graded stories already committed in dist.
 // The first 40 are regenerated from their maintained source collections;
 // additional IDs 41–50 are maintained in the checked-in story file.
const existingDist=path.join(root,'dist/italian-stories-data.js');
let extensions=[];
if(fs.existsSync(existingDist)){
  const data=read('dist/italian-stories-data.js');
  const match=data.match(/^window\\.WordFlipItalianStories=(.*);\\s*$/s);
  if(match){
    const current=JSON.parse(match[1]);
    extensions=current.filter(story=>story.id>=41).sort((a,b)=>a.id-b.id);
  }
}
const all=[...base.map(s=>({...s,level:'pre-A1',topic:'Everyday life'})),...compiled,...extensions];
if(all.length!==50||new Set(all.map(s=>s.id)).size!==50)throw Error('Italian stories must contain 50 unique IDs');
for(const story of all){
  if(!levels.includes(story.level))throw new Error('Invalid level: '+story.level);
  let open=0;
  for(const entry of story.words){
    if(entry[0].startsWith('«'))open++;
    if(entry[0].includes('»'))open--;
    if(open<0||open>1)throw new Error('Unbalanced quotations in '+story.title);
  }
  if(open)throw new Error('Unclosed quotation in '+story.title);
}
fs.writeFileSync(path.join(root,'dist/italian-stories-data.js'),'window.WordFlipItalianStories='+JSON.stringify(all)+';'+String.fromCharCode(10));
console.log('Compiled',all.length,'Italian stories,',all.reduce((n,s)=>n+s.words.length,0),'tappable words');
