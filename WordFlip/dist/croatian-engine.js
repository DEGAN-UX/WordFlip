// Croatian has its own progress and curriculum; existing language histories are untouched.
window.WordFlipEngines ??= {};
window.WordFlipEngines.hr={
  storageKey:'wordflip-croatian-progress-v1',
  unlocked(cards,history){
    const mastered=cards.filter(c=>(history[`${c.id}:en-hr`]?.streak||0)>=2).length;
    return Math.min(cards.length,70+mastered*2);
  },
  schedule(prev,rating,card){
    const streak=rating==='knew'?(prev.streak||0)+1:0;
    const first=card.category==='case'||card.category==='verb'?12:24;
    const hours=rating==='knew'?Math.min(first*2**Math.max(0,streak-1),24*60):rating==='recognised'?6:.12;
    return {streak,hours};
  },
  language:'hr-HR'
};
