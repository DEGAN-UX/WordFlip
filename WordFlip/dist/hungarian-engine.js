// Hungarian scheduling is independent of the Italian engine.
window.WordFlipEngines ??= {};
window.WordFlipEngines.hu = {
  storageKey:'magyar-flip-progress-v1', // Never rename: preserves the existing iPhone history.
  unlocked(cards,history){
    const mastered=cards.filter(c=>c.category==='verb'?
      (history[`${c.id}:hu-production`]?.streak||0)>=2:
      (history[`${c.id}:en-hu`]?.streak||0)>=2).length;
    return Math.min(cards.length,100+mastered*2);
  },
  schedule(prev,rating){
    const success=rating==='knew',partial=rating==='recognised';
    const streak=success?(prev.streak||0)+1:0;
    const hours=success?Math.min(24*2**Math.max(0,streak-1),24*90):partial?8:0.12;
    return {streak,hours};
  },
  language:'hu-HU'
};
