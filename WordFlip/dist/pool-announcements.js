// Tracks which cards Automatic has admitted to the learning pool. This is
// separate from the cards that happen to be unfamiliar in today's session.
window.WordFlipPoolAnnouncements=(()=>{
  function update(previous,cards,session,limit,automatic){
    const known=new Set(previous?.admitted||[]);
    const first=!previous||!Number.isFinite(previous.limit);
    const eligible=cards.filter(c=>c.category!=='article'&&(c.priority||0)<=limit);
    const newlyUnlocked=[];
    for(const c of eligible){
      if(!first&&!known.has(c.id))newlyUnlocked.push(c);
      known.add(c.id);
    }
    if(automatic)for(const c of session){
      if(c.id&&!known.has(c.id)){
        // On-demand expansion beyond the normal threshold also unlocks cards.
        newlyUnlocked.push(c);known.add(c.id);
      }
    }
    const unseen=session.filter(c=>c.isNew);
    return {state:{limit,admitted:[...known]},unlocked:newlyUnlocked,unseen,first};
  }
  const label=(card,language)=>{
    if(language==='it'&&card.category==='phrase')return card.topic||'phrases';
    if(language==='it'&&card.category==='word'&&['adjective','adverb'].includes(card.partOfSpeech))return 'Adjectives / Adverbs';
    if(language==='it'&&(card.category==='preposition'||card.partOfSpeech==='preposition'))return 'Prepositions';
    return {word:'Words',verb:'Conjugation',phrase:'Phrases',suffix:'Suffixes',case:'Cases'}[card.category]||'Practice';
  };
  function summary(cards,language,phraseTopics=[]){
    const labels=new Map(phraseTopics);
    const counts=new Map();
    for(const c of cards){
      const group=label(c,language);
      const title=labels.get(group)||group;
      counts.set(title,(counts.get(title)||0)+1);
    }
    const lines=[...counts].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([name,count])=>`${count} ${name}`);
    if(counts.size>3)lines.push(`+ ${counts.size-3} more topics`);
    return lines;
  }
  return {update,summary};
})();
