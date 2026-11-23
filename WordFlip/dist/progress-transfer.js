// Portable, versioned progress backups and concise learning reports.
// Metadata is descriptive only: it must never replace the app's card bank.
window.WordFlipTransfer=(()=>{
  const codes=['hu','it','hr','de'];
  const forbidden=new Set(['__proto__','prototype','constructor']);
  function validateRecords(records,code){
    if(!records||typeof records!=='object'||Array.isArray(records))throw Error(`${code} progress has an invalid structure.`);
    if(Object.keys(records).length>50000)throw Error('Backup contains too many records.');
    for(const [key,record] of Object.entries(records)){
      if(forbidden.has(key)||key.length>250||!record||typeof record!=='object'||Array.isArray(record))throw Error(`Invalid ${code} progress entry.`);
      for(const field of ['streak','reviews','correct','recognised','misses','consecutiveMisses','due','last']){
        if(record[field]!==undefined&&(!Number.isFinite(record[field])||record[field]<0))throw Error(`Invalid ${code} progress value.`);
      }
      if(record.lastRating!==undefined&&!['again','recognised','knew'].includes(record.lastRating))throw Error(`Invalid ${code} review rating.`);
    }
  }
  function validateBackup(data){
    if(!data||data.format!=='wordflip-progress'||![1,2].includes(data.version)||!data.progress||
      !['hu','it'].every(code=>Object.hasOwn(data.progress,code)))throw Error('This is not a supported WordFlip progress backup.');
    codes.forEach(code=>validateRecords(data.progress[code]||{},code));
    return data.progress;
  }
  function contentLookup(banks,cheatsheetRecords=[]){
    const lookup={hu:new Map(),it:new Map(),hr:new Map(),de:new Map()};
    for(const code of codes)for(const card of banks[code]||[]){
      lookup[code].set(card.id,{id:card.id,category:card.category,source:card[code],english:card.en,
        partOfSpeech:card.partOfSpeech||undefined,level:card.level||undefined,
        example:card[`example${code==='hu'?'Hu':code==='it'?'It':code==='hr'?'Hr':'De'}`]||undefined,exampleEnglish:card.exampleEn||undefined});
    }
    for(const record of cheatsheetRecords)lookup.hu.set(record.patternId,{id:record.patternId,category:`cheatsheet / ${record.category}`,
      source:record.form,english:record.english,stem:record.stem,suffix:record.suffix,meaning:record.meaning});
    return lookup;
  }
  function idFromKey(key){
    if(key.startsWith('cheatsheet:'))return key.slice('cheatsheet:'.length).replace(/:(recognition|recall|application)$/,'');
    return key.replace(/:(hu-en|en-hu|it-en|en-it|hr-en|en-hr|de-en|en-de|hu-recognition|hu-guided|hu-production)$/,'');
  }
  function metadata(progress,lookup){
    return Object.fromEntries(codes.map(code=>[code,[...new Set(Object.keys(progress[code]||{}).map(idFromKey))]
      .map(id=>lookup[code].get(id)).filter(Boolean)]));
  }
  function stats(records){
    const reviewed=Object.entries(records).filter(([,r])=>(r.reviews||0)>0);
    const total=(field)=>reviewed.reduce((sum,[,r])=>sum+(r[field]||0),0);
    return {trackedEntries:reviewed.length,uniqueCards:new Set(reviewed.map(([key])=>idFromKey(key))).size,
      reviews:total('reviews'),correct:total('correct'),recognised:total('recognised'),misses:total('misses'),
      dueNow:reviewed.filter(([,r])=>(r.due||0)<=Date.now()).length};
  }
  function createBackup(progress,lookup,exportedAt=new Date().toISOString()){
    codes.forEach(code=>validateRecords(progress[code]||{},code));
    return {format:'wordflip-progress',version:2,exportedAt,
      contentVersion:'wordflip-2026-11',progress,
      cardContext:metadata(progress,lookup),summary:Object.fromEntries(codes.map(code=>[code,stats(progress[code]||{})]))};
  }
  function mergeProgress(current,incoming){
    const merged={};
    for(const code of codes){
      validateRecords(current[code]||{},code);validateRecords(incoming[code]||{},code);
      merged[code]={...(current[code]||{})};
      for(const [key,record] of Object.entries(incoming[code]||{})){
        const existing=merged[code][key];
        // A newer snapshot wins. Summing counters would double-count reviews
        // shared by exports from the same device.
        if(!existing||(record.last||0)>(existing.last||0)||
          (record.last||0)===(existing.last||0)&&(record.reviews||0)>(existing.reviews||0))merged[code][key]=record;
      }
    }
    return merged;
  }
  function createReport(progress,lookup,exportedAt=new Date().toISOString()){
    codes.forEach(code=>validateRecords(progress[code]||{},code));
    const lines=[`WordFlip learning report — ${exportedAt}`,'Generated from your local learning history. Ratings are self-assessments, not exam scores.'];
    for(const code of codes){
      const records=progress[code]||{};const s=stats(records);const label=code==='hu'?'Hungarian':code==='it'?'Italian':code==='de'?'German':'Croatian';
      lines.push('',`${label}: ${s.uniqueCards} cards encountered · ${s.reviews} reviews · ${s.correct} knew it · ${s.recognised} recognised · ${s.misses} review again`);
      const grouped={};
      for(const [key,record] of Object.entries(records)){
        if(!(record.reviews>0))continue;
        const id=idFromKey(key),item=lookup[code].get(id),group=item?.category||'unknown';
        const summary=grouped[group]||(grouped[group]={reviews:0,misses:0});
        summary.reviews+=record.reviews||0;summary.misses+=record.misses||0;
      }
      lines.push('By category:');
      for(const [group,n] of Object.entries(grouped).sort((a,b)=>b[1].reviews-a[1].reviews))lines.push(`- ${group}: ${n.reviews} reviews, ${n.misses} mistakes`);
      const weak=Object.entries(records).filter(([,r])=>(r.reviews||0)>0&&(r.misses||0)>0)
        .sort((a,b)=>(b[1].misses||0)-(a[1].misses||0)|| (b[1].consecutiveMisses||0)-(a[1].consecutiveMisses||0)).slice(0,12);
      lines.push('Most difficult prompts (direction/stage and lifetime results):');
      for(const [key,r] of weak){
        const item=lookup[code].get(idFromKey(key));
        lines.push(`- ${item?.source||idFromKey(key)} → ${item?.english||'unknown'} [${key}]: ${r.misses||0} mistakes / ${r.reviews||0} reviews, current streak ${r.streak||0}`);
      }
      if(!weak.length)lines.push('- None recorded yet');
    }
    return lines.join('\n');
  }
  return {validateRecords,validateBackup,contentLookup,createBackup,mergeProgress,createReport,idFromKey};
})();
