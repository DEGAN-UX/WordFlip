// Separate Italian storage and scheduler allow language-specific tuning.
window.WordFlipEngines ??= {};
window.WordFlipEngines.it = {
  storageKey:'wordflip-italian-progress-v1',
  unlocked(cards,history){
    const mastered=cards.filter(c=>(history[`${c.id}:en-it`]?.streak||0)>=2).length;
    return Math.min(cards.length,80+mastered*2);
  },
  schedule(prev,rating,card){
    const success=rating==='knew',partial=rating==='recognised';
    const streak=success?(prev.streak||0)+1:0;
    // Newly learned Italian grammatical forms receive a shorter first interval.
    const first=card.category==='verb'||card.category==='article'?12:24;
    const hours=success?Math.min(first*2**Math.max(0,streak-1),24*60):partial?6:0.10;
    return {streak,hours};
  },
  language:'it-IT'
};
