import fs from 'node:fs';
import vm from 'node:vm';

const source=name=>fs.readFileSync(new URL('./content/'+name,import.meta.url),'utf8');
const original=JSON.parse(source('german-stories-original.json'));
const extensions=JSON.parse(source('german-stories-01-06-expansions.json'));
if(original.length!==6||extensions.length!==6)throw Error('Expected six original German stories and six extensions.');
const first=original.map((story,i)=>{
  if(extensions[i].id!==story.id)throw Error('Mismatched original story id');
  return {...story,level:'B1',words:[...story.words,...extensions[i].words]};
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
const stories=[...first,...rest];
if(stories.length!==30)throw Error('German story count must be 30');
const levelFor=i=>i<12?'B1':i<18?'B1+':i<24?'B2-':'B2';
for(const [i,story] of stories.entries()){
  if(story.id!==i+1)throw Error('German story IDs must be consecutive');
  if(story.level!==levelFor(i))throw Error('Unexpected CEFR difficulty at story '+story.id);
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
