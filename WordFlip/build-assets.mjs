import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dist=path.join(import.meta.dirname,'dist');
const assets=['app.js','pool-announcements.js','adaptive-engine.js','progress-stats.js','progress-transfer.js','verb-presentation.js','first-win.js','cheatsheet-data.js','cheatsheet-engine.js','training-layout.js','update-manager.js','mobile-fix.css','training-layout.css','update-manager.css','wordflip.css','hungarian-engine.js','italian-engine.js','croatian-engine.js','cards.json','italian-cards.json','croatian-cards.json','icon-180.png','icon-192.png','icon-512.png'];
const fingerprint=name=>crypto.createHash('sha256').update(fs.readFileSync(path.join(dist,name))).digest('hex').slice(0,12);
const hashes=Object.fromEntries(assets.map(name=>[name,fingerprint(name)]));

let html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
// Boot order matters: language-specific schedulers are registered before app.js.
if(!html.includes('href="wordflip.css'))html=html.replace('</head>','<link rel="stylesheet" href="wordflip.css"></head>');
if(!html.includes('src="hungarian-engine.js'))html=html.replace('<script src="app.js', '<script src="hungarian-engine.js"></script><script src="italian-engine.js"></script><script src="app.js');
if(!html.includes('src="adaptive-engine.js'))html=html.replace(/<script src="app\.js/, '<script src="adaptive-engine.js"></script><script src="app.js');
if(!html.includes('src="croatian-engine.js'))html=html.replace(/<script src="app\.js/, '<script src="croatian-engine.js"></script><script src="app.js');
if(!html.includes('src="pool-announcements.js'))html=html.replace(/<script src="app\.js/, '<script src="pool-announcements.js"></script><script src="app.js');
if(!html.includes('src="progress-stats.js'))html=html.replace(/<script src="app\.js/, '<script src="progress-stats.js"></script><script src="app.js');
if(!html.includes('src="progress-transfer.js'))html=html.replace(/<script src="app\.js/, '<script src="progress-transfer.js"></script><script src="app.js');
if(!html.includes('src="verb-presentation.js'))html=html.replace(/<script src="app\.js/, '<script src="verb-presentation.js"></script><script src="app.js');
if(!html.includes('src="first-win.js'))html=html.replace(/<script src="app\.js/, '<script src="first-win.js"></script><script src="app.js');
if(!html.includes('src="cheatsheet-data.js'))html=html.replace(/<script src="app\.js/, '<script src="cheatsheet-data.js"></script><script src="cheatsheet-engine.js"></script><script src="app.js');
html=html.replaceAll('Magyar Flip','WordFlip');
html=html.replace('magyar<span>flip.</span>','word<span>flip.</span>');
html=html.replace('✦ Mixed</button>','✦ Automatic</button>');
html=html.replace('Progress is saved on this device. Language expansion and import/export are planned for a later version.','Progress is saved on this device. Use the backup options below before removing or reinstalling the app.');
html=html.replace(/<title>[^<]*<\/title>/,'<title>WordFlip</title>');
if(!html.includes('rel="apple-touch-icon"'))html=html.replace('</head>','<link rel="apple-touch-icon" sizes="180x180" href="icon-180.png"></head>');
if(!html.includes('apple-mobile-web-app-title'))html=html.replace('</head>','<meta name="apple-mobile-web-app-title" content="WordFlip"></head>');
if(!html.includes('href="update-manager.css')) html=html.replace('<title>','<link rel="stylesheet" href="update-manager.css"><script src="update-manager.js" defer></script><title>');
// Private Sites require authentication for individual asset requests. An
// embedded Apple touch icon lets iOS read the artwork from the authenticated
// page itself, without a separate request for the icon file.
const embeddedIcon=`data:image/png;base64,${fs.readFileSync(path.join(dist,'icon-180.png')).toString('base64')}`;
html=html.replace(/<link rel="apple-touch-icon"[^>]*>/,`<link rel="apple-touch-icon" sizes="180x180" href="${embeddedIcon}">`);
html=html.replace(/<link rel="icon"[^>]*>/g,'');
html=html.replace('</head>',`<link rel="icon" type="image/png" href="${embeddedIcon}"></head>`);
for(const name of assets.filter(a=>a!=='cards.json')){
  const escaped=name.replaceAll('.','\\.');
  html=html.replace(new RegExp(`(src|href)="${escaped}(?:\\?v=[a-f0-9]+)?"`,'g'),(_,attribute)=>`${attribute}="${name}?v=${hashes[name]}"`);
}
fs.writeFileSync(path.join(dist,'index.html'),html);

const precache=['/','/index.html','/manifest.webmanifest','/cards.json','/italian-cards.json','/croatian-cards.json',...assets.map(name=>`/${name}?v=${hashes[name]}`)];
const swHash=crypto.createHash('sha256').update(JSON.stringify(precache)).digest('hex').slice(0,12);
const template=fs.readFileSync(path.join(import.meta.dirname,'sw.template.js'),'utf8');
fs.writeFileSync(path.join(dist,'sw.js'),template.replace('__CACHE_NAME__',`wordflip-${swHash}`).replace('__PRECACHE__',JSON.stringify(precache)));
console.log(`Built versioned assets: ${swHash}`);
