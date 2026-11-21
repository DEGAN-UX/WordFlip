(() => {
  if(!('serviceWorker' in navigator))return;
  let registration,waiting,refreshing=false,pendingReload=false;
  const hadController=!!navigator.serviceWorker.controller;
  const banner=document.createElement('aside');
  banner.className='update-banner';banner.hidden=true;
  banner.setAttribute('aria-live','polite');
  const info=document.createElement('div');
  info.innerHTML='<strong>Update ready</strong>A newer WordFlip is available.';
  const button=document.createElement('button');button.textContent='Update now';
  banner.append(info,button);
  document.body.appendChild(banner);

  function safeToOffer(){
    return !document.body.classList.contains('training') ||
      document.getElementById('study')?.classList.contains('hidden');
  }
  function present(){
    if(pendingReload&&safeToOffer()&&!refreshing){refreshing=true;location.reload();return;}
    banner.hidden=!(waiting&&safeToOffer());
  }
  function inspect(){waiting=registration?.waiting||null;present();}
  button.onclick=()=>{
    if(!waiting)return;
    banner.hidden=true;
    waiting.postMessage({type:'SKIP_WAITING'});
  };
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!hadController)return; // First-time installation should not interrupt practice.
    pendingReload=true;
    present();
  });
  const observe=new MutationObserver(present);
  observe.observe(document.body,{attributes:true,attributeFilter:['class']});
  const study=document.getElementById('study');
  if(study)observe.observe(study,{attributes:true,attributeFilter:['class']});

  navigator.serviceWorker.register('/sw.js').then(reg=>{
    registration=reg;
    inspect();
    reg.addEventListener('updatefound',()=>{
      const worker=reg.installing;
      if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='installed')inspect();});
    });
    // Check on app opening, on return from another app, and during long sessions.
    reg.update().catch(()=>{});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)reg.update().catch(()=>{});});
    setInterval(()=>{if(!document.hidden)reg.update().catch(()=>{});},30*60*1000);
  }).catch(()=>{});
})();
