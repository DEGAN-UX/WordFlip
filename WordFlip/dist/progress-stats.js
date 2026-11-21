// Per-item coverage and confidence. Legacy aggregate histories are supported;
// new reviews retain a short rolling window so recent answers count more.
window.WordFlipProgress=(()=>{
  const directions=(card,language)=>{
    if(language==='hu'&&card.category==='verb')return {
      recognition:[`${card.id}:hu-recognition`,`${card.id}:hu-en`],
      recall:[`${card.id}:hu-production`]
    };
    return {recognition:[`${card.id}:${language}-en`],recall:[`${card.id}:en-${language}`]};
  };
  function confidence(record){
    if(!record?.reviews)return null;
    const recent=record.recentRatings;
    if(Array.isArray(recent)&&recent.length){
      let weight=0,correct=0;
      recent.forEach((rating,i)=>{
        const w=Math.pow(1.35,i);weight+=w;
        correct+=w*(rating==='knew'?1:rating==='recognised'?.5:0);
      });
      return correct/weight;
    }
    // Previously saved histories contain totals and the latest streak/rating,
    // but no individual timestamps. Blend those without inventing attempts.
    const total=(record.correct||0)+.5*(record.recognised||0);
    const baseline=total/record.reviews;
    const recentScore=record.lastRating==='knew'?1:record.lastRating==='recognised'?.5:0;
    const influence=Math.min(.65,(record.streak||0)*.12+.24);
    return baseline*(1-influence)+recentScore*influence;
  }
  function result(records){
    const tested=records.filter(r=>r?.reviews>0);
    return {tested:tested.length,total:records.length,
      value:tested.length?tested.reduce((sum,r)=>sum+confidence(r),0)/tested.length:null};
  }
  function summarise(cards,history,language){
    const seen=cards.filter(c=>{
      const keys=Object.values(directions(c,language)).flat();
      return keys.some(k=>(history[k]?.reviews||0)>0);
    });
    const forDirection=kind=>seen.map(c=>{
      const keys=directions(c,language)[kind];
      const records=keys.map(k=>history[k]).filter(r=>r?.reviews);
      return records.sort((a,b)=>(b.last||0)-(a.last||0))[0];
    });
    return {seen:seen.length,total:cards.length,recognition:result(forDirection('recognition')),recall:result(forDirection('recall'))};
  }
  function cheatsheet(records,history){
    const seen=records.filter(r=>['recognition','recall','application'].some(type=>(history[`cheatsheet:${r.patternId}:${type}`]?.reviews||0)>0));
    return {seen:seen.length,total:records.length,
      recognition:result(seen.map(r=>history[`cheatsheet:${r.patternId}:recognition`])),
      recall:result(seen.map(r=>history[`cheatsheet:${r.patternId}:recall`]||history[`cheatsheet:${r.patternId}:application`]))};
  }
  const recordRecent=(previous,rating)=>[...(previous?.recentRatings||[]),rating].slice(-8);
  return {summarise,cheatsheet,confidence,recordRecent};
})();
