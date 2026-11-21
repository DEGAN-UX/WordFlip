// WordFlip Hungarian Cheatsheet — 100 reviewed foundational examples.
// Exact full forms are stored; the question generator must not conjugate arbitrary stems.
window.WordFlipCheatsheetData=(()=>{
  const categories=[
    ['cases','Cases & location endings'],['plurals','Plurals'],['accusative','Accusative'],
    ['possessives','Possessive endings'],['present-indefinite','Present — indefinite'],
    ['present-definite','Present — definite'],['past-indefinite','Past — indefinite'],
    ['past-definite','Past — definite'],['conditional','Conditional']
  ];
  // id | category | meaning/cue | base | ending | full form | English translation | harmony/context
  const source=`
001|cases|subject / nominative|ház|∅|ház|house|none
002|accusative|direct object|ház|-at|házat|house (object)|back
003|accusative|direct object|kert|-et|kertet|garden (object)|front
004|accusative|direct object|könyv|-et|könyvet|book (object)|front
005|accusative|direct object|alma|-t|almát|apple (object)|final a → á
006|cases|to / for|ház|-nak|háznak|to / for the house|back
007|cases|to / for|kert|-nek|kertnek|to / for the garden|front
008|cases|with|ház|-val|házzal|with the house|assimilation · back
009|cases|with|kert|-vel|kerttel|with the garden|assimilation · front
010|cases|with|autó|-val|autóval|with the car|vowel-final
011|cases|for / in exchange for|ház|-ért|házért|for the house|any
012|cases|become / turn into|ház|-vá|házzá|into a house|assimilation · back
013|cases|become / turn into|kert|-vé|kertté|into a garden|assimilation · front
014|cases|in / inside|ház|-ban|házban|in the house|back
015|cases|in / inside|kert|-ben|kertben|in the garden|front
016|cases|in / inside|föld|-ben|földben|in the earth|front rounded
017|cases|into|ház|-ba|házba|into the house|back
018|cases|into|kert|-be|kertbe|into the garden|front
019|cases|out of|ház|-ból|házból|out of the house|back
020|cases|out of|kert|-ből|kertből|out of the garden|front
021|cases|on / on top of|asztal|-on|asztalon|on the table|back
022|cases|on / on top of|szék|-en|széken|on the chair|front unrounded
023|cases|on / on top of|föld|-ön|földön|on the ground|front rounded
024|cases|onto|asztal|-ra|asztalra|onto the table|back
025|cases|onto|szék|-re|székre|onto the chair|front
026|cases|off / from a surface|asztal|-ról|asztalról|off the table|back
027|cases|off / from a surface|szék|-ről|székről|off the chair|front
028|cases|at / near|ház|-nál|háznál|at the house|back
029|cases|at / near|kert|-nél|kertnél|at the garden|front
030|cases|towards / to|ház|-hoz|házhoz|to the house|back
031|cases|towards / to|kert|-hez|kerthez|to the garden|front unrounded
032|cases|towards / to|föld|-höz|földhöz|to the earth|front rounded
033|cases|away from|ház|-tól|háztól|from the house|back
034|cases|away from|kert|-től|kerttől|from the garden|front
035|cases|until / as far as|ház|-ig|házig|as far as the house|any
036|cases|as / in the capacity of|tanár|-ként|tanárként|as a teacher|any
037|cases|at a particular time|hat|-kor|hatkor|at six o’clock|any
038|cases|every day|nap|-onta|naponta|daily|back
039|cases|per person|fej|-enként|fejenként|per person|front
040|cases|in a language / manner|magyar|-ul|magyarul|in Hungarian|back
041|cases|in a language / manner|német|-ül|németül|in German|front
042|cases|in / at a city|Budapest|-en|Budapesten|in Budapest|place-name convention
043|plurals|plural|ház|-ak|házak|houses|back
044|plurals|plural|kert|-ek|kertek|gardens|front
045|plurals|plural|könyv|-ek|könyvek|books|front
046|plurals|plural|föld|-ek|földek|lands|front rounded
047|plurals|plural|autó|-k|autók|cars|vowel-final
048|plurals|plural|alma|-k|almák|apples|final a → á
049|accusative|direct object of my house|házam|-at|házamat|my house (object)|possessed noun
050|accusative|plural direct object|könyv|-eket|könyveket|books (object)|plural + accusative
051|possessives|my|ház|-am|házam|my house|back
052|possessives|my|kert|-em|kertem|my garden|front
053|possessives|my|könyv|-em|könyvem|my book|front
054|possessives|your (singular)|ház|-ad|házad|your house|back
055|possessives|your (singular)|kert|-ed|kerted|your garden|front
056|possessives|his / her|ház|-a|háza|his / her house|back
057|possessives|his / her|kert|-je|kertje|his / her garden|front
058|possessives|our|ház|-unk|házunk|our house|back
059|possessives|your (plural)|ház|-atok|házatok|your (plural) house|back
060|possessives|their|ház|-uk|házuk|their house|back
061|present-indefinite|I learn|tanul|-ok|tanulok|I learn|back · present · indefinite
062|present-indefinite|I ask for|kér|-ek|kérek|I ask for|front · present · indefinite
063|present-indefinite|you (singular) learn|tanul|-sz|tanulsz|you (singular) learn|back · present · indefinite
064|present-indefinite|you (singular) ask for|kér|-sz|kérsz|you (singular) ask for|front · present · indefinite
065|present-indefinite|he / she learns|tanul|∅|tanul|he / she learns|back · present · indefinite
066|present-indefinite|he / she asks for|kér|∅|kér|he / she asks for|front · present · indefinite
067|present-indefinite|we learn|tanul|-unk|tanulunk|we learn|back · present · indefinite
068|present-indefinite|we ask for|kér|-ünk|kérünk|we ask for|front · present · indefinite
069|present-indefinite|you (plural) learn|tanul|-tok|tanultok|you (plural) learn|back · present · indefinite
070|present-indefinite|you (plural) ask for|kér|-tek|kértek|you (plural) ask for|front · present · indefinite
071|present-indefinite|they learn|tanul|-nak|tanulnak|they learn|back · present · indefinite
072|present-indefinite|they ask for|kér|-nek|kérnek|they ask for|front · present · indefinite
073|present-definite|I learn it|tanul|-om|tanulom|I learn it|back · present · definite
074|present-definite|I ask for it|kér|-em|kérem|I ask for it|front · present · definite
075|present-definite|you (singular) learn it|tanul|-od|tanulod|you (singular) learn it|back · present · definite
076|present-definite|you (singular) ask for it|kér|-ed|kéred|you (singular) ask for it|front · present · definite
077|present-definite|he / she learns it|tanul|-ja|tanulja|he / she learns it|back · present · definite
078|present-definite|he / she asks for it|kér|-i|kéri|he / she asks for it|front · present · definite
079|present-definite|we learn it|tanul|-juk|tanuljuk|we learn it|back · present · definite
080|present-definite|we ask for it|kér|-jük|kérjük|we ask for it|front · present · definite
081|present-definite|you (plural) learn it|tanul|-játok|tanuljátok|you (plural) learn it|back · present · definite
082|present-definite|you (plural) ask for it|kér|-itek|kéritek|you (plural) ask for it|front · present · definite
083|present-definite|they learn it|tanul|-ják|tanulják|they learn it|back · present · definite
084|present-definite|they ask for it|kér|-ik|kérik|they ask for it|front · present · definite
085|past-indefinite|I learnt|tanul|-tam|tanultam|I learnt|past · indefinite
086|past-indefinite|you (singular) learnt|tanul|-tál|tanultál|you (singular) learnt|past · indefinite
087|past-indefinite|he / she learnt|tanul|-t|tanult|he / she learnt|past · indefinite
088|past-indefinite|we learnt|tanul|-tunk|tanultunk|we learnt|past · indefinite
089|past-indefinite|you (plural) learnt|tanul|-tatok|tanultatok|you (plural) learnt|past · indefinite
090|past-indefinite|they learnt|tanul|-tak|tanultak|they learnt|past · indefinite
091|past-definite|I learnt it|tanul|-tam|tanultam|I learnt it|past · definite · context required
092|past-definite|you (singular) learnt it|tanul|-tad|tanultad|you (singular) learnt it|past · definite
093|past-definite|he / she learnt it|tanul|-ta|tanulta|he / she learnt it|past · definite
094|past-definite|we learnt it|tanul|-tuk|tanultuk|we learnt it|past · definite
095|past-definite|you (plural) learnt it|tanul|-tátok|tanultátok|you (plural) learnt it|past · definite
096|past-definite|they learnt it|tanul|-ták|tanulták|they learnt it|past · definite
097|conditional|I would learn|tanul|-nék|tanulnék|I would learn|conditional · indefinite
098|conditional|you (singular) would learn|tanul|-nál|tanulnál|you (singular) would learn|conditional · indefinite
099|conditional|he / she would learn|tanul|-na|tanulna|he / she would learn|conditional · indefinite
100|conditional|I would learn it|tanul|-nám|tanulnám|I would learn it|conditional · definite
`;
  const records=source.trim().split('\n').map(row=>{
    const [number,category,meaning,stem,suffix,form,english,context]=row.split('|');
    const lexical=category==='cases'||category==='plurals'||category==='accusative'||category==='possessives';
    const patternId=`hu-grammar:${category}:${meaning}:${context}:${suffix}`.toLowerCase().replace(/[^a-z0-9áéíóöőúüű:]+/g,'-');
    return {id:`HU-CS-${number}`,number:Number(number),category,meaning,stem,suffix,form,english,context,patternId,
      lexical,supportedQuestionTypes:form===stem?['recognition','recall']:
        ['085','091'].includes(number)?['recall','application']:['recognition','recall','application']};
  });
  return {categories,records};
})();
