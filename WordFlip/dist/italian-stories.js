(() => {
  'use strict';
  const collections={it:window.WordFlipItalianStories||[],hu:window.WordFlipHungarianStories||[]};
  let stories=collections.it,activeLanguage='it';
  const filters=document.getElementById('filters');
  const study=document.getElementById('study');
  const langSwitch=document.querySelector('.language-switch');
  if(!filters||!study||(!collections.it.length&&!collections.hu.length))return;

  // Language-specific activity hub: flashcards and reading are separate journeys.
  const hub=document.createElement('section');
  hub.id='wordflipActivityHome';hub.className='wordflip-activity-home';hub.hidden=true;
  hub.innerHTML='<div class="activity-intro"><span class="eyebrow">YOUR LEARNING SPACE</span><h1>What would you like to do?</h1><p>Choose how you would like to learn today.</p></div><div class="activity-actions"><button type="button" class="activity-practice"><span class="activity-action-title">Practice now <span aria-hidden="true">↗</span></span><small>Flashcards · words, phrases and grammar</small></button><button type="button" class="activity-stories"><span class="activity-action-title">Read stories <span aria-hidden="true">↗</span></span><small>Easy reading · tap to translate and listen</small></button></div>';
  study.insertAdjacentElement('beforebegin',hub);
  const practiceButton=hub.querySelector('.activity-practice');
  const readButton=hub.querySelector('.activity-stories');

  const root=document.createElement('section');
  root.id='wordflipStories';root.className='italian-stories';root.hidden=true;
  root.innerHTML='<div class="story-list-view"><div class="stories-intro"><span class="eyebrow">🇮🇹 LEARN THROUGH READING</span><h2>Little stories, big progress.</h2><p>Ten easy Italian stories. Tap any word to see what it means, then carry on reading.</p></div><div class="story-grid"></div></div><div class="story-read-view" hidden><button type="button" class="story-back">← All stories</button><div class="story-kicker"></div><h2 class="story-heading"></h2><div class="story-subheading"></div><div class="story-instructions">Tap a word to see its English meaning.</div><article class="story-text" lang="it" aria-label="Italian story"></article><div class="story-navigation"><button type="button" class="story-previous">← Previous</button><button type="button" class="story-next">Next story →</button></div></div>';
  study.insertAdjacentElement('afterend',root);
  const tooltip=document.createElement('div');
  tooltip.className='story-word-tooltip';tooltip.hidden=true;
  tooltip.setAttribute('role','status');tooltip.setAttribute('aria-live','polite');
  document.body.append(tooltip);
  let activeWord=null;
  let currentStory=-1;
  const savedKey=()=>`wordflip-${activeLanguage==='hu'?'hungarian':'italian'}-stories-read-v1`; 
  function readProgress(){try{return JSON.parse(localStorage.getItem(savedKey())||'[]');}catch{return [];}}
  function saveProgress(id){try{const seen=new Set(readProgress());seen.add(id);localStorage.setItem(savedKey(),JSON.stringify([...seen]));}catch{}}
  function currentLanguage(){return localStorage.getItem('wordflip-active-language');}
  function isSupported(){return ['it','hu'].includes(currentLanguage());}
  function dismiss(){tooltip.hidden=true;activeWord?.classList.remove('story-word-selected');activeWord=null; if('speechSynthesis' in window)window.speechSynthesis.cancel();}
  function position(word){
    const r=word.getBoundingClientRect();
    const width=tooltip.offsetWidth||170,height=tooltip.offsetHeight||65;
    const above=r.top>height+18;
    const left=Math.max(12,Math.min(window.innerWidth-width-12,r.left+r.width/2-width/2));
    tooltip.style.left=left+'px';
    tooltip.style.top=Math.max(8,Math.min(window.innerHeight-height-8,above?r.top-height-9:r.bottom+9))+'px';
  }
  function pronounce(word){
    if(!('speechSynthesis' in window))return;
    const text=word.textContent.replace(/^[^\p{L}]+|[^\p{L}]+$/gu,'').trim();
    if(!text)return;
    const lang=activeLanguage==='hu'?'hu-HU':'it-IT';
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang=lang;utterance.rate=.82;
    const voices=window.speechSynthesis.getVoices();
    const selected=voices.find(v=>v.lang.toLowerCase()===lang.toLowerCase())||
      voices.find(v=>v.lang.toLowerCase().startsWith(lang.slice(0,2).toLowerCase()));
    if(selected)utterance.voice=selected;
    window.speechSynthesis.speak(utterance);
  }
  function showGloss(word,meaning,parts){
    if(activeWord===word){dismiss();return;}
    dismiss();activeWord=word;word.classList.add('story-word-selected');
    tooltip.replaceChildren();
    const main=document.createElement('strong');main.textContent=meaning;
    const original=document.createElement('small');original.textContent=word.textContent;
    tooltip.append(main,original);
    if(Array.isArray(parts)&&parts.length){
      const table=document.createElement('div');table.className='story-word-breakdown';
      for(const [form,explanation] of parts){
        const row=document.createElement('div');row.className='story-word-part';
        const label=document.createElement('b');label.textContent=form;
        const meaning=document.createElement('span');meaning.textContent=explanation;
        row.append(label,meaning);table.append(row);
      }
      tooltip.append(table);
    }
    tooltip.hidden=false;position(word);
    pronounce(word);
  }
  function sentenceParagraphs(words){
    const paragraphs=[];let sentences=[],sentence=[];
    words.forEach((entry,i)=>{
      sentence.push(entry);
      if(/[.!?…]["”»']?$/.test(entry[0])||i===words.length-1){
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
      const top=document.createElement('span');top.className='story-choice-top';top.textContent='STORY '+String(i+1).padStart(2,'0')+' · EASY READING';
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
    root.querySelector('.story-kicker').textContent='STORY '+String(i+1).padStart(2,'0')+' OF '+stories.length+' · BEGINNER';
    root.querySelector('.story-heading').textContent=story.title;
    root.querySelector('.story-subheading').textContent=story.subtitle;
    const article=root.querySelector('.story-text');article.replaceChildren();
    sentenceParagraphs(story.words).forEach(paragraph=>{
      const p=document.createElement('p');
      paragraph.forEach(([original,meaning,parts],j)=>{
        if(j)p.append(document.createTextNode(' '));
        const word=document.createElement('button');word.type='button';word.className='story-word';
        word.textContent=original;word.setAttribute('aria-label',original+': show English translation');
        word.onclick=event=>{event.stopPropagation();showGloss(word,meaning,parts);};
        p.append(word);
      });
      article.append(p);
    });
    root.querySelector('.story-previous').disabled=i===0;
    const next=root.querySelector('.story-next');next.textContent=i===stories.length-1?'All stories →':'Next story →';
    saveProgress(story.id);
    window.scrollTo({top:0,behavior:'instant'});
  }
  function scrollTop(){window.scrollTo({top:0,behavior:'instant'});}
  function closeReading(){
    dismiss();root.querySelector('.story-read-view').hidden=true;
    root.querySelector('.story-list-view').hidden=false;
    renderList();scrollTop();
  }
  function hideStories(){
    dismiss();root.hidden=true;
    document.body.classList.remove('stories-view-open');
  }
  function hideHub(){
    hub.hidden=true;
    document.body.classList.remove('story-home-open');
  }
  function showHub(){
    hideStories();
    document.body.classList.remove('training','progress-view-open');
    document.body.classList.add('language-selected','story-home-open');
    hub.hidden=false;
    const code=currentLanguage();
    const name=code==='hu'?'Hungarian':code==='it'?'Italian':'Croatian';
    hub.querySelector('.activity-intro .eyebrow').textContent=(code==='hu'?'🇭🇺':code==='it'?'🇮🇹':'🇭🇷')+' '+name.toUpperCase();
    readButton.hidden=!isSupported();
    const summary=document.getElementById('summary');if(summary)summary.style.display='none';
    const progress=document.getElementById('learningProgress');if(progress){progress.hidden=true;}
    scrollTop();
  }
  function showStories(){
    if(!isSupported())return;
    activeLanguage=currentLanguage();
    stories=collections[activeLanguage];
    if(!stories?.length)return;
    const name=activeLanguage==='hu'?'Hungarian':'Italian';
    root.querySelector('.stories-intro .eyebrow').textContent=(activeLanguage==='hu'?'🇭🇺':'🇮🇹')+' LEARN THROUGH READING';
    root.querySelector('.stories-intro p').textContent='Ten easy '+name+' stories. Tap a word to hear it and see its English meaning'+(activeLanguage==='hu'?', with grammar breakdowns where useful.':'.');
    root.querySelector('.story-instructions').textContent='Tap a word for its translation and pronunciation'+(activeLanguage==='hu'?' — plus its endings when helpful.':'.');
    root.querySelector('.story-text').lang=activeLanguage;
    dismiss();
    hideHub();
    document.body.classList.remove('training');
    document.body.classList.add('language-selected','stories-view-open');
    root.hidden=false;
    root.querySelector('.story-read-view').hidden=true;
    root.querySelector('.story-list-view').hidden=false;
    renderList();scrollTop();
  }
  // Language choices open the activity hub instead of starting in flashcards.
  document.getElementById('languagePicker')?.addEventListener('click',event=>{
    if(event.target.closest('.language-choice'))showHub();
  });
  practiceButton.onclick=()=>{
    hideHub();hideStories();document.body.classList.add('training');scrollTop();
  };
  readButton.onclick=showStories;
  // Flashcards also offer a clear return route to the activity choices.
  const practiceBack=document.createElement('button');practiceBack.type='button';
  practiceBack.className='story-back activity-practice-back';practiceBack.textContent='← Activities';
  study.insertAdjacentElement('afterbegin',practiceBack);
  practiceBack.onclick=showHub;
  // The existing results-screen Return to menu button now returns to activities.
  document.getElementById('returnToMenu')?.addEventListener('click',showHub);
  const listBack=document.createElement('button');listBack.type='button';
  listBack.className='story-back story-library-back';listBack.textContent='← Back to activities';
  root.querySelector('.story-list-view').prepend(listBack);
  listBack.onclick=showHub;
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
  // The language flag returns to the language picker from any activity.
  langSwitch?.addEventListener('click',()=>{hideHub();hideStories();},false);
  const updateLanguage=()=>{
    if(!document.body.classList.contains('language-selected')){
      hideHub();hideStories();
    }
  };
  new MutationObserver(updateLanguage).observe(document.body,{attributes:true,attributeFilter:['class']});
})();