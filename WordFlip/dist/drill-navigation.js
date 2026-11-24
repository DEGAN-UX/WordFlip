/* Horizontal, hierarchical navigation, using browser-managed visual snapshots.
   Changing screens is still synchronous; the animation never owns app state. */
(() => {
  let transitioning=false;
  function run(direction,change){
    if(typeof change!=='function')return;
    const forward=direction!=='back';
    const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if(transitioning||reduce||typeof document.startViewTransition!=='function'){
      change();
      return;
    }
    transitioning=true;
    document.documentElement.dataset.drillDirection=forward?'forward':'back';
    try{
      const transition=document.startViewTransition(()=>change());
      transition.finished.catch(()=>{}).finally(()=>{
        delete document.documentElement.dataset.drillDirection;
        transitioning=false;
      });
    }catch(error){
      delete document.documentElement.dataset.drillDirection;
      transitioning=false;
      change();
    }
  }
  // Resolve the visible child first; parent actions use the same Back handlers
  // as the UI buttons so swipe never creates a parallel navigation state.
  function backTarget(){
    const body=document.body;
    if(body.classList.contains('progress-view-open'))
      return document.querySelector('#learningProgress .progress-back');
    const library=document.getElementById('wordflipStories') || document.getElementById('italianStories');
    if(body.classList.contains('stories-view-open') && library && !library.hidden){
      const reader=library.querySelector('.story-read-view');
      if(reader && !reader.hidden)return reader.querySelector('.story-back');
      return library.querySelector('.story-library-back');
    }
    if(body.classList.contains('training'))
      return document.querySelector('.practice-exit');
    const summary=document.getElementById('summary');
    if(summary && getComputedStyle(summary).display!=='none' && !summary.hidden)
      return document.getElementById('returnToMenu');
    if(body.classList.contains('story-home-open'))
      return null; // Activity hub returns to languages through its explicit handler.
    if(body.classList.contains('language-selected'))
      return document.querySelector('.activity-practice-back');
    return null; // Language picker is the root page.
  }

  function swipeBack(){
    if(transitioning)return false;
    // Settings is its own child page: the gesture returns to the exact parent.
    if(document.body.classList.contains('settings-view-open')){
      window.WordFlipCloseSettings?.();return true;
    }
    const coins=document.getElementById('languageSwitcher');
    if(coins?.classList.contains('is-open')){
      window.WordFlipCloseCoins?.();return true;
    }
    if(document.body.classList.contains('story-home-open')){
      window.WordFlipNavigateToLanguages?.();return true;
    }
    const back=backTarget();
    if(!back||back.disabled)return false;
    back.click();
    return true;
  }

  let touch=null;
  const noSwipeTargets='input,textarea,select,[contenteditable="true"],[role="slider"],.story-word-tooltip';
  const horizontalArea='[data-swipe-horizontal],.carousel,[role="tablist"]';
  document.addEventListener('touchstart',event=>{
    if(event.touches.length!==1||transitioning){touch=null;return;}
    const target=event.target;
    if(target.closest(noSwipeTargets)||target.closest(horizontalArea)){touch=null;return;}
    const finger=event.touches[0];
    touch={x:finger.clientX,y:finger.clientY,at:Date.now()};
  },{passive:true});
  document.addEventListener('touchcancel',()=>{touch=null;},{passive:true});
  document.addEventListener('touchend',event=>{
    if(!touch||event.changedTouches.length!==1){touch=null;return;}
    const start=touch;touch=null;
    const finger=event.changedTouches[0];
    const dx=finger.clientX-start.x,dy=finger.clientY-start.y;
    // Require an intentional, predominantly horizontal gesture.
    if(dx<75||Math.abs(dy)>55||dx<Math.abs(dy)*1.6||Date.now()-start.at>900)return;
    swipeBack();
  },{passive:true});

  window.WordFlipDrill={run,swipeBack};
})();
