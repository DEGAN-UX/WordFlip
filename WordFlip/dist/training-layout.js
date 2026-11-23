document.addEventListener('DOMContentLoaded', () => {
  const body=document.body;
  const progress=document.querySelector('.progress');
  const exit=document.createElement('button');
  exit.className='practice-exit';
  exit.type='button';
  exit.textContent='←';
  exit.setAttribute('aria-label','Return to practice menu');
  exit.title='Return to practice menu';
  progress.prepend(exit);
  const launch=document.createElement('button');
  launch.className='home-launch';
  launch.type='button';
  launch.textContent='Start practice →';
  document.getElementById('filters').insertAdjacentElement('afterend',launch);
  const begin=()=>window.WordFlipDrill.run('forward',()=>{
    body.classList.add('training');
    document.getElementById('settings').style.display='none';
    document.getElementById('restart').click();
    window.scrollTo(0,0);
  });
  exit.addEventListener('click', e=>{e.preventDefault();e.stopPropagation();window.WordFlipDrill.run('back',()=>{body.classList.remove('training');window.scrollTo(0,0);})});
  launch.addEventListener('click',begin);
  document.getElementById('filters').addEventListener('click',()=>{
    // Choose the subject on the home screen, then explicitly start the session.
  });
  document.getElementById('again').addEventListener('click',()=>body.classList.add('training'));
  // New multilingual home opens first; user explicitly launches a session.
});
