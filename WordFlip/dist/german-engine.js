// Independent German progress and scheduler. Swiss Standard German: de-CH.
window.WordFlipEngines ??= {};
window.WordFlipEngines.de={
  storageKey:'wordflip-german-progress-v1',
  unlocked(cards,history){
    const mastered=cards.filter(c=>(history[`${c.id}:en-de`]?.streak||0)>=2).length;
    return Math.min(cards.length,75+mastered*2);
  },
  schedule(prev,rating,card){
    const streak=rating==='knew'?(prev.streak||0)+1:0;
    const first=['article','case','order'].includes(card.category)?10:22;
    const hours=rating==='knew'?Math.min(first*2**Math.max(0,streak-1),24*60):rating==='recognised'?5:0.12;
    return {streak,hours};
  },
  language:'de-CH'
};
