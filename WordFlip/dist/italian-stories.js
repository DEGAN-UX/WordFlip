(() => {
  'use strict';
  const collections={it:window.WordFlipItalianStories||[],hu:window.WordFlipHungarianStories||[],de:window.WordFlipGermanStories||[]};
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
  const savedKey=()=>`wordflip-${activeLanguage==='hu'?'hungarian':activeLanguage==='de'?'german':'italian'}-stories-read-v1`; 
  function readProgress(){try{return JSON.parse(localStorage.getItem(savedKey())||'[]');}catch{return [];}}
  function saveProgress(id){try{const seen=new Set(readProgress());seen.add(id);localStorage.setItem(savedKey(),JSON.stringify([...seen]));}catch{}}
  function currentLanguage(){return localStorage.getItem('wordflip-active-language');}
  function isSupported(){return ['it','hu','de'].includes(currentLanguage());}
  function dismiss(){
    tooltip.hidden=true;
    if(typeof inspectorSheet!=='undefined'&&!inspectorSheet.hidden){
      inspectorSheet.hidden=true;document.body.classList.remove('grammar-inspector-open');
    }
    activeWord?.classList.remove('story-word-selected');activeWord=null;
    if('speechSynthesis' in window)window.speechSynthesis.cancel();
  }
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
    const lang=activeLanguage==='hu'?'hu-HU':activeLanguage==='de'?'de-CH':'it-IT';
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang=lang;utterance.rate=.82;
    const voices=window.speechSynthesis.getVoices();
    const selected=voices.find(v=>v.lang.toLowerCase()===lang.toLowerCase())||
      voices.find(v=>v.lang.toLowerCase().startsWith(lang.slice(0,2).toLowerCase()));
    if(selected)utterance.voice=selected;
    window.speechSynthesis.speak(utterance);
  }

  // Curated grammar data. Never infer a full paradigm by stripping endings:
  // forms such as 'ist', 'ha' and separable verbs need explicit lexical entries.
  const grammarIndex={it:new Map(),de:new Map()};
  const keyForGrammar=value=>String(value||'').toLocaleLowerCase().replace(/^[^\\p{L}]+|[^\\p{L}]+$/gu,'').trim();
  function addVerb(lang,inf,meaning,forms,note=''){
    const persons=lang==='it'?['io','tu','lui / lei','noi','voi','loro']:
      ['ich','du','er / sie / es','wir','ihr','sie / Sie'];
    const table=forms.split('|').map((form,i)=>[persons[i],form.trim()]);
    const item={type:'Verb',lemma:inf,meaning,formLabel:lang==='it'?'Presente':'Präsens',forms:table,note};
    for(const form of [inf,...table.map(x=>x[1])]){
      const key=keyForGrammar(form);
      if(!grammarIndex[lang].has(key))grammarIndex[lang].set(key,item);
    }
  }
  const italianVerbs=[
    ['essere','to be','sono|sei|è|siamo|siete|sono'],
    ['avere','to have','ho|hai|ha|abbiamo|avete|hanno'],
    ['andare','to go','vado|vai|va|andiamo|andate|vanno','Irregular present tense.'],
    ['fare','to do / make','faccio|fai|fa|facciamo|fate|fanno'],
    ['stare','to stay / be','sto|stai|sta|stiamo|state|stanno'],
    ['dare','to give','do|dai|dà|diamo|date|danno'],
    ['dire','to say','dico|dici|dice|diciamo|dite|dicono'],
    ['venire','to come','vengo|vieni|viene|veniamo|venite|vengono'],
    ['uscire','to go out','esco|esci|esce|usciamo|uscite|escono'],
    ['bere','to drink','bevo|bevi|beve|beviamo|bevete|bevono'],
    ['mangiare','to eat','mangio|mangi|mangia|mangiamo|mangiate|mangiano'],
    ['parlare','to speak','parlo|parli|parla|parliamo|parlate|parlano'],
    ['lavorare','to work','lavoro|lavori|lavora|lavoriamo|lavorate|lavorano'],
    ['studiare','to study','studio|studi|studia|studiamo|studiate|studiano'],
    ['abitare','to live','abito|abiti|abita|abitiamo|abitate|abitano'],
    ['aspettare','to wait','aspetto|aspetti|aspetta|aspettiamo|aspettate|aspettano'],
    ['comprare','to buy','compro|compri|compra|compriamo|comprate|comprano'],
    ['cercare','to look for','cerco|cerchi|cerca|cerchiamo|cercate|cercano'],
    ['chiamare','to call','chiamo|chiami|chiama|chiamiamo|chiamate|chiamano'],
    ['guardare','to look / watch','guardo|guardi|guarda|guardiamo|guardate|guardano'],
    ['trovare','to find','trovo|trovi|trova|troviamo|trovate|trovano'],
    ['portare','to bring / carry','porto|porti|porta|portiamo|portate|portano'],
    ['tornare','to return','torno|torni|torna|torniamo|tornate|tornano'],
    ['arrivare','to arrive','arrivo|arrivi|arriva|arriviamo|arrivate|arrivano'],
    ['entrare','to enter','entro|entri|entra|entriamo|entrate|entrano'],
    ['pensare','to think','penso|pensi|pensa|pensiamo|pensate|pensano'],
    ['sentire','to hear / feel','sento|senti|sente|sentiamo|sentite|sentono'],
    ['dormire','to sleep','dormo|dormi|dorme|dormiamo|dormite|dormono'],
    ['partire','to leave','parto|parti|parte|partiamo|partite|partono'],
    ['finire','to finish','finisco|finisci|finisce|finiamo|finite|finiscono','-isc- inserted in singular and loro.'],
    ['capire','to understand','capisco|capisci|capisce|capiamo|capite|capiscono','-isc- inserted in singular and loro.'],
    ['preferire','to prefer','preferisco|preferisci|preferisce|preferiamo|preferite|preferiscono'],
    ['sapere','to know (facts)','so|sai|sa|sappiamo|sapete|sanno'],
    ['potere','to be able to','posso|puoi|può|possiamo|potete|possono'],
    ['volere','to want','voglio|vuoi|vuole|vogliamo|volete|vogliono'],
    ['dovere','to have to','devo|devi|deve|dobbiamo|dovete|devono'],
    ['prendere','to take','prendo|prendi|prende|prendiamo|prendete|prendono'],
    ['leggere','to read','leggo|leggi|legge|leggiamo|leggete|leggono'],
    ['scrivere','to write','scrivo|scrivi|scrive|scriviamo|scrivete|scrivono'],
    ['vedere','to see','vedo|vedi|vede|vediamo|vedete|vedono'],
    ['rispondere','to reply','rispondo|rispondi|risponde|rispondiamo|rispondete|rispondono'],
    ['piacere','to please / be liked','piaccio|piaci|piace|piacciamo|piacete|piacciono','Mi piace = I like it; mi piacciono = I like them.']
  ];
  const germanVerbs=[
    ['sein','to be','bin|bist|ist|sind|seid|sind'],
    ['haben','to have','habe|hast|hat|haben|habt|haben'],
    ['werden','to become','werde|wirst|wird|werden|werdet|werden'],
    ['gehen','to go','gehe|gehst|geht|gehen|geht|gehen'],
    ['kommen','to come','komme|kommst|kommt|kommen|kommt|kommen'],
    ['machen','to do / make','mache|machst|macht|machen|macht|machen'],
    ['arbeiten','to work','arbeite|arbeitest|arbeitet|arbeiten|arbeitet|arbeiten'],
    ['lernen','to learn','lerne|lernst|lernt|lernen|lernt|lernen'],
    ['sagen','to say','sage|sagst|sagt|sagen|sagt|sagen'],
    ['fragen','to ask','frage|fragst|fragt|fragen|fragt|fragen'],
    ['antworten','to answer','antworte|antwortest|antwortet|antworten|antwortet|antworten'],
    ['wohnen','to live','wohne|wohnst|wohnt|wohnen|wohnt|wohnen'],
    ['kaufen','to buy','kaufe|kaufst|kauft|kaufen|kauft|kaufen'],
    ['suchen','to look for','suche|suchst|sucht|suchen|sucht|suchen'],
    ['finden','to find','finde|findest|findet|finden|findet|finden'],
    ['warten','to wait','warte|wartest|wartet|warten|wartet|warten'],
    ['brauchen','to need','brauche|brauchst|braucht|brauchen|braucht|brauchen'],
    ['nehmen','to take','nehme|nimmst|nimmt|nehmen|nehmt|nehmen'],
    ['geben','to give','gebe|gibst|gibt|geben|gebt|geben'],
    ['sehen','to see','sehe|siehst|sieht|sehen|seht|sehen'],
    ['lesen','to read','lese|liest|liest|lesen|lest|lesen'],
    ['sprechen','to speak','spreche|sprichst|spricht|sprechen|sprecht|sprechen'],
    ['essen','to eat','esse|isst|isst|essen|esst|essen'],
    ['trinken','to drink','trinke|trinkst|trinkt|trinken|trinkt|trinken'],
    ['fahren','to travel / drive','fahre|fährst|fährt|fahren|fahrt|fahren'],
    ['schlafen','to sleep','schlafe|schläfst|schläft|schlafen|schlaft|schlafen'],
    ['tragen','to carry','trage|trägst|trägt|tragen|tragt|tragen'],
    ['helfen','to help','helfe|hilfst|hilft|helfen|helft|helfen'],
    ['wissen','to know (facts)','weiss|weisst|weiss|wissen|wisst|wissen','Swiss spelling without ß.'],
    ['können','to be able to','kann|kannst|kann|können|könnt|können'],
    ['müssen','to have to','muss|musst|muss|müssen|müsst|müssen'],
    ['wollen','to want','will|willst|will|wollen|wollt|wollen'],
    ['dürfen','to be allowed to','darf|darfst|darf|dürfen|dürft|dürfen'],
    ['sollen','to be supposed to','soll|sollst|soll|sollen|sollt|sollen'],
    ['mögen','to like','mag|magst|mag|mögen|mögt|mögen'],
    ['bleiben','to stay','bleibe|bleibst|bleibt|bleiben|bleibt|bleiben'],
    ['stehen','to stand','stehe|stehst|steht|stehen|steht|stehen'],
    ['liegen','to lie','liege|liegst|liegt|liegen|liegt|liegen'],
    ['zeigen','to show','zeige|zeigst|zeigt|zeigen|zeigt|zeigen'],
    ['erzählen','to tell / narrate','erzähle|erzählst|erzählt|erzählen|erzählt|erzählen'],
    ['denken','to think','denke|denkst|denkt|denken|denkt|denken'],
    ['entscheiden','to decide','entscheide|entscheidest|entscheidet|entscheiden|entscheidet|entscheiden']
  ];
  for(const row of italianVerbs)addVerb('it',...row);
  for(const row of germanVerbs)addVerb('de',...row);
  // Curated high-frequency noun, adjective and preposition facts.
  const grammarFacts={
    it:[
      ['casa','Noun','la casa','house','Plural: le case'],
      ['amico','Noun','l’amico / l’amica','friend','Plurals: gli amici / le amiche'],
      ['libro','Noun','il libro','book','Plural: i libri'],
      ['caffè','Noun','il caffè','coffee','Invariable plural: i caffè'],
      ['giorno','Noun','il giorno','day','Plural: i giorni'],
      ['tempo','Noun','il tempo','time / weather','Plural: i tempi'],
      ['buono','Adjective','buono','good','Comparative: migliore · superlative: ottimo'],
      ['grande','Adjective','grande','big / great','Comparative: più grande · superlative: grandissimo'],
      ['piccolo','Adjective','piccolo','small','Comparative: più piccolo · superlative: piccolissimo'],
      ['a','Preposition','a','to / at','Often introduces a destination or location: a Roma.'],
      ['di','Preposition','di','of / from','Can indicate possession: il libro di Anna.'],
      ['con','Preposition','con','with','Followed by a noun or pronoun: con me.']
    ],
    de:[
      ['Haus','Noun','das Haus','house','Plural: die Häuser · genitive: des Hauses'],
      ['Wohnung','Noun','die Wohnung','flat','Plural: die Wohnungen · dative: der Wohnung'],
      ['Buch','Noun','das Buch','book','Plural: die Bücher · genitive: des Buches'],
      ['Zug','Noun','der Zug','train','Plural: die Züge · dative: dem Zug'],
      ['Mann','Noun','der Mann','man','Plural: die Männer · accusative: den Mann'],
      ['Frau','Noun','die Frau','woman','Plural: die Frauen'],
      ['gut','Adjective','gut','good','Comparative: besser · superlative: am besten'],
      ['gross','Adjective','gross','big','Comparative: grösser · superlative: am grössten (Swiss spelling)'],
      ['klein','Adjective','klein','small','Comparative: kleiner · superlative: am kleinsten'],
      ['mit','Preposition','mit','with','Requires the dative case: mit dem Freund.'],
      ['für','Preposition','für','for','Requires the accusative case: für den Freund.'],
      ['wegen','Preposition','wegen','because of','Wegen expresses a reason, not a destination. In standard written German it normally governs the genitive: wegen des Wetters (because of the weather), wegen der Arbeit (because of work). Colloquial speech also commonly uses the dative: wegen dem Wetter. Swiss Standard German follows the written genitive convention.']
    ]
  };
  for(const [lang,rows] of Object.entries(grammarFacts))for(const [surface,type,lemma,meaning,note] of rows){
    grammarIndex[lang].set(keyForGrammar(surface),{type,lemma,meaning,note});
  }
  function inspectorData(word,parts){
    const text=keyForGrammar(word.textContent);
    const found=grammarIndex[activeLanguage]?.get(text);
    if(found)return found;
    if(activeLanguage==='hu'&&Array.isArray(parts)&&parts.length)
      return {type:'Hungarian morphology',lemma:parts[0][0],meaning:parts[0][1],
        note:'Suffixes change the role or meaning of the word. The breakdown below refers to this exact form.',
        parts};
    return null;
  }
  const inspectorSheet=document.createElement('div');
  inspectorSheet.className='grammar-inspector-sheet';inspectorSheet.hidden=true;
  inspectorSheet.innerHTML='<div class="grammar-inspector-backdrop"></div><section class="grammar-inspector-panel" role="dialog" aria-modal="true" aria-labelledby="grammarInspectorHeading"><div class="grammar-inspector-handle" aria-hidden="true"></div><header class="grammar-inspector-head"><div><span class="eyebrow">WORD IN CONTEXT</span><h2 id="grammarInspectorHeading"></h2></div><button type="button" class="grammar-inspector-close" aria-label="Close grammar details">×</button></header><div class="grammar-inspector-body"></div></section>';
  document.body.append(inspectorSheet);
  const closeInspector=()=>{
    inspectorSelection=null;
    inspectorSheet.hidden=true;
    document.body.classList.remove('grammar-inspector-open');
    if(activeWord){activeWord.focus({preventScroll:true});}
  };
  inspectorSheet.querySelector('.grammar-inspector-close').onclick=closeInspector;
  inspectorSheet.querySelector('.grammar-inspector-backdrop').onclick=closeInspector;
  function inspectorSpeak(text){
    if(!('speechSynthesis' in window))return;
    window.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang=activeLanguage==='de'?'de-CH':activeLanguage==='hu'?'hu-HU':'it-IT';
    utterance.rate=.83;window.speechSynthesis.speak(utterance);
  }
  // A word selection is an immutable snapshot: a previously opened drawer
  // must never provide content for a subsequently selected word.
  let inspectorSelection=null;
  function openInspector(selection){
    if(!selection||selection.word!==activeWord||!selection.data)return;
    const {word,data,language}=selection;
    if(language!==activeLanguage)return;
    inspectorSelection=selection;
    tooltip.hidden=true;
    const form=keyForGrammar(word.textContent);
    inspectorSheet.querySelector('h2').textContent=word.textContent.replace(/^[^\\p{L}]+|[^\\p{L}]+$/gu,'');
    const body=inspectorSheet.querySelector('.grammar-inspector-body');body.replaceChildren();
    const type=document.createElement('p');type.className='grammar-inspector-type';type.textContent=data.type;
    const lemma=document.createElement('p');lemma.className='grammar-inspector-lemma';
    lemma.textContent=data.lemma+' · '+data.meaning;
    body.append(type,lemma);
    // Show meaningful contextual guidance, not merely the same word translation.
    if(activeLanguage==='de'&&form==='wegen'){
      const heading=document.createElement('h3');heading.textContent='How to use wegen';body.append(heading);
      for(const [example,translation] of [
        ['Wegen des Wetters bleiben wir zu Hause.','Because of the weather, we are staying at home.'],
        ['Wegen meiner Arbeit komme ich später.','Because of my work, I am coming later.']
      ]){
        const p=document.createElement('p');p.className='grammar-inspector-context';
        p.textContent=example+' — '+translation;body.append(p);
      }
    }
    if(data.forms){
      const heading=document.createElement('h3');heading.textContent='Present tense · '+data.formLabel;body.append(heading);
      const table=document.createElement('div');table.className='grammar-inspector-paradigm';
      for(const [person,value] of data.forms){
        const row=document.createElement('div');row.className='grammar-inspector-form';
        if(keyForGrammar(value)===form)row.classList.add('is-selected');
        const pronoun=document.createElement('span');pronoun.textContent=person;
        const formButton=document.createElement('button');formButton.type='button';
        formButton.textContent=value;formButton.setAttribute('aria-label','Pronounce '+person+' '+value);
        formButton.onclick=()=>inspectorSpeak(value);
        row.append(pronoun,formButton);table.append(row);
      }
      body.append(table);
      const note=document.createElement('p');note.className='grammar-inspector-context';
      note.textContent='Highlighted: the form found in this story. Tap a form to hear it.';
      body.append(note);
    }
    if(data.parts){
      const table=document.createElement('div');table.className='grammar-inspector-paradigm';
      for(const [part,meaning] of data.parts){
        const row=document.createElement('div');row.className='grammar-inspector-form';
        const a=document.createElement('strong');a.textContent=part;
        const b=document.createElement('span');b.textContent=meaning;
        row.append(a,b);table.append(row);
      }
      body.append(table);
    }
    if(data.note){
      const note=document.createElement('p');note.className='grammar-inspector-context';
      note.textContent=data.note;body.append(note);
    }
    inspectorSheet.hidden=false;document.body.classList.add('grammar-inspector-open');
    inspectorSheet.querySelector('.grammar-inspector-close').focus({preventScroll:true});
  }
  document.addEventListener('keydown',event=>{
    if(inspectorSheet.hidden)return;
    if(event.key==='Escape'){event.preventDefault();closeInspector();}
    if(event.key==='Tab'){
      const controls=[...inspectorSheet.querySelectorAll('button')];
      const n=controls.indexOf(document.activeElement);
      if(event.shiftKey&&n===0){event.preventDefault();controls[controls.length-1].focus();}
      if(!event.shiftKey&&n===controls.length-1){event.preventDefault();controls[0].focus();}
    }
  });
  function showGloss(word,meaning,parts){
    if(activeWord===word){dismiss();return;}
    dismiss();activeWord=word;word.classList.add('story-word-selected');
    tooltip.replaceChildren();
    const main=document.createElement('strong');main.textContent=meaning;
    const original=document.createElement('small');original.textContent=word.textContent;
    tooltip.append(main,original);
    const insight=inspectorData(word,parts);
    if(insight){
      const more=document.createElement('button');more.type='button';
      more.className='story-word-inspect';
      more.textContent='Grammar details · Expand';
      more.setAttribute('aria-label','Show grammar details for '+word.textContent);
      const selection={word,data:insight,language:activeLanguage};
      more.onclick=event=>{
        event.stopPropagation();
        if(activeWord!==selection.word)return;
        openInspector(selection);
      };
      tooltip.append(more);
    }
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
      const top=document.createElement('span');top.className='story-choice-top';top.textContent='STORY '+String(i+1).padStart(2,'0')+' · '+(story.level||'pre-A1')+' · '+(story.topic||'Everyday life');
      const title=document.createElement('strong');title.textContent=story.title;
      const en=document.createElement('span');en.className='story-choice-subtitle';en.textContent=story.subtitle;
      button.append(top,title,en);
      if(visited.has(story.id)){
        const status=document.createElement('span');
        status.className='story-choice-read-icon';
        status.setAttribute('aria-label','Previously opened');
        status.setAttribute('title','Previously opened');
        status.setAttribute('aria-hidden','true');
        status.innerHTML='<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6.5c-2.8-2-5.7-2.3-9-1.5v13c3.4-.8 6.4-.5 9 1.5 2.6-2 5.6-2.3 9-1.5V5c-3.3-.8-6.2-.5-9 1.5Z"/><path d="M12 6.5v13"/></svg>';
        const readLabel=document.createElement('small');readLabel.textContent='Read';status.append(readLabel);
        button.append(status);
      }
      button.setAttribute('aria-label',story.title+(visited.has(story.id)?', opened before':'')+'. Open story');
      button.onclick=()=>window.WordFlipDrill.run('forward',()=>openStory(i));grid.append(button);
    });
  }
  function openStory(i){
    const story=stories[i];if(!story)return;
    dismiss();currentStory=i;
    root.querySelector('.story-list-view').hidden=true;
    root.querySelector('.story-read-view').hidden=false;
    root.querySelector('.story-kicker').textContent='STORY '+String(i+1).padStart(2,'0')+' OF '+stories.length+' · '+(story.level||'pre-A1');
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
    const name=code==='hu'?'Hungarian':code==='it'?'Italian':code==='de'?'German':'Croatian';
    hub.querySelector('.activity-intro .eyebrow').textContent=(code==='hu'?'🇭🇺':code==='it'?'🇮🇹':code==='de'?'🇩🇪':'🇭🇷')+' '+name.toUpperCase();
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
    const name=activeLanguage==='hu'?'Hungarian':activeLanguage==='de'?'German':'Italian';
    root.querySelector('.stories-intro .eyebrow').textContent=(activeLanguage==='hu'?'🇭🇺':activeLanguage==='de'?'🇩🇪':'🇮🇹')+' LEARN THROUGH READING';
    root.querySelector('.stories-intro p').textContent=stories.length+' graded '+name+' stories. Tap a word to hear it and see its English meaning'+(activeLanguage==='hu'?', with grammar breakdowns where useful.':'.');
    root.querySelector('.story-instructions').textContent='Tap a word for its translation and pronunciation'+(activeLanguage==='hu'?' — plus its endings when helpful.':'.');
    root.querySelector('.story-text').lang=activeLanguage==='de'?'de-CH':activeLanguage;
    dismiss();
    hideHub();
    document.body.classList.remove('training');
    document.body.classList.add('language-selected','stories-view-open');
    root.hidden=false;
    root.querySelector('.story-read-view').hidden=true;
    root.querySelector('.story-list-view').hidden=false;
    renderList();scrollTop();
  }
  // Language selection and its hub are one atomic drill-down navigation.
  window.WordFlipOpenPractice=()=>showPractice();
  window.WordFlipOpenStories=()=>showStories();
  window.WordFlipStoriesAvailable=()=>isSupported();
  window.WordFlipShowHub=showHub;
  window.WordFlipHideStoryViews=()=>{hideHub();hideStories();};

  function showPractice(){
    // Show category pills and the existing "Start practice" button first.
    // The training-layout module owns starting an actual flashcard session.
    hideHub();hideStories();
    document.body.classList.remove('training','progress-view-open');
    document.body.classList.add('language-selected');
    study.classList.remove('hidden');
    const summary=document.getElementById('summary');
    if(summary)summary.style.display='none';
    const progress=document.getElementById('learningProgress');
    if(progress)progress.hidden=true;
    scrollTop();
  }
  practiceButton.onclick=()=>window.WordFlipDrill.run('forward',showPractice);
  readButton.onclick=()=>window.WordFlipDrill.run('forward',showStories);
  // Flashcards also offer a clear return route to the activity choices.
  const practiceBack=document.createElement('button');practiceBack.type='button';
  practiceBack.className='story-back activity-practice-back';practiceBack.textContent='← Activities';
  study.insertAdjacentElement('afterbegin',practiceBack);
  practiceBack.onclick=()=>window.WordFlipNavigateToLanguages?.();
  // The existing results-screen Return to menu button now returns to activities.
  const resultsBack=document.getElementById('returnToMenu');
  if(resultsBack)resultsBack.onclick=()=>window.WordFlipDrill.run('back',showPractice);
  const listBack=document.createElement('button');listBack.type='button';
  listBack.className='story-back story-library-back';listBack.textContent='← Back to practice';
  root.querySelector('.story-list-view').prepend(listBack);
  listBack.onclick=()=>window.WordFlipDrill.run('back',()=>window.WordFlipGoToPractice?.());
  root.querySelector('.story-read-view .story-back').onclick=()=>window.WordFlipDrill.run('back',closeReading);
  root.querySelector('.story-previous').onclick=()=>window.WordFlipDrill.run('back',()=>openStory(currentStory-1));
  root.querySelector('.story-next').onclick=()=>window.WordFlipDrill.run(currentStory<stories.length-1?'forward':'back',()=>currentStory<stories.length-1?openStory(currentStory+1):closeReading());
  document.addEventListener('pointerdown',event=>{
    // Interacting with the tooltip (especially its Grammar details button)
    // must not dismiss it before the ensuing click event is dispatched.
    if(!inspectorSheet.hidden||tooltip.hidden)return;
    if(tooltip.contains(event.target))return;
    if(event.target.closest('.story-word')===activeWord)return;
    dismiss();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')dismiss();});
  window.addEventListener('scroll',dismiss,{passive:true});
  window.addEventListener('resize',dismiss,{passive:true});
  // Keep navigation explicit. Watching and rewriting body classes in a
  // MutationObserver can create re-entrant updates and freeze navigation.
  // The app's language switch invokes WordFlipHideStoryViews within its transition.
  // Settings must be reachable on the story library and the reader.
  // Leave the reader in place; the settings panel can open above it.
  document.getElementById('settingsButton')?.addEventListener('click',()=>{
    dismiss();
    scrollTop();
  });
})();