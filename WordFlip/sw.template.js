// Cache names and requests belong to this installation path only.
const SCOPE=new URL(self.registration.scope);
const PREFIX='wordflip:'+encodeURIComponent(SCOPE.pathname)+':';
const CACHE=PREFIX+'__CACHE_NAME__';
const ASSETS=__PRECACHE__.map(asset=>new URL(asset,SCOPE).href);

self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(ASSETS))
));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim())
));
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;
  const response=fetch(event.request);
  // Register the cache write while the fetch event is still being dispatched.
  event.waitUntil(response.then(result=>{
    if(result.ok)return caches.open(CACHE).then(cache=>cache.put(event.request,result.clone()));
  }).catch(()=>{}));
  event.respondWith(response.catch(async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(event.request);
    if(cached)return cached;
    if(event.request.mode==='navigate'){
      const page=await cache.match(new URL('index.html',SCOPE).href);
      if(page)return page;
    }
    return Response.error();
  }));
});
