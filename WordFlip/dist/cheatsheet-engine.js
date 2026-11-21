// Self-contained adaptive Cheatsheet engine; progress shares Hungarian's existing local history.
window.WordFlipCheatsheet=(()=>{
  const {records,categories}=window.WordFlipCheatsheetData;
  const configKey='wordflip-cheatsheet-categories-v1';
  const all=categories.map(([id])=>id);
  const enabled=()=>{
    try{const found=JSON.parse(localStorage.getItem(configKey));
      if(Array.isArray(found))return all.filter(c=>found.includes(c));
    }catch{}
    return all.slice();
  };
  const saveEnabled=ids=>localStorage.setItem(configKey,JSON.stringify(all.filter(c=>ids.includes(c))));
  const key=(r,type)=>`cheatsheet:${r.patternId}:${type}`;
  const types=['recognition','recall','application'];
  const tiers=[[.5,.35,.15],[.3,.35,.35],[.2,.3,.5]];
  const score=(history,r,type)=>{
    const s=history[key(r,type)]||{};
    return Math.min(1,(s.correct||0)/Math.max(2,(s.reviews||0)))*Math.min(1,(s.reviews||0)/3);
  };
  const profile=(history,r)=>{
    const p=types.map(t=>score(history,r,t));
    return p[1]>.65&&p[2]>.4?2:p[0]>.42?1:0;
  };
  const hash=s=>[...s].reduce((a,c)=>(a*33+c.charCodeAt(0))>>>0,5381);
  const unique=list=>[...new Set(list.filter(Boolean))];
  const shuffle=(list,seed)=>list.slice().sort((a,b)=>hash(`${seed}|${a}`)-hash(`${seed}|${b}`));
  const alternateSuffixes={
    '-ban':['-ba','-ból','-nál'],'-ben':['-be','-ből','-nél'],
    '-ba':['-ban','-ból','-ra'],'-be':['-ben','-ből','-re'],
    '-ból':['-ban','-ba','-ról'],'-ből':['-ben','-be','-ről'],
    '-on':['-ra','-ról','-ban'],'-en':['-re','-ről','-ben'],
    '-ön':['-re','-ről','-ben'],'-hoz':['-nál','-tól','-ra'],
    '-hez':['-nél','-től','-re'],'-höz':['-nél','-től','-re']
  };
  function distractors(r,type){
    const sameCategory=records.filter(other=>other.id!==r.id&&other.category===r.category);
    const sameStem=records.filter(other=>other.id!==r.id&&other.stem===r.stem);
    const seed=r.number;
    if(type==='recall'){
      const candidates=unique([...(alternateSuffixes[r.suffix]||[]),...sameStem.map(o=>o.suffix),
        ...sameCategory.filter(o=>o.context===r.context).map(o=>o.suffix),...sameCategory.map(o=>o.suffix)]);
      return shuffle(candidates.filter(x=>x!==r.suffix),seed).slice(0,3);
    }
    if(type==='application'){
      const related=unique([...sameStem.map(o=>o.form),
        ...((alternateSuffixes[r.suffix]||[]).map(s=>r.stem+s.slice(1))),
        ...sameCategory.filter(o=>o.stem===r.stem).map(o=>o.form),
        ...sameCategory.map(o=>r.stem+o.suffix.replace('-',''))]);
      return shuffle(related.filter(x=>x!==r.form),seed).slice(0,3);
    }
    const sameForm=records.filter(o=>o.form===r.form&&o.id!==r.id);
    // A form like tanultam may mean either 'I learnt' or 'I learnt it'; never ask it in isolation.
    if(sameForm.length)return [];
    const related=unique([...sameStem.map(o=>o.english),...sameCategory.map(o=>o.english)]);
    return shuffle(related.filter(x=>x!==r.english),seed).slice(0,3);
  }
  function makeQuestion(r,type,history={}){
    const canHighlight=r.suffix!=='∅'&&r.form.endsWith(r.suffix.replace('-',''));
    const suffixMeanings=unique(records.filter(o=>o.category===r.category&&o.meaning!==r.meaning).map(o=>o.meaning));
    const suffixOnly=type==='recognition'&&canHighlight&&r.number%2===1&&suffixMeanings.length>=3&&score(history,r,'recognition')<.5;
    const correct=type==='recognition'?(suffixOnly?r.meaning:r.english):type==='recall'?r.suffix:r.form;
    const wrong=suffixOnly?shuffle(suffixMeanings,r.number).slice(0,3):distractors(r,type);
    if(wrong.length<3)return null;
    const context=r.context==='none'?'':r.context;
    let prompt,sub;
    if(type==='recognition'){
      prompt=r.form;
      sub=suffixOnly?'What does the highlighted ending mean?':'What does this Hungarian form mean?';
    }else if(type==='recall'){
      prompt=r.meaning.toUpperCase();
      sub=`Base: ${r.stem} · ${context} · Choose the ending`;
    }else{
      prompt=r.english.toUpperCase();
      sub=`Base: ${r.stem} · ${context} · Choose the complete Hungarian form`;
    }
    const choices=shuffle([correct,...wrong],r.number+':'+type);
    if(unique(choices).length!==4||choices.filter(v=>v===correct).length!==1)return null;
    return {record:r,type,correct,choices,prompt,sub,suffixOnly,canHighlight};
  }
  function createSession(history,selected,length,now=Date.now()){
    const pool=records.filter(r=>selected.includes(r.category));
    const candidates=[];
    for(const r of pool){
      const tier=profile(history,r),preferred=tiers[tier];
      for(const type of r.supportedQuestionTypes){
        const q=makeQuestion(r,type,history);if(!q)continue;
        const review=history[key(r,type)]||{};
        const due=!review.reviews||(review.due||0)<=now;
        const weakness=1-score(history,r,type);
        const overdue=review.reviews&&due?Math.min(2,(now-(review.due||now))/86400000):0;
        // Type weights shift gradually from recognition to application, per grammatical pattern.
        const weight=preferred[types.indexOf(type)];
        const priority=(due?2:0)+weakness+weight*2+overdue+(review.consecutiveMisses||0)*.3;
        candidates.push({...q,priority,due,tier,review});
      }
    }
    candidates.sort((a,b)=>b.priority-a.priority||(a.review.reviews||0)-(b.review.reviews||0)||
      (a.review.due||0)-(b.review.due||0)||a.record.number-b.record.number);
    const chosen=[],used=new Set(),typeCount={recognition:0,recall:0,application:0};
    const meanTargets=tiers[0].map((_,i)=>candidates.reduce((sum,c)=>sum+tiers[c.tier][i],0)/Math.max(1,candidates.length));
    while(chosen.length<length){
      const remaining=candidates.filter(c=>!used.has(c.record.id)&&(c.due||!chosen.length));
      if(!remaining.length)break;
      const nextNumber=chosen.length+1;
      const preferredType=types.slice().sort((a,b)=>
        (meanTargets[types.indexOf(b)]*nextNumber-typeCount[b])-
        (meanTargets[types.indexOf(a)]*nextNumber-typeCount[a]))
        .find(type=>remaining.some(c=>c.type===type));
      const selected=remaining.filter(c=>c.type===preferredType).sort((a,b)=>b.priority-a.priority||a.record.number-b.record.number)[0];
      chosen.push(selected);used.add(selected.record.id);typeCount[selected.type]++;
    }
    // Keep the category usable even when all reviews are scheduled for the future.
    if(!chosen.length)for(const q of candidates){if(!used.has(q.record.id)){used.add(q.record.id);chosen.push(q);}if(chosen.length>=length)break;}
    return chosen;
  }
  function recordAnswer(history,q,correct,now=Date.now()){
    const k=key(q.record,q.type),prev=history[k]||{};
    const streak=correct?(prev.streak||0)+1:0;
    const hours=correct?[1,6,24,72,168][Math.min(4,streak-1)]:.12;
    history[k]={...prev,reviews:(prev.reviews||0)+1,correct:(prev.correct||0)+(correct?1:0),
      misses:(prev.misses||0)+(correct?0:1),streak,consecutiveMisses:correct?0:(prev.consecutiveMisses||0)+1,
      last:now,due:now+hours*3600000,lastRating:correct?'knew':'again',lastWrongChoice:correct?null:q.chosen,
      recentRatings:window.WordFlipProgress.recordRecent(prev,correct?'knew':'again')};
  }
  function explanation(r){
    if(r.number===91)return 'The form tanultam is identical in first-person past definite and indefinite conjugation; context determines the object.';
    if(r.number===42)return 'Budapesten is the conventional city form. Not every city uses -en.';
    if(r.context.includes('assimilation'))return `The ending ${r.suffix} assimilates to the final consonant: ${r.stem} → ${r.form}.`;
    if(r.context.includes('a → á'))return `Final a lengthens to á before the ending: ${r.stem} → ${r.form}.`;
    if(r.category==='cases')return `${r.suffix} expresses “${r.meaning}” here (${r.context}).`;
    if(r.category==='plurals')return `${r.form} is the plural of ${r.stem}. The linking vowel depends on the noun.`;
    if(r.category==='possessives')return `${r.suffix} marks “${r.meaning}” with ${r.stem}; possession endings vary by stem.`;
    if(r.category==='accusative')return `${r.form} marks the direct object. Some nouns need a linking vowel or stem change.`;
    return `${r.form} means “${r.english}” (${r.context}). The verb ending marks person, number and conjugation.`;
  }
  return {categories,records,enabled,saveEnabled,createSession,recordAnswer,explanation,key,score,makeQuestion};
})();
