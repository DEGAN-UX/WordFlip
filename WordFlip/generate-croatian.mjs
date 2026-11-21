import fs from 'node:fs';

// Carefully selected pre-A1/A1 material. Entries are deliberately hand-curated:
// do not mechanically inflect Croatian words without checking gender and case.
// Format: Croatian | British English | optional hint.
const words={
  greetings:`bok|hello / bye
dobar dan|good day
dobro jutro|good morning
dobra večer|good evening
laku noć|good night
doviđenja|goodbye
hvala|thank you
hvala lijepa|thank you very much
molim|please / you're welcome
oprostite|excuse me
žao mi je|I'm sorry
da|yes
ne|no
možda|perhaps
naravno|of course
dobro|good / well
odlično|excellent
u redu|all right
razumijem|I understand
ne razumijem|I don't understand`,
  people:`ja|I
ti|you (singular informal)
vi|you (formal / plural)
on|he
ona|she
ono|it
mi|we
oni|they (masculine / mixed)
čovjek|man
žena|woman
dijete|child
djeca|children
prijatelj|male friend
prijateljica|female friend
obitelj|family
majka|mother
otac|father
mama|mum
tata|dad
sin|son
kći|daughter
brat|brother
sestra|sister
suprug|husband
supruga|wife
roditelji|parents
baka|grandmother
djed|grandfather
susjed|male neighbour
susjeda|female neighbour
gospodin|Mr / gentleman
gospođa|Mrs / lady
ime|name
prezime|surname`,
  food:`voda|water
kava|coffee
čaj|tea
mlijeko|milk
sok|juice
vino|wine
pivo|beer
kruh|bread
sir|cheese
maslac|butter
jaje|egg
juha|soup
meso|meat
riba|fish
piletina|chicken (meat)
riža|rice
krumpir|potato
povrće|vegetables
voće|fruit
jabuka|apple
banana|banana
naranča|orange
rajčica|tomato
salata|salad
sol|salt
šećer|sugar
papar|pepper
ulje|oil
sladoled|ice cream
kolač|cake
doručak|breakfast
ručak|lunch
večera|dinner
restoran|restaurant
kafić|café
jelovnik|menu
račun|bill
čaša|glass
šalica|cup
tanjur|plate
vilica|fork
nož|knife
žlica|spoon`,
  travel:`grad|city
selo|village
ulica|street
trg|square
kuća|house
stan|flat
hotel|hotel
soba|room
vrata|door
prozor|window
stol|table
stolica|chair
krevet|bed
kupaonica|bathroom
toalet|toilet
kuhinja|kitchen
trgovina|shop
tržnica|market
ljekarna|pharmacy
bolnica|hospital
škola|school
posao|work / job
ured|office
park|park
plaža|beach
more|sea
otok|island
planina|mountain
rijeka|river
jezero|lake
autobus|bus
vlak|train
tramvaj|tram
automobil|car
brod|boat / ship
zračna luka|airport
kolodvor|station
karta|ticket / map
putovnica|passport
novac|money
gotovina|cash
kartica|card
cijena|price
ulaz|entrance
izlaz|exit
centar|centre
most|bridge`,
  time:`danas|today
sutra|tomorrow
jučer|yesterday
sada|now
kasnije|later
ujutro|in the morning
navečer|in the evening
dan|day
tjedan|week
mjesec|month
godina|year
sat|hour / clock
minuta|minute
jutro|morning
večer|evening
noć|night
ponedjeljak|Monday
utorak|Tuesday
srijeda|Wednesday
četvrtak|Thursday
petak|Friday
subota|Saturday
nedjelja|Sunday
siječanj|January
veljača|February
ožujak|March
travanj|April
svibanj|May
lipanj|June
srpanj|July
kolovoz|August
rujan|September
listopad|October
studeni|November
prosinac|December`,
  descriptions:`velik|big (masculine)
mali|small (masculine)
dobar|good (masculine)
loš|bad (masculine)
lijep|beautiful / nice (masculine)
nov|new (masculine)
star|old (masculine)
mlad|young (masculine)
topao|warm (masculine)
hladan|cold (masculine)
vruć|hot (masculine)
skup|expensive (masculine)
jeftin|cheap (masculine)
brz|fast (masculine)
spor|slow (masculine)
važan|important (masculine)
sretan|happy (masculine)
umoran|tired (masculine)
gladan|hungry (masculine)
žedan|thirsty (masculine)
lako|easily
teško|with difficulty
ovdje|here
tamo|there
blizu|nearby
daleko|far away
gore|up / upstairs
dolje|down / downstairs
desno|right
lijevo|left
ravno|straight ahead
uvijek|always
nikad|never
često|often
ponekad|sometimes
polako|slowly
brzo|quickly
zajedno|together
sam|alone (masculine)
još|more / still
već|already
vrlo|very
previše|too much
dovoljno|enough`,
  numbers:`nula|zero
jedan|one (masculine)
dva|two (masculine / neuter)
tri|three
četiri|four
pet|five
šest|six
sedam|seven
osam|eight
devet|nine
deset|ten
jedanaest|eleven
dvanaest|twelve
trinaest|thirteen
četrnaest|fourteen
petnaest|fifteen
šesnaest|sixteen
sedamnaest|seventeen
osamnaest|eighteen
devetnaest|nineteen
dvadeset|twenty
trideset|thirty
četrdeset|forty
pedeset|fifty
sto|one hundred
tisuća|one thousand`,
  questions:`tko|who
što|what
gdje|where
kamo|where to
odakle|where from
kada|when
zašto|why
kako|how
koliko|how much / how many
koji|which (masculine)
koja|which (feminine)
čiji|whose (masculine)
ovaj|this (masculine)
ova|this (feminine)
taj|that (masculine)
ta|that (feminine)
i|and
ili|or
ali|but
jer|because
ako|if
bez|without
za|for
od|from
do|until / to
s|with (before most consonants)
sa|with (variant)
u|in / into
na|on / onto
ispred|in front of
iza|behind
između|between`
};

// Short, idiomatic complete utterances. Croatian is the test answer, not a
// detached inflected verb in place of the English sentence.
const phrases={
  everyday:`Kako si?|How are you? (informal)
Kako ste?|How are you? (formal)
Dobro sam, hvala.|I'm well, thanks.
A ti?|And you? (informal)
A vi?|And you? (formal)
Drago mi je.|Pleased to meet you.
Kako se zoveš?|What's your name? (informal)
Kako se zovete?|What's your name? (formal)
Zovem se David.|My name is David.
Odakle si?|Where are you from? (informal)
Odakle ste?|Where are you from? (formal)
Ja sam iz Švicarske.|I'm from Switzerland.
Živim u Švicarskoj.|I live in Switzerland.
Govorite li engleski?|Do you speak English? (formal)
Govorim malo hrvatski.|I speak a little Croatian.
Učim hrvatski.|I'm learning Croatian.
Ne govorim dobro hrvatski.|I don't speak Croatian well.
Možete li govoriti sporije?|Can you speak more slowly?
Možete li ponoviti?|Can you repeat that?
Što to znači?|What does that mean?
Kako se to kaže na hrvatskom?|How do you say that in Croatian?
Ne znam.|I don't know.
Razumijem.|I understand.
Ne razumijem.|I don't understand.
Nema problema.|No problem.
Nema na čemu.|You're welcome.
Sve je u redu.|Everything is all right.
Vidimo se sutra.|See you tomorrow.
Vidimo se uskoro.|See you soon.
Ugodan dan!|Have a nice day!
Lijep vikend!|Have a nice weekend!
Sretno!|Good luck!
Sretan put!|Have a good journey!`,
  family:`Ovo je moja obitelj.|This is my family.
Ovo je moja supruga.|This is my wife.
Ovo je moj suprug.|This is my husband.
Ovo je moj sin.|This is my son.
Ovo je moja kći.|This is my daughter.
Imam jedno dijete.|I have one child.
Imam dvoje djece.|I have two children.
Imaš li djece?|Do you have children? (informal)
Koliko godina imaš?|How old are you? (informal)
Imam osam godina.|I'm eight years old.
Kako su tvoji roditelji?|How are your parents?
Kako je tvoja majka?|How is your mother?
Svi su dobro.|Everyone is well.
Moja obitelj živi ovdje.|My family lives here.
Moja sestra radi u Zagrebu.|My sister works in Zagreb.
Gdje je tvoj brat?|Where is your brother?
On je kod kuće.|He is at home.
Ona je na poslu.|She is at work.
Idemo kući.|We're going home.
Djeca su u školi.|The children are at school.
Kako ide u školi?|How is school going?
Kako ide na poslu?|How is work going?
Jesi li dobro?|Are you all right? (informal)
Nedostaješ mi.|I miss you.`,
  food:`Jedan stol za dvoje, molim.|A table for two, please.
Imate li slobodan stol?|Do you have a free table?
Mogu li dobiti jelovnik?|May I have the menu?
Što preporučujete?|What do you recommend?
Želim kavu.|I'd like a coffee.
Jednu kavu, molim.|One coffee, please.
Kavu s mlijekom, molim.|A coffee with milk, please.
Jednu vodu, molim.|One water, please.
Vodu bez leda, molim.|Water without ice, please.
Mineralnu vodu, molim.|Mineral water, please.
Bez šećera, molim.|Without sugar, please.
Ja bih čaj.|I'd like tea.
Što ćete popiti?|What will you drink? (formal)
Jeste li spremni naručiti?|Are you ready to order? (formal)
Želim ribu.|I'd like fish.
Želim salatu.|I'd like a salad.
Imate li nešto vegetarijansko?|Do you have anything vegetarian?
Bez mesa, molim.|Without meat, please.
Ovo je ukusno.|This is delicious.
Jako je dobro.|It's very good.
Još jednu, molim.|Another one, please.
Mogu li dobiti račun?|May I have the bill?
Račun, molim.|The bill, please.
Mogu li platiti karticom?|Can I pay by card?
Plaćam gotovinom.|I'm paying in cash.
Zajedno ili odvojeno?|Together or separately?
Dobar tek!|Enjoy your meal!`,
  shopping:`Koliko ovo košta?|How much does this cost?
Koliko košta karta?|How much is the ticket?
To je preskupo.|That's too expensive.
Imate li nešto jeftinije?|Do you have anything cheaper?
Samo gledam, hvala.|I'm just looking, thanks.
Tražim poklon.|I'm looking for a present.
Gdje je trgovina?|Where is the shop?
Gdje je blagajna?|Where is the till?
Mogu li to probati?|Can I try that on?
Imate li veću veličinu?|Do you have a larger size?
Imate li manju veličinu?|Do you have a smaller size?
Imate li ovo u plavoj boji?|Do you have this in blue?
Uzet ću ovo.|I'll take this.
Ne trebam vrećicu.|I don't need a bag.
Imate li vrećicu?|Do you have a bag?
Mogu li dobiti račun?|May I have a receipt?
Gdje mogu kupiti kruh?|Where can I buy bread?
Treba mi voda.|I need water.
To mi se sviđa.|I like that.
Ne sviđa mi se.|I don't like it.`,
  travel:`Gdje je centar grada?|Where is the town centre?
Gdje je autobusni kolodvor?|Where is the bus station?
Gdje je željeznički kolodvor?|Where is the railway station?
Gdje je toalet?|Where is the toilet?
Kako doći do hotela?|How do I get to the hotel?
Idite ravno.|Go straight ahead. (formal)
Skrenite lijevo.|Turn left. (formal)
Skrenite desno.|Turn right. (formal)
Je li daleko?|Is it far?
Blizu je.|It's nearby.
Trebam taksi.|I need a taxi.
Kada polazi autobus?|When does the bus leave?
Kada stiže vlak?|When does the train arrive?
Jednu kartu, molim.|One ticket, please.
Kartu za Zagreb, molim.|A ticket to Zagreb, please.
Je li ovo pravi autobus?|Is this the right bus?
Gdje mogu parkirati?|Where can I park?
Imam rezervaciju.|I have a reservation.
Na koje ime?|Under what name?
Ostajem dvije noći.|I'm staying two nights.
U koliko sati je doručak?|What time is breakfast?
Gdje je moja soba?|Where is my room?
Mogu li dobiti ključ?|May I have the key?
Gdje je plaža?|Where is the beach?
Lijepo je ovdje.|It's lovely here.
Želim posjetiti Split.|I want to visit Split.
Idemo na more.|We're going to the seaside.`,
  social:`Kako je prošao vikend?|How was the weekend?
Što radiš danas?|What are you doing today? (informal)
Imaš li vremena?|Do you have time? (informal)
Jesi li slobodan sutra?|Are you free tomorrow? (to a man)
Jesi li slobodna sutra?|Are you free tomorrow? (to a woman)
Hoćemo li na kavu?|Shall we go for a coffee?
Želiš li doći?|Would you like to come? (informal)
Dođi sutra!|Come tomorrow! (informal)
Vidimo se u petak.|See you on Friday.
U koliko sati?|At what time?
U pet sati.|At five o'clock.
Kasnim deset minuta.|I'm ten minutes late.
Oprosti što kasnim.|Sorry I'm late. (informal)
Nema veze.|Never mind.
Kako je vrijeme?|What's the weather like?
Danas je sunčano.|It's sunny today.
Danas je hladno.|It's cold today.
Pada kiša.|It's raining.
Pada snijeg.|It's snowing.
Volim more.|I love the sea.
Volim glazbu.|I love music.
Slušam glazbu.|I'm listening to music.
Čitam knjigu.|I'm reading a book.
Idem u šetnju.|I'm going for a walk.`,
  celebrations:`Sretan rođendan!|Happy birthday!
Sve najbolje!|All the best!
Čestitam!|Congratulations!
Sretan Božić!|Merry Christmas!
Sretna Nova godina!|Happy New Year!
Sretan Uskrs!|Happy Easter!
Sretni blagdani!|Happy holidays!
Želim ti sve najbolje.|I wish you all the best. (informal)
Hvala na pozivu.|Thank you for the invitation.
Hvala na poklonu.|Thank you for the present.
Drago mi je da si ovdje.|I'm glad you're here. (informal)
Živjeli!|Cheers!
Uživaj!|Enjoy yourself! (informal)`,
  help:`Pomozite mi, molim vas.|Please help me.
Trebam pomoć.|I need help.
Imam problem.|I have a problem.
Izgubio sam putovnicu.|I've lost my passport. (male speaker)
Izgubila sam putovnicu.|I've lost my passport. (female speaker)
Gdje je bolnica?|Where is the hospital?
Gdje je ljekarna?|Where is the pharmacy?
Zovite liječnika!|Call a doctor! (formal)
Trebam liječnika.|I need a doctor.
Nije mi dobro.|I don't feel well.
Boli me glava.|I have a headache.
Imam alergiju.|I have an allergy.
Ne mogu pronaći hotel.|I can't find the hotel.
Ne radi.|It doesn't work.
Mogu li koristiti telefon?|May I use the telephone?
Možete li mi pomoći?|Can you help me? (formal)
Molim vas, pričekajte.|Please wait. (formal)
Gdje je policija?|Where are the police?`
};

const verbs=`biti|to be|ja sam|I am|ti si|you are|on je|he is|mi smo|we are|vi ste|you are (formal/plural)|oni su|they are
imati|to have|ja imam|I have|ti imaš|you have|ona ima|she has|mi imamo|we have|vi imate|you have (formal/plural)|oni imaju|they have
htjeti|to want|ja hoću|I want|ti hoćeš|you want|on hoće|he wants|mi hoćemo|we want|vi hoćete|you want (formal/plural)|oni hoće|they want
moći|to be able to|ja mogu|I can|ti možeš|you can|ona može|she can|mi možemo|we can|vi možete|you can (formal/plural)|oni mogu|they can
govoriti|to speak|ja govorim|I speak|ti govoriš|you speak|on govori|he speaks|mi govorimo|we speak|vi govorite|you speak (formal/plural)|oni govore|they speak
raditi|to work / do|ja radim|I work|ti radiš|you work|ona radi|she works|mi radimo|we work|vi radite|you work (formal/plural)|oni rade|they work
učiti|to learn / study|ja učim|I learn|ti učiš|you learn|on uči|he learns|mi učimo|we learn|vi učite|you learn (formal/plural)|oni uče|they learn
živjeti|to live|ja živim|I live|ti živiš|you live|ona živi|she lives|mi živimo|we live|vi živite|you live (formal/plural)|oni žive|they live
voljeti|to love / like|ja volim|I like|ti voliš|you like|on voli|he likes|mi volimo|we like|vi volite|you like (formal/plural)|oni vole|they like
vidjeti|to see|ja vidim|I see|ti vidiš|you see|ona vidi|she sees|mi vidimo|we see|vi vidite|you see (formal/plural)|oni vide|they see
kupiti|to buy (completed)|ja kupim|I buy (completed action)|ti kupiš|you buy (completed action)|on kupi|he buys (completed action)|mi kupimo|we buy (completed action)|vi kupite|you buy (completed action)|oni kupe|they buy (completed action)
čitati|to read|ja čitam|I read|ti čitaš|you read|ona čita|she reads|mi čitamo|we read|vi čitate|you read (formal/plural)|oni čitaju|they read
pitati|to ask|ja pitam|I ask|ti pitaš|you ask|on pita|he asks|mi pitamo|we ask|vi pitate|you ask (formal/plural)|oni pitaju|they ask
čekati|to wait|ja čekam|I wait|ti čekaš|you wait|ona čeka|she waits|mi čekamo|we wait|vi čekate|you wait (formal/plural)|oni čekaju|they wait
znati|to know|ja znam|I know|ti znaš|you know|on zna|he knows|mi znamo|we know|vi znate|you know (formal/plural)|oni znaju|they know`;

// Isolated morphology recognition and application, introduced after vocabulary.
const cases=`grad|city (nominative)|nominative|subject form
grada|of the city|genitive|genitive singular
gradu|to the city (dative)|dative|dative singular
grad|city (direct object)|accusative|inanimate masculine accusative
prijatelju|my friend! (addressing)|vocative|vocative singular
u gradu|in the city|locative|u + locative = location
gradom|with the city|instrumental|instrumental singular
žena|woman (nominative)|nominative|subject form
žene|of the woman|genitive|genitive singular
ženi|to the woman|dative|dative singular
ženu|woman (direct object)|accusative|accusative singular
ženo|O woman! (addressing)|vocative|vocative singular
o ženi|about the woman|locative|o + locative
sa ženom|with the woman|instrumental|s(a) + instrumental
u školi|at school|locative|u + locative = location
u školu|to school|accusative|u + accusative = destination
u Zagrebu|in Zagreb|locative|u + locative = location
u Zagreb|to Zagreb|accusative|u + accusative = destination
na stolu|on the table|locative|na + locative = location
na stol|onto the table|accusative|na + accusative = destination
u kući|in the house|locative|u + locative = location
u kuću|into the house|accusative|u + accusative = destination
iz kuće|out of the house|genitive|iz + genitive
bez vode|without water|genitive|bez + genitive
od prijatelja|from a male friend|genitive|od + genitive
s prijateljem|with a male friend|instrumental|s + instrumental
za prijatelja|for a male friend|accusative|za + accusative
o gradu|about the city|locative|o + locative
u restoranu|in the restaurant|locative|u + locative
u restoran|into the restaurant|accusative|u + accusative`;

const cards=[];
const add=(category,hr,en,topic,level,extra={})=>{
  const id=`hr-${category}-${String(cards.filter(c=>c.category===category).length+1).padStart(3,'0')}`;
  cards.push({id,category,hr,en,exampleHr:hr,exampleEn:en,topic,level,priority:0,...extra});
};
for(const [topic,source] of Object.entries(words))for(const line of source.split('\n')){
  const [hr,en]=line.split('|');
  add('word',hr,en,topic,['greetings','people','food','travel','numbers','questions'].includes(topic)?'Starter':'A1');
}
for(const [topic,source] of Object.entries(phrases))for(const line of source.split('\n')){
  const [hr,en]=line.split('|');add('phrase',hr,en,topic,topic==='everyday'?'Starter':'A1');
}
for(const line of verbs.split('\n')){
  const [infinitive,meaning,...forms]=line.split('|');
  forms.forEach((form,i)=>{if(i%2===0)add('verb',form,forms[i+1],infinitive,'A1',{infinitive,note:meaning,form});});
}
for(const line of cases.split('\n')){
  const [hr,en,grammaticalCase,note]=line.split('|');add('case',hr,en,grammaticalCase,'A1',{note});
}
// First automatic sessions: greetings and practical language, not case tables.
const order={word:0,phrase:1,verb:2,case:3};
const wordTopics={greetings:0,people:1,questions:2,food:3,travel:4,numbers:5,time:6,descriptions:7};
const phraseTopics={everyday:0,food:1,travel:2,family:3,shopping:4,social:5,help:6,celebrations:7};
cards.sort((a,b)=>{
  const stage=c=>c.category==='case'?4:c.category==='verb'?3:c.category==='phrase'?(phraseTopics[c.topic]||0)<3?1:2:(wordTopics[c.topic]||0)<4?0:2;
  return stage(a)-stage(b)||order[a.category]-order[b.category]||
    (a.category==='phrase'?phraseTopics[a.topic]-phraseTopics[b.topic]:a.category==='word'?wordTopics[a.topic]-wordTopics[b.topic]:0);
});
// Interleave the first spoken exchanges with words from day one. A beginner
// should not have to finish 150 isolated nouns before hearing a full phrase.
const starterWords=cards.filter(c=>c.category==='word'&&['greetings','people','questions','food'].includes(c.topic));
const starterPhrases=cards.filter(c=>c.category==='phrase'&&['everyday','food'].includes(c.topic));
const starterVerbs=cards.filter(c=>c.category==='verb').slice(0,12);
const opening=[];
for(let i=0;i<46;i++){
  if(starterWords[i])opening.push(starterWords[i]);
  if(starterPhrases[i])opening.push(starterPhrases[i]);
  if(i%8===7&&starterVerbs[Math.floor(i/8)])opening.push(starterVerbs[Math.floor(i/8)]);
}
const openingIds=new Set(opening.map(c=>c.id));
cards.splice(0,cards.length,...opening,...cards.filter(c=>!openingIds.has(c.id)));
cards.forEach((card,index)=>card.priority=index+1);
const keys=new Set();for(const card of cards){const key=`${card.category}:${card.hr}:${card.en}`;if(keys.has(key))throw Error(`Duplicate Croatian card: ${key}`);keys.add(key);}
fs.writeFileSync(new URL('./dist/croatian-cards.json',import.meta.url),JSON.stringify(cards,null,2)+'\n');
console.log('Croatian beginner cards:',Object.fromEntries([...new Set(cards.map(c=>c.category))].map(cat=>[cat,cards.filter(c=>c.category===cat).length])));
