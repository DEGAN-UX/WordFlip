// A first success is per card (or Cheatsheet grammar pattern), not per direction.
window.WordFlipFirstWin=(()=>{
  const phrases=['Well done!','You got it!','Right on!'];
  function hasSucceeded(history,id,cheatsheet=false){
    const prefix=cheatsheet?`cheatsheet:${id}:`:`${id}:`;
    return Object.entries(history).some(([key,record])=>key.startsWith(prefix)&&(record.correct||0)>0);
  }
  return {hasSucceeded,phrase:index=>phrases[index%phrases.length]};
})();
