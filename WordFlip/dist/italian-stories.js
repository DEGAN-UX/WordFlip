(() => {
  'use strict';
  const stories=window.WordFlipItalianStories||[];
  const filters=document.getElementById('filters');
  const study=document.getElementById('study');
  const langSwitch=document.querySelector('.language-switch');
  if(!filters||!study||!stories.length)return;

  const pill=document.createElement('button');
  pill.type='button';pill.className='pill stories-pill';pill.textContent='Stories';
  pill.setAttribute('aria-label','Read Italian stories');
  filters.append(pill);

  const root=document.createElement('section');
  root.id='italianStories';root.className='italian-stories';root.hidden=true;
  root.innerHTML='<div class="story-list-view"><div class="stories-intro"><span class="eyebrow">🇮🇹 LEARN THROUGH READING</span><h2>Little stories, big progress.</h2><p>Ten easy Italian stories. Tap any word to see what it means, then carry on reading.</p></div><div class="story-grid"></div></div><div class="story-read-view" hidden><button type="button" class="story-back">← All stories</button><div class="story-kicker"></div><h2 class="story-heading"></h2><div class="story-subheading"></div><div class="story-instructions">Tap a word to see its English meaning.</div><article class="story-text" lang="it" aria-label="Italian story"></article><div class="story-navigation"><button type="button" class="story-previous">← Previous</button><button type="button" class="story-next">Next story →</button></div></div>';
  filters.insertAdjacentElement('afterend',root);
  const tooltip=document.createElement('div');
  tooltip.className='story-word-tooltip';tooltip.hidden=true;
  tooltip.setAttribute('role','status');tooltip.setAttribute('aria-live','polite');
  document.body.append(tooltip);
  let activeWord=null;
  let currentStory=-1;
  const savedKey='wordflip-italian-stories-read-v1';
  function readProgress(){try{return JSON.parse(localStorage.getItem(savedKey)||'[]');}catch{return [];}}
  function saveProgress(id){try{const seen=new Set(readProgress());seen.add(id);localStorage.setItem(savedKey,JSON.stringify([...seen]));}catch{}}
  function isItalian(){return localStorage.getItem('wordflip-active-language')==='it';}
  function dismiss(){tooltip.hidden=true;activeWord?.classList.remove('story-word-selected');activeWord=null;}
  function position(word){
    const r=word.getBoundingClientRect();
    const width=tooltip.offsetWidth||170,height=tooltip.offsetHeight||65;
    const above=r.top>height+18;
    const left=Math.max(12,Math.min(window.innerWidth-width-12,r.left+r.width/2-width/2));
    tooltip.style.left=left+'px';
    tooltip.style.top=(above?r.top-height-9:r.bottom+9)+'px';
  }
  function showGloss(word,meaning){
    if(activeWord===word){dismiss();return;}
    dismiss();activeWord=word;word.classList.add('story-word-selected');
    tooltip.replaceChildren();
    const main=document.createElement('strong');main.textContent=meaning;
    const original=document.createElement('small');original.textContent=word.textContent;
    tooltip.append(main,original);tooltip.hidden=false;position(word);
  }
  function sentenceParagraphs(words){
    const paragraphs=[];let sentences=[],sentence=[];
    words.forEach((entry,i)=>{
      sentence.push(entry);
      if(/[.!?…]["”']?$/.test(entry[0])||i===words.length-1){
        sentences.push(sentence);sentence=[];
        if(sentences.length===3||i===words.length-1){
          paragraphs.push(sentences.flat());sentences=[];
        }
      }
    });
    return paragraphs;
  }
  function renderList(){
    const grid=root.querySelector('.story-grid');grid.replaceChildren();
    const visited=new Set(readProgress());
    stories.forEach((story,i)=>{
      const button=document.createElement('button');button.type='button';button.className='story-choice';
      const top=document.createElement('span');top.className='story-choice-top';top.textContent='STORY '+String(i+1).padStart(2,'0')+' · ABOUT 5 MIN';
      const title=document.createElement('strong');title.textContent=story.title;
      const en=document.createElement('span');en.className='story-choice-subtitle';en.textContent=story.subtitle;
      const status=document.createElement('span');status.className='story-choice-status';status.textContent=visited.has(story.id)?'Read again ↗':'Read story ↗';
      button.append(top,title,en,status);button.onclick=()=>openStory(i);grid.append(button);
    });
  }
  function openStory(i){
    const story=stories[i];if(!story)return;
    dismiss();currentStory=i;
    root.querySelector('.story-list-view').hidden=true;
    root.querySelector('.story-read-view').hidden=false;
    root.querySelector('.story-kicker').textContent='STORY '+String(i+1).padStart(2,'0')+' OF '+stories.length+' · PRE-A1 · ABOUT 5 MIN';
    root.querySelector('.story-heading').textContent=story.title;
    root.querySelector('.story-subheading').textContent=story.subtitle;
    const article=root.querySelector('.story-text');article.replaceChildren();
    sentenceParagraphs(story.words).forEach(paragraph=>{
      const p=document.createElement('p');
      paragraph.forEach(([original,meaning],j)=>{
        if(j)p.append(document.createTextNode(' '));
        const word=document.createElement('button');word.type='button';word.className='story-word';
        word.textContent=original;word.setAttribute('aria-label',original+': show English translation');
        word.onclick=event=>{event.stopPropagation();showGloss(word,meaning);};
        p.append(word);
      });
      article.append(p);
    });
    root.querySelector('.story-previous').disabled=i===0;
    const next=root.querySelector('.story-next');next.textContent=i===stories.length-1?'All stories →':'Next story →';
    saveProgress(story.id);
    window.scrollTo({top:0,behavior:'instant'});
  }
  function closeReading(){dismiss();root.querySelector('.story-read-view').hidden=true;root.querySelector('.story-list-view').hidden=false;renderList();window.scrollTo({top:0,behavior:'instant'});}
  function showStories(){
    if(!isItalian())return;
    dismiss();document.body.classList.add('stories-view-open');
    root.hidden=false;study.classList.remove('hidden');
    document.querySelectorAll('#filters .pill').forEach(p=>p.classList.toggle('active',p===pill));
    renderList();closeReading();
  }
  function hideStories(){
    if(root.hidden)return;
    dismiss();root.hidden=true;document.body.classList.remove('stories-view-open');
  }
  pill.onclick=showStories;
  filters.addEventListener('click',event=>{if(event.target.closest('[data-category]'))hideStories();},true);
  root.querySelector('.story-back').onclick=closeReading;
  root.querySelector('.story-previous').onclick=()=>openStory(currentStory-1);
  root.querySelector('.story-next').onclick=()=>currentStory<stories.length-1?openStory(currentStory+1):closeReading();
  document.addEventListener('pointerdown',event=>{
    if(tooltip.hidden)return;
    if(event.target.closest('.story-word')===activeWord)return;
    dismiss();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')dismiss();});
  window.addEventListener('scroll',dismiss,{passive:true});
  window.addEventListener('resize',dismiss,{passive:true});
  langSwitch?.addEventListener('click',hideStories,true);
  const updatePill=()=>{pill.hidden=!isItalian();if(!isItalian())hideStories();};
  new MutationObserver(updatePill).observe(langSwitch||document.body,{attributes:true,attributeFilter:['aria-label']});
  updatePill();
})();