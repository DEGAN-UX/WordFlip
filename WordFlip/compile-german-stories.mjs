import fs from 'node:fs';
import vm from 'node:vm';

const source=name=>fs.readFileSync(new URL('./content/'+name,import.meta.url),'utf8');
const original=JSON.parse(source('german-stories-original.json'));
const extensions=JSON.parse(source('german-stories-01-06-expansions.json'));
if(original.length!==6||extensions.length!==6)throw Error('Expected six original German stories and six extensions.');
const first=original.map((story,i)=>{
  if(extensions[i].id!==story.id)throw Error('Mismatched original story id');
  return {...story,words:[...story.words,...extensions[i].words]};
});
const context={window:{}};
const files=[
  ['german-stories-07-12.js','WordFlipGermanStoriesBatchA'],
  ['german-stories-13-18.js','WordFlipGermanStoriesBatchB'],
  ['german-stories-19-24.js','WordFlipGermanStoriesBatchC'],
  ['german-stories-25-30.js','WordFlipGermanStoriesBatchD']
];
const rest=[];
for(const [filename,global] of files){
  vm.runInNewContext(source(filename),context,{filename});
  const batch=Array.from(context.window[global]||[]);
  if(batch.length!==6)throw Error('Expected six stories in '+filename);
  rest.push(...batch);
}
// Retain stories 31–50 from the checked-in collection when recompiling the
// original 30 curated German stories. Build output must never shrink the corpus.
const distUrl=new URL('./dist/german-stories-data.js',import.meta.url);
let extensions31to50=[];
if(fs.existsSync(distUrl)){
  const content=fs.readFileSync(distUrl,'utf8');
  const match=content.match(/^window\.WordFlipGermanStories=(.*);\s*$/s);
  if(match)extensions31to50=JSON.parse(match[1]).filter(item=>item.id>=31).sort((a,b)=>a.id-b.id);
}
const stories=[...first,...rest,...extensions31to50];
if(stories.length!==50||new Set(stories.map(s=>s.id)).size!==50)throw Error('German story count must be 50 unique stories');
const allowedLevels=new Set(['A2','A2+','B1','B1+','B2']);
for(const [i,story] of stories.entries()){
  if(story.id!==i+1)throw Error('German story IDs must be consecutive');
  if(!allowedLevels.has(story.level))throw Error('Unexpected CEFR difficulty at story '+story.id);
  if(!story.title||!story.subtitle||!story.topic||story.words.length<90)throw Error('Incomplete/short German story '+story.id);
  let quoteBalance=0;
  for(const item of story.words){
    if(!Array.isArray(item)||item.length!==2||!item[0].trim()||!item[1].trim())throw Error('Missing word/translation in story '+story.id);
    if(item[0].includes('«'))quoteBalance++;
    if(item[0].includes('»'))quoteBalance--;
    if(quoteBalance<0||quoteBalance>1)throw Error('Unbalanced quotation marks in story '+story.id);
  }
  if(quoteBalance)throw Error('Unclosed quotation in story '+story.id);
}
fs.writeFileSync(new URL('./dist/german-stories-data.js',import.meta.url),
  'window.WordFlipGermanStories='+JSON.stringify(stories)+';\n');
console.log('Compiled',stories.length,'German stories,',stories.reduce((n,s)=>n+s.words.length,0),'tappable words; B1 to B2.');
