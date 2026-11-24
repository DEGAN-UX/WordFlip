// Deterministic, explainable session selection. No progress data is rewritten here.
window.WordFlipAdaptive = (() => {
  const weights = {
    hu: {word:0.35,phrase:0.25,verb:0.25,suffix:0.15},
    it: {word:0.34,phrase:0.27,verb:0.23,description:0.09,preposition:0.07},
    hr: {word:0.48,phrase:0.36,verb:0.11,case:0.05},
    de: {word:0.25,verb:0.17,phrase:0.18,case:0.16,article:0.12,order:0.12}
  };
  const paceLimits={slow:3,normal:6,fast:10};
  const progress=(history,id,language,reverse)=>history[`${id}:${reverse?'en-'+language:language+'-en'}`]||{};
  const verbKey=(id,stage)=>`${id}:hu-${stage}`;
  function hungarianVerbStage(card,history,choice){
    if(choice==='hu-en')return 'recognition';
    if(choice==='en-hu')return 'production';
    const recognition=history[verbKey(card.id,'recognition')]||{};
    const guided=history[verbKey(card.id,'guided')]||{};
    const production=history[verbKey(card.id,'production')]||{};
    const legacy=history[`${card.id}:hu-en`]||{};
    if(choice==='mixed')return (guided.reviews||legacy.reviews)?'production':'guided';
    if(production.needsSupport)return 'guided';
    if(guided.needsSupport)return 'recognition';
    if(production.reviews)return 'production';
    if(guided.reviews)return guided.correct>=1?'production':'guided';
    if(legacy.correct)return 'guided'; // Old prompts were guided, not genuine production.
    if(recognition.correct>=1)return 'guided';
    return 'recognition';
  }
  const group=(card,language)=>{
    if(language==='it'&&card.category==='word'){
      if(['adjective','adverb'].includes(card.partOfSpeech))return 'description';
      if(card.partOfSpeech==='preposition')return 'preposition';
    }
    return card.category;
  };
  function pickDirection(card,history,language,choice){
    if(language==='de'&&['case','article','order'].includes(card.category))return false;
    if(choice==='hu-en')return false;
    if(choice==='en-hu')return true;
    const recognition=progress(history,card.id,language,false);
    const recall=progress(history,card.id,language,true);
    if(choice==='mixed'){
      // In a deliberate both-directions drill, favour the less-practised side.
      return (recall.reviews||0)<(recognition.reviews||0);
    }
    if(recall.needsSupport)return false;
    if(recall.reviews)return true;
    // Move into production early, normally by the second successful recognition.
    if((recognition.correct||0)>=2||(recognition.streak||0)>=2)return true;
    if((recognition.correct||0)>=1&&(card.priority||0)%4===0)return true;
    return false;
  }
  function createSession({cards,history,engine,language,category,direction,length,verbMode='auto',pace='normal',phraseTopics=null,phraseLevel='all',extraOnly=false,now=Date.now()}){
    const automatic=category==='all'&&direction==='auto';
    const unlocked=engine.unlocked(cards,history);
    const pool=cards.filter(c=>{
      if(language==='it'&&c.category==='article')return false;
      if((language==='it'||language==='hr'||language==='de')&&category==='phrase'&&c.category==='phrase'){
        if(phraseTopics&&phraseTopics.length&&!phraseTopics.includes(c.topic||'everyday'))return false;
        if(phraseLevel!=='all'&&c.level!==phraseLevel)return false;
      }
      const matches=category==='all'||c.category===category||
        (language==='it'&&category==='description'&&group(c,language)==='description')||
        (language==='it'&&category==='preposition'&&group(c,language)==='preposition');
      // Previously studied cards stay eligible even if the unlocking formula
      // changes between app versions. Never strand an older user's reviews.
      const studied=!!progress(history,c.id,language,false).reviews||!!progress(history,c.id,language,true).reviews||
        language==='hu'&&c.category==='verb'&&['recognition','guided','production'].some(s=>history[verbKey(c.id,s)]?.reviews);
      // Automatic mode may replenish its next batch beyond the current unlock
      // threshold. Explicit focus modes retain their original boundaries.
      return matches&&(automatic||category!=='all'||(c.priority||0)<=unlocked||studied);
    });
    const candidates=pool.map(card=>{
      const verbStage=language==='hu'&&card.category==='verb'?
        (category==='verb'&&verbMode!=='auto'?verbMode:hungarianVerbStage(card,history,direction)):null;
      const reverse=verbStage?verbStage==='production':pickDirection(card,history,language,direction);
      const progressKey=verbStage?verbKey(card.id,verbStage):`${card.id}:${reverse?'en-'+language:language+'-en'}`;
      const selected=verbStage?(history[progressKey]||{}):progress(history,card.id,language,reverse);
      const recognition=progress(history,card.id,language,false);
      const recall=progress(history,card.id,language,true);
      const verbStudied=verbStage&&['recognition','guided','production'].some(s=>history[verbKey(card.id,s)]?.reviews);
      const isNew=verbStage?!(verbStudied||recognition.reviews||recall.reviews):!(recognition.reviews||recall.reviews);
      const support=verbStage?!!selected.needsSupport||verbStage==='guided'&&!!history[verbKey(card.id,'production')]?.needsSupport||verbStage==='recognition'&&!!history[verbKey(card.id,'guided')]?.needsSupport:direction==='auto'&&!reverse&&!!recall.needsSupport;
      const due=support||(!selected.reviews&&!isNew)||!!selected.reviews&&(selected.due||0)<=now;
      const difficulty=(selected.reviews||0)>0?Math.max(0,1-(selected.correct||0)/(selected.reviews||1)):0;
      const reason=verbStage?({recognition:'Verb recognition',guided:'Guided conjugation',production:'Active verb production'})[verbStage]:language==='de'&&['case','article','order'].includes(card.category)?'Grammar practice':isNew?'New vocabulary':support?'Recognition support':reverse?'Active recall':due?'Review due':'Recognition';
      return {...card,reverse,verbStage,progressKey,learningReason:reason,isNew,isDue:due,difficulty,learningGroup:group(card,language),review:selected,withinUnlock:(card.priority||0)<=unlocked};
    });
    // Optional extra practice uses only already-studied, NOT-YET-DUE cards.
    // It never sneaks into an ordinary automatic session.
    if(extraOnly){
      return candidates.filter(c=>!c.isNew&&!c.isDue).sort((a,b)=>
        b.difficulty-a.difficulty||(a.review.last||0)-(b.review.last||0)
      ).slice(0,length);
    }
    // Explicit focus modes remain available; automatic enforces a new-card cap.
    if(!automatic){
      candidates.sort((a,b)=>Number(b.isDue)-Number(a.isDue)||Number(a.isNew)-Number(b.isNew)||
        (a.review.due||0)-(b.review.due||0)||(a.priority||0)-(b.priority||0));
      return candidates.slice(0,length);
    }
    const dueCount=candidates.filter(c=>c.isDue).length;
    const practised=candidates.some(c=>!c.isNew);
    const newLimit=Math.max(1,Math.min(length,
      (paceLimits[pace]||paceLimits.normal)+(practised?0:4)-(dueCount>length/2?3:0)));
    const groups=weights[language];
    const failures=Object.fromEntries(Object.keys(groups).map(g=>[g,{miss:0,total:0}]));
    for(const c of candidates){
      const p=c.review,stats=failures[c.learningGroup];if(!stats||!p.reviews)continue;
      stats.miss+=Math.max(0,p.reviews-(p.correct||0));stats.total+=p.reviews;
    }
    const adjusted=Object.fromEntries(Object.entries(groups).map(([g,w])=>{
      const stats=failures[g];return [g,w*(1+Math.min(.7,stats.miss/(stats.total||1))*.6)];
    }));
    const used=Object.fromEntries(Object.keys(groups).map(g=>[g,0]));
    const selected=[];let introduced=0;
    while(selected.length<length){
      const remaining=candidates.filter(c=>!selected.includes(c));
      let available=remaining.filter(c=>!c.isNew&&c.isDue||c.isNew&&c.withinUnlock&&introduced<newLimit);
      if(!available.length&&introduced<newLimit){
        // Exhausted the currently unlocked material: introduce the next small
        // priority-ordered batch without suddenly exposing the entire corpus.
        const next=remaining.filter(c=>c.isNew&&!c.withinUnlock)
          .sort((a,b)=>(a.priority||0)-(b.priority||0));
        available=next.slice(0,Math.max(12,newLimit*3));
      }
      // Respect future due dates. A normal session can be shorter than
      // requested (or empty) when there are no due reviews/new cards.
      if(!available.length)break;
      // Overdue first. Among comparable cards, favour underrepresented skills.
      available.sort((a,b)=>{
        if(a.isDue!==b.isDue)return a.isDue?-1:1;
        const ar=(used[a.learningGroup]||0)/(adjusted[a.learningGroup]||.01);
        const br=(used[b.learningGroup]||0)/(adjusted[b.learningGroup]||.01);
        return ar-br||b.difficulty-a.difficulty||
          (a.review.due||0)-(b.review.due||0)||(a.priority||0)-(b.priority||0);
      });
      const item=available[0];selected.push(item);
      used[item.learningGroup]=(used[item.learningGroup]||0)+1;
      if(item.isNew)introduced++;
    }
    return selected;
  }
  // Selection stays adaptive; only the presentation order is random.
  // A Fisher-Yates shuffle avoids the bias of sort(() => Math.random() - .5).
  // Keep the preceding session's first card out of the first position when
  // another card is available (including Hungarian cheatsheet questions).
  const sessionCardId=card=>card?.id??card?.record?.id??null;
  function shuffleSession(cards,previousFirstId=null,random=Math.random){
    const ordered=cards.slice();
    for(let i=ordered.length-1;i>0;i--){
      const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));
      [ordered[i],ordered[j]]=[ordered[j],ordered[i]];
    }
    if(ordered.length>1&&previousFirstId!==null&&sessionCardId(ordered[0])===previousFirstId){
      const alternatives=[];
      for(let i=1;i<ordered.length;i++){
        if(sessionCardId(ordered[i])!==previousFirstId)alternatives.push(i);
      }
      if(alternatives.length){
        const j=alternatives[Math.min(alternatives.length-1,Math.max(0,Math.floor(random()*alternatives.length)))];
        [ordered[0],ordered[j]]=[ordered[j],ordered[0]];
      }
    }
    return ordered;
  }
  function updatedRecallSupport({history,card,language,reverse,rating,now}){
    const recallKey=`${card.id}:en-${language}`;
    const recall=history[recallKey];
    if(reverse){
      if(rating==='again'&&recall.consecutiveMisses>=2)recall.needsSupport=true;
    }else if(recall?.needsSupport&&rating!=='again'){
      // One successful recognition is enough scaffolding; retry recall soon.
      recall.needsSupport=false;recall.consecutiveMisses=0;
      recall.due=Math.min(recall.due||now+360000,now+360000);
    }
  }
  function updatedVerbSupport({history,card,rating,now}){
    const stage=card.verbStage;
    if(!stage)return;
    const current=history[verbKey(card.id,stage)];
    if(rating==='again'&&current.consecutiveMisses>=2&&stage!=='recognition')current.needsSupport=true;
    if(rating==='knew'){
      const next=stage==='recognition'?'guided':stage==='guided'?'production':null;
      if(next){
        const key=verbKey(card.id,next),record=history[key]||{};
        if(record.needsSupport){record.needsSupport=false;record.consecutiveMisses=0;}
        record.due=Math.min(record.due||now+360000,now+360000);
        history[key]=record;
      }
    }
  }
  return {createSession,shuffleSession,pickDirection,hungarianVerbStage,updatedRecallSupport,updatedVerbSupport};
})();
