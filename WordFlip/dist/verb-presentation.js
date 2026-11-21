// Keep the prompt, revealed answer and spoken text aligned for Hungarian verbs.
window.WordFlipVerbPresentation=(()=>{
  const pronouns={'én':'I','te':'you (singular)','ő':'he / she / it','mi':'we','ti':'you (plural)','ők':'they'};
  function present(card,stage){
    const [infinitive,pronoun,form]=card.hu.split(' · ');
    const tense=form||'present';
    const [conjugated,translation]=card.en.split(' — ');
    if(stage==='recognition')return {front:conjugated,back:translation,
      hint:'What does this Hungarian verb mean?',spoken:conjugated};
    if(stage==='production')return {front:card.exampleEn,back:card.exampleHu,
      hint:`Translate into Hungarian · ${tense}`,spoken:card.exampleHu};
    return {front:`${infinitive} · ${pronouns[pronoun]||pronoun} · ${tense}`,
      back:`${conjugated} — ${translation}`,hint:`${pronoun} = ${pronouns[pronoun]||pronoun}`,
      spoken:conjugated};
  }
  return {present};
})();
