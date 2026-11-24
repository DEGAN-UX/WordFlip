import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=(name)=>fs.readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
const nav=source('drill-navigation.js');
const css=source('drill-navigation.css');
const layout=source('wordflip.css');
const app=source('app.js');
const reader=source('italian-stories.js');
const training=source('training-layout.js');
const html=source('index.html');
assert.match(nav,/document\.startViewTransition/);
assert.match(nav,/prefers-reduced-motion/);
assert.match(css,/wf-page-old-forward/);
assert.match(css,/translateX\(-100%\)/);
assert.match(css,/wf-page-new-forward/);
assert.match(css,/translateX\(100%\)/);
assert.match(css,/wf-page-old-back/);
assert.match(css,/wf-page-new-back/);
assert.match(css,/cubic-bezier\(\.45,0,\.18,1\)/);
assert.match(layout,/\.language-cards\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(app,/WordFlipDrill\.run\('forward'/);
assert.match(app,/WordFlipDrill\.run\('back'/);
assert.match(app,/WordFlipShowHub\?\.\(\)/);
assert.match(reader,/window\.WordFlipShowHub=showHub/);
assert.match(reader,/window\.WordFlipHideStoryViews/);
assert.match(reader,/WordFlipDrill\.run\('forward',showStories\)/);
assert.match(reader,/WordFlipDrill\.run\('back',closeReading\)/);
assert.match(training,/WordFlipDrill\.run\('forward'/);
assert.match(training,/WordFlipDrill\.run\('back'/);
assert.ok(html.indexOf('src="drill-navigation.js"')<html.indexOf('src="app.js'),'Navigation engine must load before app');
assert.match(html,/href="drill-navigation\.css(?:\?v=[a-f0-9]+)?"/);
console.log('Compact language tiles and bidirectional drill navigation assets verified.');

assert.match(nav,/touchstart/);
assert.match(nav,/touchend/);
assert.match(nav,/touchcancel/);
assert.match(nav,/dx<75/);
assert.match(nav,/Math\.abs\(dy\)>55/);
assert.match(nav,/backTarget\(\)/);
assert.match(nav,/\.story-read-view/);
assert.match(nav,/\.story-library-back/);
assert.match(nav,/\.activity-practice-back/);
assert.match(nav,/\.practice-exit/);
assert.match(nav,/\.progress-back/);
assert.match(nav,/WordFlipNavigateToLanguages/,'Swipe on activity hub opens language picker');
assert.match(nav,/return null; \/\/ Language picker is the root page/);
assert.match(nav,/if\(transitioning\)return false/);
console.log('Right-swipe gestures use the active screen back control and preserve vertical scrolling.');

assert.match(app,/id='languageSwitcher'/);
assert.match(app,/className='language-coin-tray'/);
assert.match(app,/className='language-coin-toggle'/);
assert.match(app,/Switch to '\+meta\.name/);
assert.match(app,/window\.WordFlipNavigateToLanguages=goToLanguages/);
assert.match(app,/coin\.onclick=event=>/);
assert.match(layout,/\.language-switch\.is-open \.language-coin/);
assert.match(layout,/\.story-back,\.activity-practice-back/);
assert.doesNotMatch(layout,/\.practice-exit,\.summary #returnToMenu\{display:none!important\}/,'Training exit must remain visible');
console.log('Coin switcher, direct selection and swipe-only back navigation verified.');

assert.match(html,/<button type="button" class="brand" id="wordflipHome"/,'Icon and title must share a Home button');
assert.match(app,/getElementById\('wordflipHome'\)\.onclick=/,'Home button must be wired');
assert.match(app,/goToLanguages\(\);\n  \};/,'Home button returns to language landing page');
assert.match(layout,/button\.brand:focus-visible/,'Home button must be keyboard accessible');
console.log('WordFlip icon and wordmark navigate home.');

assert.match(app,/id='wordflipBack'/,'Visible Back button must exist');
assert.match(app,/backButton\.onclick=\(\)=>window\.WordFlipDrill\.swipeBack\(\)/,'Back button and swipe must share navigation logic');
assert.match(layout,/\.wordflip-back-button\{/,'Visible Back button must be styled');
assert.match(layout,/body:not\(\.language-selected\) \.wordflip-back-button\{display:none\}/,'Root language picker must not show Back');
console.log('Header Back button shares the existing swipe-back navigation.');

assert.match(app,/insertBefore\(backButton,document\.getElementById\('wordflipHome'\)\)/,
  'Back must be placed outside overlapping language-flag controls');
assert.match(layout,/\.top>\.wordflip-back-button\{position:relative;z-index:2/,
  'Back must stay visible beside the title');
assert.match(training,/body\.training \.practice-exit \{display:flex\}/,
  'Practice view must show its own Back control');
console.log('Back controls visible in header and flashcard training.');
