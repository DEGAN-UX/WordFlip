const CACHE='wordflip-7b7ee14ad6c8';
const ASSETS=["/","/index.html","/manifest.webmanifest","/cards.json","/italian-cards.json","/croatian-cards.json","/app.js?v=3ccde798e04e","/pool-announcements.js?v=87f3417d6007","/adaptive-engine.js?v=bd776c992f7b","/progress-stats.js?v=4153d168dbe8","/progress-transfer.js?v=72fae020b7ef","/verb-presentation.js?v=a29bacd1e758","/first-win.js?v=20bcac835096","/cheatsheet-data.js?v=6385da484791","/cheatsheet-engine.js?v=afbaf5b3083c","/training-layout.js?v=a5916178225a","/update-manager.js?v=626ce776ec20","/mobile-fix.css?v=6892af1f6e10","/training-layout.css?v=f0b0b3704db0","/update-manager.css?v=6d933c46e1b4","/wordflip.css?v=d989b4ff005f","/hungarian-engine.js?v=cda36c5dfa7f","/italian-engine.js?v=59f74615721a","/croatian-engine.js?v=b5eb483c30ec","/cards.json?v=57f0fd084351","/italian-cards.json?v=a42d7afa2c24","/croatian-cards.json?v=77218cb6ec94","/icon-180.png?v=deb2cfcc1a1f","/icon-192.png?v=0d173b62b57e","/icon-512.png?v=39dc5a70d812"];

self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(ASSETS))
));
self.addEventListener('activate',event=>event.waitUntil(
  Promise.all([
    self.clients.claim(),
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('magyar-flip-')&&key!==CACHE).map(key=>caches.delete(key))))
  ])
));
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;
  event.respondWith(
    fetch(event.request).then(response=>{
      if(response.ok){
        const copy=response.clone();
        event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));
      }
      return response;
    }).catch(()=>caches.match(event.request))
  );
});
