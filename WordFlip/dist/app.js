(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const names = {word:'WORD',suffix:'SUFFIX',verb:'PRESENT TENSE',phrase:'PHRASE',article:'ARTICLES & GENDER',preposition:'PREPOSITION',case:'CASE PRACTICE',order:'WORD ORDER'};
  const languages={hu:{name:'Hungarian',flag:'🇭🇺',code:'HU',data:'cards.json'},it:{name:'Italian',flag:'🇮🇹',code:'IT',data:'italian-cards.json'},hr:{name:'Croatian',flag:'🇭🇷',code:'HR',data:'croatian-cards.json'},de:{name:'German',flag:'🇩🇪',code:'DE',data:'german-cards.json'}};
  let language=['hu','it','hr','de'].includes(localStorage.getItem('wordflip-active-language'))?localStorage.getItem('wordflip-active-language'):'hu';
  let engine=window.WordFlipEngines[language];
  const pronouns = {
    'én':'I','te':'you (singular)','ő':'he / she / it',
    'mi':'we','ti':'you (plural)','ők':'they'
  };
  const infinitives = {
    'menni':'to go','enni':'to eat','olvasni':'to read','látni':'to see',
    'szeretni':'to like / love','beszélni':'to speak','inni':'to drink',
    'lenni':'to be','venni':'to buy','tanulni':'to learn'
  };
  const promptHint=document.createElement('div');
  promptHint.className='prompt-hint';
  $('frontText').insertAdjacentElement('afterend',promptHint);
  let cards=[], category='all', queue=[], index=0, knew=0, recognised=0, missed=0, flipped=false, correctRun=0, bestRun=0;
  const phraseTopics=[['everyday','Everyday conversation'],['family','Family & friends'],['food','Food & restaurants'],['shopping','Shopping'],['travel','Getting around & travel'],['social','Small talk & socialising'],['celebrations','Celebrations & holidays'],['help','Problems & practical help']];
  const phraseSettingsKey=()=>`wordflip-${language==='hr'?'croatian':language==='de'?'german':'italian'}-phrase-topics-v1`;
  const phraseLevelsKey=()=>`wordflip-${language==='hr'?'croatian':language==='de'?'german':'italian'}-phrase-level-v1`;
  const savedPhraseTopics=()=>{try{const values=JSON.parse(localStorage.getItem(phraseSettingsKey()));return Array.isArray(values)&&values.length?values.filter(t=>phraseTopics.some(([id])=>id===t)):phraseTopics.map(([id])=>id);}catch{return phraseTopics.map(([id])=>id);}};
  let activePhraseTopics=savedPhraseTopics();
  let activePhraseLevel=localStorage.getItem(phraseLevelsKey())||'all';
  const cheatsheet=window.WordFlipCheatsheet;
  const cheatOptions=document.createElement('div');cheatOptions.id='cheatsheetOptions';cheatOptions.className='cheatsheet-options';
  promptHint.insertAdjacentElement('afterend',cheatOptions);
  const cardHint=$('frontText').parentElement.querySelector('.hint');
  const newCardCorner=document.createElement('span');
  newCardCorner.className='new-card-corner';
  newCardCorner.innerHTML='<span>NEW</span>';
  newCardCorner.setAttribute('aria-label','First time seeing this card');
  newCardCorner.hidden=true;
  $('frontText').parentElement.append(newCardCorner);
  let cheatAnswered=false;
  let speechSequence=0, speechGapTimer=null;
  function stopSpeech(){
    speechSequence++;
    clearTimeout(speechGapTimer);
    speechGapTimer=null;
    if('speechSynthesis'in window)speechSynthesis.cancel();
  }
  const audioPauseKey='wordflip-auto-audio-pause-until-v1';
  const autoAudioPaused=()=>Number(localStorage.getItem(audioPauseKey)||0)>Date.now();
  const vibrationAvailable=typeof navigator.vibrate==='function';
  const vibrationKey='wordflip-haptics-v1';
  function vibrate(kind){
    if(!vibrationAvailable||localStorage.getItem(vibrationKey)==='off')return;
    const pattern={flip:8,knew:[15,40,15],recognised:14,again:25,milestone:[15,35,15,35,15],finish:[15,45,15,45,25]}[kind];
    if(pattern)try{navigator.vibrate(pattern);}catch{}
  }
  let history={};
  const loadHistory=()=>{try{return JSON.parse(localStorage.getItem(engine.storageKey)||'{}');}catch{return {};}};
  history=loadHistory();
  const save=()=>localStorage.setItem(engine.storageKey,JSON.stringify(history));
  const directionOf=c=>c.reverse?`en-${language}`:`${language}-en`;
  const keyOf=(c,dir)=>c.progressKey||c.id+':'+dir;
  const progressFor=(c,dir)=>history[keyOf(c,dir)]||{streak:0,reviews:0,due:0};
  const reducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The large glossy bar belongs to the results screen, not the practice view.
  const resultsProgress=document.createElement('div');
  resultsProgress.className='results-progress';
  resultsProgress.innerHTML='<div class="results-progress-label">You’re getting better!</div><div class="results-track" aria-hidden="true"><div class="results-fill"></div></div>';
  $('again').insertAdjacentElement('beforebegin',resultsProgress);
  let resultsFrame=0;
  let milestoneTimer;
  const milestone=document.createElement('div');
  milestone.className='learning-milestone';milestone.setAttribute('role','status');milestone.setAttribute('aria-live','polite');
  document.body.append(milestone);
  let newContentTimer;
  const newContentToast=document.createElement('div');
  newContentToast.className='new-content-toast';
  newContentToast.setAttribute('role','status');newContentToast.setAttribute('aria-live','polite');
  document.body.append(newContentToast);
  function announceNewContent(session){
    clearTimeout(newContentTimer);
    newContentToast.classList.remove('visible');
    const unseen=new Set();
    for(const item of session){
      if(item.record){
        const r=item.record;
        if(!['recognition','recall','application'].some(type=>(history[cheatsheet.key(r,type)]?.reviews||0)>0))unseen.add(r.id);
      }else if(item.isNew){unseen.add(item.id);}
    }
    const automatic=category==='all'&&$('direction').value==='auto';
    let unlocked=[];
    if(automatic){
      const key=`wordflip-pool-admitted-${language}-v1`;
      let previous=null;
      try{previous=JSON.parse(localStorage.getItem(key)||'null');}catch{}
      const result=window.WordFlipPoolAnnouncements.update(previous,cards,session,engine.unlocked(cards,history),true);
      unlocked=result.unlocked;
      try{localStorage.setItem(key,JSON.stringify(result.state));}catch{}
    }
    if(unlocked.length){
      const lines=window.WordFlipPoolAnnouncements.summary(unlocked,language,phraseTopics);
      newContentToast.textContent=`✦ New material unlocked!\n${lines.join(' · ')}`;
    }else if(unseen.size){
      newContentToast.textContent=`✦ ${unseen.size} new ${unseen.size===1?'card':'cards'} in this session`;
    }else return;
    void newContentToast.offsetWidth;
    newContentToast.classList.add('visible');
    newContentTimer=setTimeout(()=>newContentToast.classList.remove('visible'),3300);
  }
  let firstWinCount=0,firstWinTimer;
  const firstWin=document.createElement('div');
  firstWin.className='first-win';firstWin.setAttribute('role','status');firstWin.setAttribute('aria-live','polite');
  document.body.append(firstWin);
  function celebrateFirstWin(){
    firstWinCount++;
    clearTimeout(firstWinTimer);
    const rect=$('card').getBoundingClientRect();
    firstWin.textContent=window.WordFlipFirstWin.phrase(firstWinCount-1);
    firstWin.style.top=`${Math.max(20,rect.top+Math.min(90,rect.height*.18))}px`;
    firstWin.style.left=`${rect.left+rect.width/2}px`;
    firstWin.classList.remove('visible');void firstWin.offsetWidth;
    firstWin.classList.add('visible');
    firstWinTimer=setTimeout(()=>firstWin.classList.remove('visible'),1050);
  }
  function celebrateMilestone(message){
    vibrate('milestone');
    clearTimeout(milestoneTimer);
    milestone.textContent=message;milestone.classList.remove('visible');
    void milestone.offsetWidth;milestone.classList.add('visible');
    milestoneTimer=setTimeout(()=>milestone.classList.remove('visible'),1700);
  }
  function feedback(rating,button){
    correctRun=rating==='knew'?correctRun+1:0;
    bestRun=Math.max(bestRun,correctRun);
    vibrate(rating);
    if(reducedMotion())return;
    const marker=document.createElement('div');
    marker.className='rating-feedback '+rating;
    const milestoneRun=rating==='knew'&&[3,5,10,20].includes(correctRun)?correctRun:0;
    marker.textContent=milestoneRun?`${milestoneRun}×`:rating==='knew'?'✓':rating==='recognised'?'◐':'↻';
    const rect=rating==='knew'?$('card').getBoundingClientRect():button.getBoundingClientRect();
    marker.style.left=`${rect.left+rect.width/2}px`;
    marker.style.top=`${rect.top+rect.height/2}px`;
    if(rating==='knew')marker.classList.add('card-centred');
    if(milestoneRun)marker.classList.add('streak-celebration',`streak-${milestoneRun}`);
    document.body.append(marker);
    marker.addEventListener('animationend',()=>marker.remove(),{once:true});
    setTimeout(()=>marker.remove(),milestoneRun?1350:750);
  }
  function countTo(element,value){
    if(reducedMotion()||!value){element.textContent=value;return;}
    const start=performance.now(),duration=500;
    const tick=now=>{
      if($('summary').style.display!=='block')return;
      const t=Math.min(1,(now-start)/duration);
      element.textContent=Math.round(value*(1-(1-t)**2));
      if(t<1)requestAnimationFrame(tick);
    };
    element.textContent='0';requestAnimationFrame(tick);
  }
  function start(){
    queue=language==='hu'&&category==='cheatsheet'?cheatsheet.createSession(history,cheatsheet.enabled(),Number($('length').value)):
      window.WordFlipAdaptive.createSession({
      cards,history,engine,language,category,direction:$('direction').value,
      length:Number($('length').value),pace:$('learningPace').value,verbMode:$('verbMode').value,
      phraseTopics:activePhraseTopics,phraseLevel:activePhraseLevel
    });
    index=0;knew=0;recognised=0;missed=0;correctRun=0;bestRun=0;
    $('study').classList.remove('hidden');$('summary').style.display='none';show();
    announceNewContent(queue);
    updateLanguageStats();
  }
  function show(){
    stopSpeech();
    if(index>=queue.length){finish();return;}
    const c=queue[index];
    flipped=false;$('card').classList.remove('flipped');
    newCardCorner.hidden=!c.isNew;
    if(category==='cheatsheet'&&language==='hu'){
      showCheatsheet(c);return;
    }
    cheatOptions.replaceChildren();cheatOptions.hidden=true;
    cardHint.hidden=false;
    const stage=$('card').parentElement;
    stage.classList.remove('card-arriving');void stage.offsetWidth;
    stage.classList.add('card-arriving');
    if(language==='it'&&c.category==='verb'){
      const italianForm=`${c.italianPronoun} ${c.form}`;
      const englishForm=c.englishForm+(c.person==='you (singular)'?' (singular)':'');
      $('frontText').textContent=c.reverse?englishForm:italianForm;
      $('backText').textContent=c.reverse?italianForm:englishForm;
      promptHint.textContent=`${c.infinitive} · present tense`;
      promptHint.hidden=false;
    }else if(language==='de'&&['case','article','order'].includes(c.category)){
      $('frontText').textContent=c.prompt;
      $('backText').textContent=c.answer;
      promptHint.textContent=c.category==='order'?'Complete the sentence':c.category==='case'?'Choose the correct form':'Article or adjective ending';
      promptHint.hidden=false;
    }else if(language==='hu'&&c.category==='verb'){
      const displayed=window.WordFlipVerbPresentation.present(c,c.verbStage);
      $('frontText').textContent=displayed.front;
      $('backText').textContent=displayed.back;
      promptHint.textContent=displayed.hint;
      promptHint.hidden=false;
    }else{
      $('frontText').textContent=c.reverse?c.en:c[language];
      $('backText').textContent=c.reverse?c[language]:c.en;
      promptHint.hidden=true;
    }
    const note=$('wordflipNote');
    note.textContent=language!=='hu'&&(c.gender||c.note)?[c.gender,c.note].filter(Boolean).join(' · '):'';
    note.hidden=!note.textContent;
    const heading=c.category==='word'&&c.partOfSpeech?c.partOfSpeech.toUpperCase():(language==='de'&&c.category==='verb'?'VERBS':names[c.category]);
    $('frontTag').textContent=language==='hu'&&c.category==='verb'?
      ({recognition:'PRESENT TENSE · HU → EN',guided:'PRESENT TENSE · GUIDED CONJUGATION',production:'PRESENT TENSE · EN → HU'}[c.verbStage]||heading):
      heading+(c.reverse?` · EN → ${languages[language].code}`:` · ${languages[language].code} → EN`);
    $('example').replaceChildren();
    const strong=document.createElement('strong');strong.textContent=c.exampleIt||c.exampleHu||c.exampleHr||c.spoken;
    const em=document.createElement('em');em.textContent=c.exampleEn;
    $('example').append(strong,em);
    $('counter').textContent=`${index+1} / ${queue.length}`;
    $('fill').style.width=`${index/queue.length*100}%`;
    $('due').textContent=c.learningReason||'Review';
    $('actions').innerHTML='<div class="instruction">Think of the answer before flipping</div>';
  }
  function showCheatsheet(q){
    const r=q.record;
    newCardCorner.hidden=['recognition','recall','application'].some(type=>(history[cheatsheet.key(r,type)]?.reviews||0)>0);
    cheatAnswered=false;
    $('card').classList.remove('flipped');
    $('card').parentElement.classList.remove('card-arriving');void $('card').parentElement.offsetWidth;
    $('card').parentElement.classList.add('card-arriving');
    $('frontTag').textContent=`CHEATSHEET · ${q.type.toUpperCase()}`;
    $('frontText').textContent=q.prompt;
    if(q.type==='recognition'&&q.canHighlight&&(q.suffixOnly||cheatsheet.score(history,r,'recognition')<.5)){
      const end=r.suffix.slice(1),split=r.form.length-end.length;
      $('frontText').replaceChildren(document.createTextNode(r.form.slice(0,split)));
      const highlight=document.createElement('mark');highlight.textContent=r.form.slice(split);
      $('frontText').append(highlight);
    }
    $('frontText').classList.toggle('cheatsheet-form',q.type==='recognition');
    promptHint.hidden=false;promptHint.textContent=q.sub;
    cardHint.hidden=true;
    cheatOptions.hidden=false;cheatOptions.replaceChildren();
    q.choices.forEach(choice=>{
      const button=document.createElement('button');button.type='button';button.className='cheatsheet-choice';
      button.textContent=choice;button.onclick=e=>{
        e.stopPropagation();if(cheatAnswered)return;
        cheatAnswered=true;q.chosen=choice;
        const correct=choice===q.correct;
        const firstSuccess=correct&&!window.WordFlipFirstWin.hasSucceeded(history,r.patternId,true);
        cheatsheet.recordAnswer(history,q,correct);save();
        if(correct)knew++;else missed++;
        button.classList.add(correct?'correct':'incorrect');
        [...cheatOptions.querySelectorAll('.cheatsheet-choice')].forEach(option=>{
          option.disabled=true;
          if(option.textContent===q.correct){
            option.classList.add('correct');
            option.textContent=`✓ ${option.textContent}`;
            option.setAttribute('aria-label',`Correct answer: ${q.correct}`);
          }
        });
        const explanation=document.createElement('div');explanation.className='cheatsheet-explanation';
        explanation.textContent=`${correct?'Correct!':'Not quite.'} ${r.form} = ${r.english}. ${cheatsheet.explanation(r)}`;
        cheatOptions.append(explanation);
        const next=document.createElement('button');next.type='button';next.className='cheatsheet-next';
        next.textContent=index===queue.length-1?'See session results →':'Next question →';
        next.onclick=event=>{event.stopPropagation();index++;show();};
        cheatOptions.append(next);next.focus({preventScroll:true});
        feedback(correct?'knew':'again',button);
        if(firstSuccess)celebrateFirstWin();
        if(correct&&q.type==='recognition'&&(history[cheatsheet.key(r,'recognition')]?.correct||0)===2)
          celebrateMilestone('✓ Pattern recognised · recall practice unlocked');
      };
      cheatOptions.append(button);
    });
    $('counter').textContent=`${index+1} / ${queue.length}`;
    $('fill').style.width=`${index/Math.max(1,queue.length)*100}%`;
    $('due').textContent=cheatsheet.categories.find(([id])=>id===r.category)?.[1]||'Cheatsheet';
    $('actions').innerHTML='<div class="instruction">Choose the best answer</div>';
  }
  function action(label,css,rating,description){
    const button=document.createElement('button');
    button.className=css;button.textContent=label;
    button.title=description;
    button.setAttribute('aria-label',description);
    button.onclick=()=>rate(rating,button);
    return button;
  }
  function flip(){
    if(category==='cheatsheet'&&language==='hu')return;
    if(index>=queue.length)return;
    flipped=!flipped;$('card').classList.toggle('flipped',flipped);
    vibrate('flip');
    if(!flipped){
      stopSpeech();
      $('actions').innerHTML='<div class="instruction">Think of the answer before flipping</div>';return;
    }
    updateAudioPauseButton();
    if(!autoAudioPaused())speak();
    const c=queue[index];
    $('actions').replaceChildren();
    $('actions').append(action('✕ Didn’t know','bad','again','I could not identify or recall the answer'));
    if(!c.reverse&&!(language==='hu'&&c.category==='verb'&&c.verbStage!=='recognition')){
      $('actions').append(action('◐ Recognised','partial','recognised',`I recognised the ${languages[language].name} but would struggle to recall it from English`));
    }
    $('actions').append(action('✓ Knew it','good','knew','I recalled the answer confidently'));
  }
  function rate(rating,button){
    const c=queue[index];
    const dir=directionOf(c);
    const key=keyOf(c,dir);
    const prev=progressFor(c,dir);
    const wasRecognition=!(c.reverse||c.verbStage==='production'||c.verbStage==='guided');
    const previousCorrect=prev.correct||0;
    const now=Date.now();
    const success=rating==='knew';
    const firstSuccess=success&&!window.WordFlipFirstWin.hasSucceeded(history,c.id);
    const partial=rating==='recognised';
    // Recognition and active recall have independent history and intervals.
    // A partial recognition never counts as a successful production review.
    const {streak,hours}=engine.schedule(prev,rating,c);
    history[key]={
      ...prev,streak,reviews:(prev.reviews||0)+1,
      correct:(prev.correct||0)+(success?1:0),
      recognised:(prev.recognised||0)+(partial?1:0),
      misses:(prev.misses||0)+(rating==='again'?1:0),
      consecutiveMisses:rating==='again'?(prev.consecutiveMisses||0)+1:0,
      due:now+hours*3600000,last:now,lastRating:rating,
      recentRatings:window.WordFlipProgress.recordRecent(prev,rating)
    };
    if(language==='hu'&&c.category==='verb')window.WordFlipAdaptive.updatedVerbSupport({history,card:c,rating,now});
    else window.WordFlipAdaptive.updatedRecallSupport({history,card:c,language,reverse:c.reverse,rating,now});
    if(partial&&dir===`${language}-en`&&!(language==='hu'&&c.category==='verb')){
      // Prompt the reverse (English → Hungarian) as an unmastered item soon.
      // Never increase its streak or successful-review count.
      const reverseKey=keyOf(c,`en-${language}`);
      const reverse=history[reverseKey]||{streak:0,reviews:0};
      const soon=now+0.12*3600000;
      history[reverseKey]={...reverse,due:Math.min(reverse.due||soon,soon)};
    }
    save();
    if(button)feedback(rating,button);
    if(firstSuccess)celebrateFirstWin();
    if(success&&wasRecognition&&previousCorrect<2&&(history[key].correct||0)>=2&&
      !(language==='hu'&&c.category==='verb'))celebrateMilestone('✓ Recognition strengthened · ready for recall');
    if(success&&language==='hu'&&c.category==='verb'&&c.verbStage==='guided')
      celebrateMilestone('✓ Guided practice complete · active recall next');
    if(success)knew++;else if(partial)recognised++;else missed++;
    index++;show();
  }
  function finish(){
    vibrate('finish');
    $('study').classList.add('hidden');$('summary').style.display='block';
    const perfect=queue.length>0&&knew===queue.length;
    $('summary').querySelector('h2').textContent=perfect?'Perfect session.':queue.length?'Nicely done.':'All caught up.';
    $('summary').querySelector('p').textContent=perfect?`${queue.length} answers · all correct on the first attempt. Your next reviews have been scheduled.`:queue.length?`A few minutes every day adds up. Longest correct streak: ${bestRun}. Your next reviews have been scheduled.`:'Nothing is due just now. Come back later, or choose a focused practice category.';
    $('summary').classList.toggle('perfect-session',perfect);
    const accuracy=queue.length?Math.round(knew/queue.length*100):0;
    const resultsFill=resultsProgress.querySelector('.results-fill');
    resultsProgress.hidden=!queue.length;
    cancelAnimationFrame(resultsFrame);
    resultsFill.style.transition='none';resultsFill.style.width='0%';
    resultsProgress.classList.remove('growing');
    void resultsProgress.offsetWidth;
    if(!reducedMotion())resultsProgress.classList.add('growing');
    resultsFrame=requestAnimationFrame(()=>{
      resultsFrame=requestAnimationFrame(()=>{
        resultsFill.style.transition=reducedMotion()?'none':'width 1100ms cubic-bezier(.16,.75,.22,1)';
        resultsFill.style.width=`${accuracy}%`;
      });
    });
    $('summary').classList.remove('summary-arriving');void $('summary').offsetWidth;
    $('summary').classList.add('summary-arriving');
    countTo($('knewCount'),knew);
    countTo($('missedCount'),missed);
  }
  function speak(event){
    event?.stopPropagation();if(!('speechSynthesis'in window)||!queue[index])return;
    const c=queue[index];stopSpeech();
    const spoken=language==='it'&&c.category==='verb'?`${c.italianPronoun==='lui / lei'?'lui':c.italianPronoun} ${c.form}`:
      language==='hu'&&c.category==='verb'?window.WordFlipVerbPresentation.present(c,c.verbStage).spoken:c.spoken||c[language];
    // Paired suffixes are two pronunciation units, not one hyphenated word.
    // A real 500 ms gap is more reliable than punctuation, which TTS engines interpret differently.
    const paired=/^\s*-[^\s/]+\s*\/\s*-[^\s/]+\s*$/.test(spoken);
    const segments=paired?spoken.split(/\s*\/\s*/):[spoken];
    const sequence=speechSequence;
    const say=position=>{
      if(sequence!==speechSequence)return;
      const utterance=new SpeechSynthesisUtterance(segments[position]);
      utterance.lang=engine.language;utterance.rate=.85;
      if(position<segments.length-1){
        utterance.onend=()=>{
          if(sequence!==speechSequence)return;
          speechGapTimer=setTimeout(()=>{speechGapTimer=null;say(position+1);},500);
        };
      }
      speechSynthesis.speak(utterance);
    };
    say(0);
  }
  $('card').addEventListener('click',e=>{if(e.target.id!=='speak')flip();});
  $('card').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip();}});
  $('speak').addEventListener('click',speak);
  $('speak').textContent='▶';
  const audioPauseButton=document.createElement('button');
  audioPauseButton.type='button';audioPauseButton.id='audioPauseButton';
  audioPauseButton.className='audio-pause-button';
  $('speak').insertAdjacentElement('afterend',audioPauseButton);
  function updateAudioPauseButton(){
    const paused=autoAudioPaused();
    audioPauseButton.textContent=paused?'Resume automatic audio':'Can’t listen now';
    audioPauseButton.setAttribute('aria-label',paused?'Resume automatic pronunciation':'Pause automatic pronunciation for 15 minutes');
  }
  audioPauseButton.addEventListener('click',event=>{
    event.stopPropagation();
    if(autoAudioPaused())localStorage.removeItem(audioPauseKey);
    else{
      localStorage.setItem(audioPauseKey,String(Date.now()+15*60*1000));
      stopSpeech();
    }
    updateAudioPauseButton();
  });
  updateAudioPauseButton();
  $('settingsButton').onclick=()=>$('settings').style.display=$('settings').style.display==='block'?'none':'block';
  $('filters').addEventListener('click',e=>{
    const button=e.target.closest('[data-category]');if(!button)return;
    if(button.dataset.category==='cheatsheet'){openCheatsheetDrawer();return;}
    if(button.dataset.category==='phrase'&&language!=='hu'){openPhraseDrawer();return;}
    category=button.dataset.category;
    // In Italian conjugation drills, practise producing the Italian form by default.
    // Explicitly selected mixed or reverse directions remain respected.
    if(language==='it'&&category==='verb'&&$('direction').value==='hu-en')$('direction').value='en-hu';
    document.querySelectorAll('.pill').forEach(p=>p.classList.toggle('active',p===button));
    $('verbModeLabel').hidden=language!=='hu'||category!=='verb';start();
  });
  $('direction').onchange=()=>{localStorage.setItem('wordflip-direction',$('direction').value);document.querySelector('[data-category="all"]').textContent=$('direction').value==='auto'?'✦ Automatic':'✦ All categories';start();};$('length').onchange=start;
  $('again').textContent='Let’s practice more!';
  $('again').onclick=start;$('restart').onclick=start;
  const returnToMenu=document.createElement('button');
  returnToMenu.type='button';
  returnToMenu.id='returnToMenu';
  returnToMenu.textContent='← Return to menu';
  $('summary').insertAdjacentElement('afterbegin',returnToMenu);
  returnToMenu.onclick=()=>{
    $('summary').style.display='none';
    $('study').classList.remove('hidden');
    document.body.classList.remove('training');
    window.scrollTo(0,0);
  };
  $('reset').onclick=()=>{if(confirm(`Erase ${languages[language].name} learning history on this device?`)){history={};save();start();}};
  if(vibrationAvailable){
    const hapticLabel=document.createElement('label');hapticLabel.className='haptic-setting';
    hapticLabel.innerHTML='<span>Haptic feedback <small>Gentle vibrations on supported devices</small></span><input type="checkbox" id="hapticToggle">';
    $('settings').append(hapticLabel);
    $('hapticToggle').checked=localStorage.getItem(vibrationKey)!=='off';
    $('hapticToggle').onchange=()=>{localStorage.setItem(vibrationKey,$('hapticToggle').checked?'on':'off');if($('hapticToggle').checked)vibrate('recognised');};
  }

  // v2 backups carry readable card context, but only progress records are
  // imported. This keeps updated learning content under the app's control.
  const backupSection=document.createElement('div');
  backupSection.className='backup-section';
  backupSection.innerHTML='<h3>Your learning history</h3><p>Back up all three languages, restore on another device, or share a readable learning report.</p><div class="backup-actions"><button type="button" id="exportProgress">↓ Export backup</button><button type="button" id="importProgress">↑ Import backup</button><button type="button" id="exportReport">↓ Learning report</button></div><input id="progressFile" type="file" accept=".json,application/json" hidden><p id="backupStatus" class="backup-status" role="status" aria-live="polite"></p>';
  $('reset').insertAdjacentElement('beforebegin',backupSection);
  const status=(message,error=false)=>{const node=$('backupStatus');node.textContent=message;node.classList.toggle('error',error);};
  const storageKeys={hu:window.WordFlipEngines.hu.storageKey,it:window.WordFlipEngines.it.storageKey,hr:window.WordFlipEngines.hr.storageKey,de:window.WordFlipEngines.de.storageKey};
  const readStored=(code)=>{
    const raw=localStorage.getItem(storageKeys[code]);
    if(!raw)return {};
    const value=JSON.parse(raw);
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`${languages[code].name} progress is not readable.`);
    return value;
  };
  const transfer=window.WordFlipTransfer;
  const progressSnapshot=()=>({hu:readStored('hu'),it:readStored('it'),hr:readStored('hr'),de:readStored('de')});
  const context=async()=>{
    const banks={};
    for(const code of Object.keys(languages)){
      const response=await fetch(languages[code].data);
      if(!response.ok)throw Error(`Could not load ${languages[code].name} card descriptions.`);
      banks[code]=await response.json();
    }
    return transfer.contentLookup(banks,window.WordFlipCheatsheetData?.records||[]);
  };
  const download=(content,name,type)=>{
    const url=URL.createObjectURL(new Blob([content],{type}));
    const link=document.createElement('a');link.href=url;link.download=name;
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  };
  $('exportProgress').onclick=async()=>{
    try{
      const backup=transfer.createBackup(progressSnapshot(),await context());
      download(JSON.stringify(backup,null,2),`WordFlip-backup-${new Date().toISOString().slice(0,10)}.json`,'application/json');
      status('Version 2 backup prepared, with readable card descriptions and your full review history.');
    }catch(error){status(`Could not export: ${error.message}`,true);}
  };
  $('exportReport').onclick=async()=>{
    try{
      const report=transfer.createReport(progressSnapshot(),await context());
      download(report,`WordFlip-learning-report-${new Date().toISOString().slice(0,10)}.txt`,'text/plain;charset=utf-8');
      status('Learning report prepared. You can share this text file for personalised feedback.');
    }catch(error){status(`Could not create report: ${error.message}`,true);}
  };
  $('importProgress').onclick=()=>$('progressFile').click();
  $('progressFile').onchange=async(event)=>{
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    try{
      if(file.size>8_000_000)throw Error('The selected file is too large.');
      const data=JSON.parse(await file.text());
      const imported=transfer.validateBackup(data);
      const counts=Object.keys(languages).map(code=>`${Object.keys(data.progress[code]||{}).length} ${languages[code].name} records`).join(', ');
      const mode=prompt(`WordFlip ${data.version===1?'legacy v1':'v2'} backup: ${counts}.\n\nType MERGE to keep the most recently practised record for each card, or REPLACE to restore the backup exactly.\n\nCancel leaves your progress unchanged.`,'MERGE');
      if(mode===null){status('Import cancelled; your progress was not changed.');return;}
      const choice=mode.trim().toUpperCase();
      if(!['MERGE','REPLACE'].includes(choice))throw Error('Type MERGE or REPLACE to choose an import mode.');
      if(!confirm(`${choice==='MERGE'?'Merge':'Replace'} progress for all languages?\n\n${choice==='MERGE'?'The most recently practised record for each card will be kept.':'This replaces your current history.'} Export your current backup first if you want a separate copy.`)){status('Import cancelled; your progress was not changed.');return;}
      const restored=choice==='MERGE'?transfer.mergeProgress(progressSnapshot(),imported):imported;
      const previous=Object.fromEntries(Object.entries(storageKeys).map(([code,key])=>[code,localStorage.getItem(key)]));
      try{
        for(const code of Object.keys(languages))localStorage.setItem(storageKeys[code],JSON.stringify(restored[code]||{}));
      }catch(error){
        for(const code of Object.keys(languages)){if(previous[code]===null)localStorage.removeItem(storageKeys[code]);else localStorage.setItem(storageKeys[code],previous[code]);}
        throw error;
      }
      history=loadHistory();start();
      status(`${choice==='MERGE'?'Merged':'Restored'} ${counts}. Your next session will use the imported review schedule.`);
    }catch(error){status(`Import failed: ${error.message}`,true);}
  };

  // Language switch happens on the home view; each module owns its own progress.
  const picker=document.createElement('section');picker.className='language-picker';picker.id='languagePicker';
  picker.setAttribute('aria-label','Choose a language');
  picker.innerHTML='<div class="language-welcome"><div class="eyebrow">WELCOME TO WORDFLIP</div><h1>What would you like to learn?</h1><p>Choose a language to continue your practice.</p></div>';
  const languageCards=document.createElement('div');languageCards.className='language-cards';
  for(const [code,meta] of Object.entries(languages)){
    const button=document.createElement('button');button.className='language-choice';button.dataset.language=code;
    button.innerHTML=`<span class="flag" aria-hidden="true">${meta.flag}</span><span class="language-card-copy"><strong>${meta.name}</strong><small id="languageStat-${code}">Ready to practise</small></span>`;
    button.onclick=()=>window.WordFlipDrill.run('forward',()=>{selectLanguage(code);document.body.classList.add('language-selected');window.WordFlipShowHub?.();window.scrollTo(0,0);});
    languageCards.append(button);
  }
  picker.append(languageCards);
  $('study').insertAdjacentElement('beforebegin',picker);
  // Keep the language picker accessible from every app view via the flag beside Settings.
  const headerActions=document.createElement('div');headerActions.className='header-actions';
  // Explicit layout also protects the header if an installed PWA briefly uses an older cached stylesheet.
  Object.assign(headerActions.style,{display:'flex',flexDirection:'row',alignItems:'center',flexWrap:'nowrap',gap:'9px',flexShrink:'0'});
  // The header uses a stack of overlapping flag coins. Open it to select
  // another language directly, without passing through the landing page.
  const languageSwitch=document.createElement('div');
  languageSwitch.className='language-switch';
  languageSwitch.id='languageSwitcher';
  const coinTray=document.createElement('div');coinTray.className='language-coin-tray';
  const coinToggle=document.createElement('button');coinToggle.type='button';
  coinToggle.className='language-coin-toggle';
  coinToggle.setAttribute('aria-label','Choose another language');
  coinToggle.setAttribute('aria-expanded','false');
  coinToggle.setAttribute('aria-controls','languageCoinTray');
  coinTray.id='languageCoinTray';
  const coinButtons=new Map();
  for(const [code,meta] of Object.entries(languages)){
    const coin=document.createElement('button');coin.type='button';
    coin.className='language-coin';coin.dataset.language=code;
    coin.textContent=meta.flag;coin.title=meta.name;
    coin.setAttribute('aria-label','Switch to '+meta.name);
    coin.setAttribute('tabindex','-1');
    coinTray.append(coin);coinButtons.set(code,coin);
    coin.onclick=event=>{
      event.stopPropagation();
      closeCoins();
      if(code===language)return;
      window.WordFlipDrill.run('forward',()=>{
        stopSpeech();
        selectLanguage(code);
        document.body.classList.add('language-selected');
        window.WordFlipShowHub?.();
        $('settings').style.display='none';
        window.scrollTo(0,0);
      });
    };
  }
  languageSwitch.append(coinTray,coinToggle);
  $('settingsButton').before(headerActions);
  headerActions.append(languageSwitch,$('settingsButton'));
  function arrangeCoins(){
    const ordered=[...Object.keys(languages).filter(code=>code!==language),language];
    ordered.forEach((code,i)=>{
      const coin=coinButtons.get(code);
      coin.style.setProperty('--coin-depth',String(ordered.length-1-i));
      coin.style.zIndex=String(i+1);
      coin.setAttribute('aria-current',code===language?'true':'false');
    });
  }
  function closeCoins(){
    languageSwitch.classList.remove('is-open');
    coinToggle.setAttribute('aria-expanded','false');
    coinToggle.setAttribute('aria-label','Choose another language');
    for(const coin of coinButtons.values())coin.tabIndex=-1;
  }
  function openCoins(){
    if(!document.body.classList.contains('language-selected'))return;
    languageSwitch.classList.add('is-open');
    coinToggle.setAttribute('aria-expanded','true');
    coinToggle.setAttribute('aria-label','Close language choices');
    for(const coin of coinButtons.values())coin.tabIndex=0;
  }
  coinToggle.onclick=event=>{
    event.stopPropagation();
    if(languageSwitch.classList.contains('is-open'))closeCoins();else openCoins();
  };
  document.addEventListener('pointerdown',event=>{
    if(!languageSwitch.contains(event.target))closeCoins();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&languageSwitch.classList.contains('is-open')){
      closeCoins();coinToggle.focus();
    }
  });
  const goToLanguages=()=>window.WordFlipDrill.run('back',()=>{
    closeCoins();window.WordFlipHideStoryViews?.();
    stopSpeech();
    document.body.classList.remove('language-selected','training','progress-view-open');
    $('study').classList.remove('hidden');
    $('summary').style.display='none';
    $('settings').style.display='none';
    progressPage.hidden=true;
    updateLanguageStats();
    window.scrollTo(0,0);
  });
  window.WordFlipNavigateToLanguages=goToLanguages;
  window.WordFlipCloseCoins=closeCoins;
  const progressButton=document.createElement('button');progressButton.className='progress-open-button';progressButton.type='button';
  progressButton.textContent='Your progress';
  // Stay in normal document flow, below the header, even before the updated CSS arrives.
  progressButton.style.display='block';
  progressButton.style.margin='24px 0 18px auto';
  $('study').insertAdjacentElement('afterbegin',progressButton);
  const progressPage=document.createElement('section');progressPage.id='learningProgress';progressPage.className='learning-progress';
  progressPage.hidden=true;progressPage.innerHTML='<button type="button" class="progress-back">← Back to practice</button><header class="progress-heading"><span class="eyebrow">YOUR LEARNING JOURNEY</span><h1></h1><p>Discover what you have explored and how confidently you remember it.</p></header><div class="progress-category-list"></div><p class="progress-method">Seen counts unique exercises encountered. Recognition and recall represent recent-weighted confidence on tested exercises only. Older reviews are estimated from saved totals and the latest rating. A dash means not yet tested.</p>';
  $('study').insertAdjacentElement('afterend',progressPage);
  const progressBack=()=>window.WordFlipDrill.run('back',()=>{progressPage.hidden=true;document.body.classList.remove('progress-view-open');window.scrollTo(0,0);});
  progressPage.querySelector('.progress-back').onclick=progressBack;
  const progressSections={
    hu:[['word','Words'],['verb','Conjugation'],['phrase','Phrases'],['suffix','Suffixes'],['cheatsheet','Cheatsheet']],
    it:[['word','Words'],['verb','Conjugation'],['phrase','Phrases'],['description','Adjectives / Adverbs'],['preposition','Prepositions']],
    hr:[['word','Words'],['phrase','Phrases'],['verb','Conjugation'],['case','Cases']],
    de:[['word','Vocabulary'],['verb','Verbs'],['phrase','Expressions'],['case','Cases'],['article','Articles & endings'],['order','Word order']]
  };
  const sectionCards=(section,topic)=>{
    if(section==='cheatsheet')return [];
    return cards.filter(c=>{
      if(language==='it'&&c.category==='article')return false;
      const match=c.category===section||language==='it'&&section==='description'&&c.category==='word'&&['adjective','adverb'].includes(c.partOfSpeech)||
        language==='it'&&section==='preposition'&&(c.category==='preposition'||c.category==='word'&&c.partOfSpeech==='preposition');
      return match&&(!topic||c.topic===topic);
    });
  };
  const percent=value=>value===null?'—':`${Math.round(value*100)}%`;
  function progressMetric(label,fraction,detail,tone){
    const column=document.createElement('div');column.className=`progress-metric ${tone}`;
    const caption=document.createElement('div');caption.className='progress-metric-label';caption.textContent=label;
    const number=document.createElement('div');number.className='progress-metric-value';number.textContent=percent(fraction);
    const track=document.createElement('div');track.className='progress-mini-track';track.setAttribute('role','progressbar');
    track.setAttribute('aria-label',label);track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');
    track.setAttribute('aria-valuenow',fraction===null?'0':String(Math.round(fraction*100)));
    const fill=document.createElement('div');fill.className='progress-mini-fill';track.append(fill);
    const info=document.createElement('div');info.className='progress-metric-detail';info.textContent=detail;
    column.append(caption,number,track,info);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{fill.style.width=`${Math.max(0,(fraction||0)*100)}%`;}));
    return column;
  }
  function progressRow(label,data,section,topic,subrow=false){
    const card=document.createElement('section');card.className=`progress-category${subrow?' progress-subcategory':''}`;
    const header=document.createElement('div');header.className='progress-category-heading';
    const title=document.createElement('h2');title.textContent=label;
    const total=document.createElement('span');total.className='progress-category-total';
    total.textContent=`${data.total.toLocaleString('en-GB')} items`;
    header.append(title,total);
    const seenFraction=data.total?data.seen/data.total:0;
    const grid=document.createElement('div');grid.className='progress-metrics';
    const confidenceDetail=metric=>metric.value===null?'Not yet tested':
      `≈ ${Math.round(metric.value*metric.tested)} / ${metric.tested} confident · ${metric.tested}/${data.seen} tested`;
    grid.append(progressMetric('Seen',seenFraction,`${data.seen} / ${data.total} items`,'seen'),
      progressMetric('Recognition',data.recognition.value,confidenceDetail(data.recognition),'recognition'),
      progressMetric('Recall',data.recall.value,confidenceDetail(data.recall),'recall'));
    const actions=document.createElement('div');actions.className='progress-category-actions';
    const practise=document.createElement('button');practise.type='button';practise.textContent='Practise weak items';
    practise.onclick=()=>practiceWeak(section,topic);
    practise.disabled=!data.seen;
    actions.append(practise);card.append(header,grid,actions);
    return card;
  }
  function renderLearningProgress(){
    progressPage.querySelector('h1').textContent=`${languages[language].flag} ${languages[language].name} progress`;
    const list=progressPage.querySelector('.progress-category-list');list.replaceChildren();
    for(const [section,label] of progressSections[language]){
      const records=section==='cheatsheet'?cheatsheet.records:sectionCards(section);
      const stats=section==='cheatsheet'?window.WordFlipProgress.cheatsheet(records,history):window.WordFlipProgress.summarise(records,history,language);
      const row=progressRow(label,stats,section);list.append(row);
      const subdivisions=section==='cheatsheet'?cheatsheet.categories:
        section==='phrase'&&language!=='hu'?phraseTopics:[];
      if(subdivisions.length){
        const details=document.createElement('details');details.className='progress-details';
        const summary=document.createElement('summary');summary.textContent=`View ${subdivisions.length} topics`;
        const children=document.createElement('div');children.className='progress-details-content';
        for(const [id,name] of subdivisions){
          const subset=section==='cheatsheet'?cheatsheet.records.filter(r=>r.category===id):sectionCards(section,id);
          const substats=section==='cheatsheet'?window.WordFlipProgress.cheatsheet(subset,history):window.WordFlipProgress.summarise(subset,history,language);
          children.append(progressRow(name,substats,section,id,true));
        }
        details.append(summary,children);row.append(details);
      }
    }
  }
  progressButton.onclick=()=>window.WordFlipDrill.run('forward',()=>{renderLearningProgress();progressPage.hidden=false;document.body.classList.add('progress-view-open');window.scrollTo(0,0);});
  function practiceWeak(section,topic){
    progressBack();
    if(section==='cheatsheet'){
      category='cheatsheet';
      const topicIds=topic?[topic]:cheatsheet.categories.map(([id])=>id);
      queue=cheatsheet.createSession(history,topicIds,Number($('length').value));
    }else{
      category=section;
      const pool=sectionCards(section,topic);
      const practised=pool.filter(c=>[`${c.id}:${language}-en`,`${c.id}:en-${language}`,`${c.id}:hu-production`,`${c.id}:hu-recognition`].some(k=>(history[k]?.reviews||0)>0));
      const ranked=practised.map(c=>{
        const keys=language==='hu'&&c.category==='verb'?[`${c.id}:hu-production`,`${c.id}:hu-recognition`]:[`${c.id}:en-${language}`,`${c.id}:${language}-en`];
        const scores=keys.map(k=>window.WordFlipProgress.confidence(history[k])).filter(v=>v!==null);
        return {card:c,score:scores.length?Math.min(...scores):0};
      }).sort((a,b)=>a.score-b.score);
      const weakest=ranked.slice(0,Math.max(8,Number($('length').value)*2)).map(x=>x.card);
      queue=window.WordFlipAdaptive.createSession({cards:weakest.length?weakest:pool,history,engine,language,
        category:section,direction:'mixed',length:Number($('length').value),verbMode:'auto'});
    }
    document.querySelectorAll('.pill').forEach(p=>p.classList.toggle('active',p.dataset.category===category));
    index=0;knew=0;recognised=0;missed=0;correctRun=0;bestRun=0;
    $('study').classList.remove('hidden');$('summary').style.display='none';show();
  }
  const note=document.createElement('div');note.className='card-note';note.id='wordflipNote';note.hidden=true;
  $('backText').insertAdjacentElement('afterend',note);
  const adjectiveFilter=document.createElement('button');adjectiveFilter.className='pill';adjectiveFilter.dataset.category='description';adjectiveFilter.textContent='Adjectives / Adverbs';
  const prepositionFilter=document.createElement('button');prepositionFilter.className='pill';prepositionFilter.dataset.category='preposition';prepositionFilter.textContent='Prepositions';
  const caseFilter=document.createElement('button');caseFilter.className='pill';caseFilter.dataset.category='case';caseFilter.textContent='Cases';
  const articleFilter=document.createElement('button');articleFilter.className='pill';articleFilter.dataset.category='article';articleFilter.textContent='Articles & endings';
  const orderFilter=document.createElement('button');orderFilter.className='pill';orderFilter.dataset.category='order';orderFilter.textContent='Word order';
  $('filters').append(adjectiveFilter,prepositionFilter,caseFilter,articleFilter,orderFilter);
  const cheatsheetPill=document.createElement('button');cheatsheetPill.className='pill cheatsheet-pill';
  cheatsheetPill.type='button';cheatsheetPill.dataset.category='cheatsheet';
  $('filters').append(cheatsheetPill);
  function updateCheatsheetPill(){
    cheatsheetPill.innerHTML=`Cheatsheet <small>· ${cheatsheet.enabled().length}</small>`;
  }
  updateCheatsheetPill();
  const drawerRoot=document.createElement('div');drawerRoot.id='cheatsheetDrawerRoot';drawerRoot.hidden=true;
  drawerRoot.innerHTML=`<div class="cheatsheet-backdrop"></div><section class="cheatsheet-drawer" role="dialog" aria-modal="true" aria-labelledby="cheatsheetDrawerTitle" tabindex="-1"><div class="cheatsheet-handle" aria-hidden="true"></div><header class="cheatsheet-drawer-header"><div><h2 id="cheatsheetDrawerTitle">Cheatsheet</h2><p>Choose what you’d like to practise.</p></div><button type="button" class="cheatsheet-close" aria-label="Close Cheatsheet settings">×</button></header><div class="cheatsheet-controls"><span id="cheatsheetSelectedCount"></span><div><button type="button" id="cheatsheetSelectAll">Select all</button><button type="button" id="cheatsheetDeselectAll">Deselect all</button></div></div><div class="cheatsheet-rows"></div><footer class="cheatsheet-drawer-footer"><button type="button" id="cheatsheetApply">Practise selected</button></footer></section>`;
  document.body.append(drawerRoot);
  let draftCategories=new Set(),previousFocus=null,drawerClosingTimer=null,drawerTouchStart=0;
  const closeDrawer=()=>{
    if(drawerRoot.hidden)return;
    drawerRoot.classList.remove('open');clearTimeout(drawerClosingTimer);
    drawerClosingTimer=setTimeout(()=>{drawerRoot.hidden=true;previousFocus?.focus({preventScroll:true});},210);
    document.body.classList.remove('cheatsheet-drawer-open');
  };
  const drawCategories=()=>{
    const rows=drawerRoot.querySelector('.cheatsheet-rows');rows.replaceChildren();
    for(const [id,label] of cheatsheet.categories){
      const row=document.createElement('label');row.className='cheatsheet-row';
      const check=document.createElement('input');check.type='checkbox';check.value=id;check.checked=draftCategories.has(id);
      check.onchange=()=>{check.checked?draftCategories.add(id):draftCategories.delete(id);updateDrawerCount();};
      const name=document.createElement('span');name.textContent=label;
      row.append(check,name);rows.append(row);
    }
    updateDrawerCount();
  };
  function updateDrawerCount(){
    $('cheatsheetSelectedCount').textContent=`${draftCategories.size} of ${cheatsheet.categories.length} selected`;
    $('cheatsheetApply').disabled=!draftCategories.size;
  }
  function openCheatsheetDrawer(){
    clearTimeout(drawerClosingTimer);previousFocus=document.activeElement;
    draftCategories=new Set(cheatsheet.enabled());drawCategories();
    drawerRoot.hidden=false;document.body.classList.add('cheatsheet-drawer-open');
    requestAnimationFrame(()=>drawerRoot.classList.add('open'));
    drawerRoot.querySelector('.cheatsheet-close').focus({preventScroll:true});
  }
  drawerRoot.querySelector('.cheatsheet-backdrop').onclick=closeDrawer;
  drawerRoot.querySelector('.cheatsheet-close').onclick=closeDrawer;
  $('cheatsheetSelectAll').onclick=()=>{draftCategories=new Set(cheatsheet.categories.map(([id])=>id));drawCategories();};
  $('cheatsheetDeselectAll').onclick=()=>{draftCategories.clear();drawCategories();};
  $('cheatsheetApply').onclick=()=>{
    if(!draftCategories.size)return;
    cheatsheet.saveEnabled([...draftCategories]);updateCheatsheetPill();closeDrawer();
    category='cheatsheet';document.querySelectorAll('.pill').forEach(p=>p.classList.toggle('active',p===cheatsheetPill));
    $('verbModeLabel').hidden=true;start();
  };
  drawerRoot.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();closeDrawer();}
    if(event.key==='Tab'){
      const focusables=[...drawerRoot.querySelectorAll('button:not([disabled]),input:not([disabled])')];
      const first=focusables[0],last=focusables.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  const drawerHandle=drawerRoot.querySelector('.cheatsheet-handle');
  drawerHandle.addEventListener('touchstart',event=>{drawerTouchStart=event.touches[0].clientY;},{passive:true});
  drawerHandle.addEventListener('touchend',event=>{if(event.changedTouches[0].clientY-drawerTouchStart>60)closeDrawer();},{passive:true});
  // Italian Phrases uses a separate topic drawer, while keeping the familiar
  // Cheatsheet sheet styling and the original Phrases top-level pill.
  const phraseRoot=document.createElement('div');phraseRoot.id='phraseDrawerRoot';phraseRoot.hidden=true;
  phraseRoot.innerHTML=`<div class="cheatsheet-backdrop"></div><section class="cheatsheet-drawer" role="dialog" aria-modal="true" aria-labelledby="phraseDrawerTitle" tabindex="-1"><div class="cheatsheet-handle" aria-hidden="true"></div><header class="cheatsheet-drawer-header"><div><h2 id="phraseDrawerTitle">Italian phrases</h2><p>Choose the conversations you'd like to practise.</p></div><button type="button" class="cheatsheet-close" aria-label="Close phrase choices">×</button></header><div class="phrase-level"><span>Difficulty</span><button type="button" data-phrase-level="all">A1 + A2</button><button type="button" data-phrase-level="A1">A1</button><button type="button" data-phrase-level="A2">A2</button></div><div class="cheatsheet-controls"><span id="phraseSelectedCount"></span><div><button type="button" id="phraseSelectAll">Select all</button><button type="button" id="phraseDeselectAll">Clear</button></div></div><div class="cheatsheet-rows"></div><footer class="cheatsheet-drawer-footer"><button type="button" id="phraseApply">Practise selected</button><button type="button" id="phraseSurprise" class="phrase-surprise">✦ Surprise me · all topics</button></footer></section>`;
  document.body.append(phraseRoot);
  const phrasePill=document.querySelector('[data-category="phrase"]');
  function updatePhrasePill(){
    if(phrasePill)phrasePill.innerHTML=language==='hu'?'Phrases':`Phrases <small>· ${activePhraseTopics.length}</small>`;
  }
  updatePhrasePill();
  let draftPhraseTopics=new Set(activePhraseTopics),draftPhraseLevel=activePhraseLevel,phraseFocus=null;
  const closePhraseDrawer=()=>{
    phraseRoot.classList.remove('open');document.body.classList.remove('cheatsheet-drawer-open');
    setTimeout(()=>{phraseRoot.hidden=true;phraseFocus?.focus({preventScroll:true});},210);
  };
  const renderPhraseDrawer=()=>{
    const rows=phraseRoot.querySelector('.cheatsheet-rows');rows.replaceChildren();
    for(const [id,label] of phraseTopics){
      const row=document.createElement('label');row.className='cheatsheet-row';
      const input=document.createElement('input');input.type='checkbox';input.checked=draftPhraseTopics.has(id);
      input.onchange=()=>{input.checked?draftPhraseTopics.add(id):draftPhraseTopics.delete(id);renderPhraseCount();};
      const name=document.createElement('span');name.textContent=label;
      row.append(input,name);rows.append(row);
    }
    phraseRoot.querySelectorAll('[data-phrase-level]').forEach(b=>b.classList.toggle('selected',b.dataset.phraseLevel===draftPhraseLevel));
    renderPhraseCount();
  };
  function renderPhraseCount(){
    $('phraseSelectedCount').textContent=`${draftPhraseTopics.size} of ${phraseTopics.length} topics selected`;
    $('phraseApply').disabled=!draftPhraseTopics.size;
  }
  function openPhraseDrawer(){
    $('phraseDrawerTitle').textContent=`${languages[language].name} phrases`;
    phraseRoot.querySelector('[data-phrase-level="A2"]').hidden=language==='hr';
    phraseRoot.querySelector('[data-phrase-level="all"]').textContent=language==='hr'?'Starter + A1':language==='de'?'A2 + B1':'A1 + A2';
    const lower=phraseRoot.querySelector('[data-phrase-level="A1"],[data-phrase-level="B1"]');
    lower.textContent=language==='de'?'B1':'A1';
    lower.dataset.phraseLevel=language==='de'?'B1':'A1';
    phraseFocus=document.activeElement;draftPhraseTopics=new Set(activePhraseTopics);draftPhraseLevel=activePhraseLevel;
    renderPhraseDrawer();phraseRoot.hidden=false;document.body.classList.add('cheatsheet-drawer-open');
    requestAnimationFrame(()=>phraseRoot.classList.add('open'));
    phraseRoot.querySelector('.cheatsheet-close').focus({preventScroll:true});
  }
  function applyPhraseChoices(topics,level){
    activePhraseTopics=topics;activePhraseLevel=level;
    localStorage.setItem(phraseSettingsKey(),JSON.stringify(topics));localStorage.setItem(phraseLevelsKey(),level);
    updatePhrasePill();
    closePhraseDrawer();category='phrase';
    document.querySelectorAll('.pill').forEach(p=>p.classList.toggle('active',p===phrasePill));
    $('verbModeLabel').hidden=true;start();
  }
  phraseRoot.querySelector('.cheatsheet-backdrop').onclick=closePhraseDrawer;
  phraseRoot.querySelector('.cheatsheet-close').onclick=closePhraseDrawer;
  phraseRoot.querySelector('#phraseSelectAll').onclick=()=>{draftPhraseTopics=new Set(phraseTopics.map(([id])=>id));renderPhraseDrawer();};
  phraseRoot.querySelector('#phraseDeselectAll').onclick=()=>{draftPhraseTopics.clear();renderPhraseDrawer();};
  phraseRoot.querySelectorAll('[data-phrase-level]').forEach(b=>b.onclick=()=>{draftPhraseLevel=b.dataset.phraseLevel;renderPhraseDrawer();});
  $('phraseApply').onclick=()=>{if(draftPhraseTopics.size)applyPhraseChoices([...draftPhraseTopics],draftPhraseLevel);};
  $('phraseSurprise').onclick=()=>applyPhraseChoices(phraseTopics.map(([id])=>id),'all');
  phraseRoot.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();closePhraseDrawer();}
    if(event.key==='Tab'){
      const focusables=[...phraseRoot.querySelectorAll('button:not([disabled]),input:not([disabled])')];
      const first=focusables[0],last=focusables.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  let phraseTouchStart=0;
  phraseRoot.querySelector('.cheatsheet-handle').addEventListener('touchstart',e=>{phraseTouchStart=e.touches[0].clientY;},{passive:true});
  phraseRoot.querySelector('.cheatsheet-handle').addEventListener('touchend',e=>{if(e.changedTouches[0].clientY-phraseTouchStart>60)closePhraseDrawer();},{passive:true});
  const paceLabel=document.createElement('label');
  paceLabel.innerHTML='New words pace<select id="learningPace"><option value="slow">Slow · up to 3</option><option value="normal">Normal · up to 6</option><option value="fast">Fast · up to 10</option></select>';
  $('length').closest('label').insertAdjacentElement('afterend',paceLabel);
  const paceNote=document.createElement('p');paceNote.className='small';
  paceNote.textContent='Automatic practice prioritises due reviews and may use fewer cards than the session length. Your first session can introduce four extra starter cards.';
  paceLabel.insertAdjacentElement('afterend',paceNote);
  const verbModeLabel=document.createElement('label');verbModeLabel.id='verbModeLabel';
  verbModeLabel.innerHTML='Hungarian verb exercise<select id="verbMode"><option value="auto">Automatic progression</option><option value="recognition">Recognition · Hungarian → English</option><option value="guided">Guided conjugation · infinitive clue</option><option value="production">Active production · English → Hungarian</option></select>';
  paceNote.insertAdjacentElement('afterend',verbModeLabel);
  $('verbMode').value=['auto','recognition','guided','production'].includes(localStorage.getItem('wordflip-verb-mode'))?localStorage.getItem('wordflip-verb-mode'):'auto';
  $('verbMode').onchange=()=>{localStorage.setItem('wordflip-verb-mode',$('verbMode').value);start();};
  $('learningPace').value=['slow','normal','fast'].includes(localStorage.getItem('wordflip-pace'))?localStorage.getItem('wordflip-pace'):'normal';
  $('learningPace').onchange=()=>{localStorage.setItem('wordflip-pace',$('learningPace').value);start();};
  document.querySelector('.brand').innerHTML='<img class="brand-logo" src="icon-180.png" alt="" aria-hidden="true"><span class="brand-word">word<span>flip.</span></span>';
  const versionFooter=document.createElement('footer');
  versionFooter.className='app-version-footer';
  versionFooter.textContent='v1.0';
  document.querySelector('main').append(versionFooter);
  $('settingsButton').innerHTML='<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .35 1.88l-2.87 2.87A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21h-4v-.05A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.35l-2.87-2.87A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3v-4h.05A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.35-1.88l2.87-2.87A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3h4v.05A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.35l2.87 2.87A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21v4h-.05A1.7 1.7 0 0 0 19.4 15Z"/></svg>';
  document.title='WordFlip';
  const readDirection=()=>{
    const selected=localStorage.getItem('wordflip-direction')||'auto';
    $('direction').innerHTML=`<option value="auto">Automatic · recommended</option><option value="hu-en">${languages[language].name} → English</option><option value="en-hu">English → ${languages[language].name}</option><option value="mixed">Both directions</option>`;
    $('direction').value=['auto','hu-en','en-hu','mixed'].includes(selected)?selected:'auto';
    document.querySelector('[data-category="all"]').textContent=selected==='auto'||!['auto','hu-en','en-hu','mixed'].includes(selected)?'✦ Automatic':'✦ All categories';
  };
  function updateLanguageStats(){
    for(const [code,meta] of Object.entries(languages)){
      let records={};try{records=JSON.parse(localStorage.getItem(window.WordFlipEngines[code].storageKey)||'{}');}catch{}
      const entries=Object.values(records);
      const mastered=entries.filter(p=>p.streak>=2).length;
      const due=entries.filter(p=>p.reviews>0&&(p.due||0)<=Date.now()).length;
      const el=$(`languageStat-${code}`);
      if(el)el.textContent=entries.length?`${mastered} mastered · ${due} due for review`:'Start learning →';
    }
  }
  function selectLanguage(code){
    const previousLanguage=language;
    language=code;engine=window.WordFlipEngines[code];history=loadHistory();
    arrangeCoins();
    closeCoins();
    activePhraseTopics=savedPhraseTopics();activePhraseLevel=localStorage.getItem(phraseLevelsKey())||'all';
    localStorage.setItem('wordflip-active-language',code);
    document.querySelectorAll('.language-choice').forEach(b=>b.classList.toggle('selected',b.dataset.language===code));
    // Horizontal screen transitions are managed by WordFlipDrill.
    document.querySelector('#study .intro .eyebrow').textContent=`YOUR DAILY PRACTICE · ${languages[code].flag} ${languages[code].name.toUpperCase()}`;
    $('speak').setAttribute('aria-label',`Speak ${languages[code].name}`);
    $('speak').title=`Hear ${languages[code].name}`;
    document.querySelector('[data-category="suffix"]').hidden=code!=='hu';
    adjectiveFilter.hidden=code!=='it';prepositionFilter.hidden=code!=='it';caseFilter.hidden=code!=='hr'&&code!=='de';articleFilter.hidden=code!=='de';orderFilter.hidden=code!=='de';
    cheatsheetPill.hidden=code!=='hu';
    updatePhrasePill();
    category='all';document.querySelectorAll('.pill').forEach(p=>p.classList.toggle('active',p.dataset.category==='all'));
    $('verbModeLabel').hidden=true;
    readDirection();
    updateLanguageStats();
    cards=[];$('frontText').textContent='Loading cards…';
    fetch(languages[code].data).then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(data=>{
      if(language!==code)return;
      cards=data;start();
    }).catch(()=>{if(language===code){$('frontText').textContent='Unable to load cards';$('frontTag').textContent='TRY RELOADING';}});
  }
  selectLanguage(language);
  // Service-worker registration and safe updates are managed by update-manager.js.
})();
