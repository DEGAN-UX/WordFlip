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
  window.WordFlipDrill={run};
})();
