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
assert.match(app,/languageOverlay\.id='wordflipLanguageOverlay'/);
assert.match(app,/role="dialog" aria-modal="true"/);
assert.match(app,/className='language-overlay-card'/);
assert.match(app,/choice\.querySelector\('\.language-overlay-name'\)\.textContent=meta\.name/);
assert.match(app,/card\.classList\.toggle\('is-current',selected\)/);
assert.match(app,/overlayClose\.onclick=closeCoins/);
assert.match(app,/languageOverlay\.querySelector\('\.language-overlay-backdrop'\)\.onclick=closeCoins/);
assert.match(app,/if\(event\.key==='Escape'\)/);
assert.match(app,/window\.WordFlipNavigateToLanguages=goToLanguages/);
assert.match(app,/choice\.onclick=\(\)=>/);
assert.match(layout,/\.language-overlay-card\{/);
assert.match(layout,/\.language-overlay\[hidden\]\{display:none!important\}/);
assert.match(layout,/\.language-switch\.is-open \.language-coin,/);
assert.match(layout,/\.story-back,\.activity-practice-back/);
assert.doesNotMatch(layout,/\.practice-exit,\.summary #returnToMenu\{display:none!important\}/,'Training exit must remain visible');
console.log('Language switcher opens labelled card overlay, supports dismissal and keeps flags stationary.');

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

assert.match(app,/backRow\.className='wordflip-back-row'/,
  'Back must be on its own row below the header');
assert.match(app,/insertAdjacentElement\('afterend',backRow\)/,
  'Back row must follow the complete brand and settings header');
assert.match(layout,/\.wordflip-back-row\{display:flex;/,
  'Back row must be visibly left aligned');
assert.match(layout,/body\.training \.wordflip-back-row\{display:none!important\}/,
  'Training must retain its dedicated visible Back exit');
assert.match(layout,/button\.brand\{font-family:inherit;font-weight:780;/,
  'WordFlip logo must retain its heavy wordmark typography');
assert.match(source('training-layout.css'),/body\.training \.practice-exit \{display:flex\}/,
  'Practice view must show its own Back control');
console.log('Back controls visible in header and flashcard training.');

assert.match(app,/function openSettings\(\)/,'Settings opens as a child page');
assert.match(app,/window\.WordFlipDrill\.run\('forward',\(\)=>\{/,'Settings must use the forward transition');
assert.match(app,/function closeSettings\(\)/,'Settings has a return action');
assert.match(app,/window\.WordFlipCloseSettings=closeSettings/,'The navigation engine can close Settings');
assert.match(app,/settingsOrigin=\{training:body\.classList\.contains\('training'\),scrollY:window\.scrollY\}/,
  'Returning from Settings must restore the previous screen and scroll');
assert.match(nav,/classList\.contains\('settings-view-open'\)/,
  'Right swipe must recognise the Settings page');
assert.match(nav,/WordFlipCloseSettings\?\.\(\)/,
  'Right swipe must return from Settings');
assert.match(layout,/body\.settings-view-open main > :not\(\.top\):not\(\.wordflip-back-row\):not\(#settings\)/,
  'Settings must replace, not overlay, the main page');
assert.match(layout,/body\.settings-view-open \.wordflip-back-button\{display:grid!important\}/,
  'Back remains visible in Settings including from language selection');
assert.match(layout,/#settingsButton\.icon\{/,'Settings circle has an explicit size');
assert.match(layout,/width:49px;height:49px;min-width:49px;min-height:49px/,
  'Settings and flag coins have matching 49px frames');
console.log('Settings drill-down, reverse navigation and equal circular header controls verified.');
