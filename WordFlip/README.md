# WordFlip

A lightweight Hungarian and Italian flashcard PWA. Language modules have independent review algorithms, card collections and browser-local progress. The app uses vanilla HTML, CSS and JavaScript — no React, Angular or npm dependencies.

## Project files

- `dist/index.html` — main interface and page structure.
- `dist/app.js` — flashcards, interaction and local progress tracking.
- `dist/cards.json` — compiled 550-card learning collection.
- `dist/*.css`, `dist/training-layout.js` and `dist/update-manager.js` — layout and update handling.
- `dist/sw.js`, `dist/manifest.webmanifest` — offline-capable PWA support.
- `dist/hungarian-engine.js`, `dist/italian-engine.js` — independent review scheduling.
- `dist/italian-cards.json` — 690 vocabulary words (including 120 adjectives and 40 new adverbs), 150 conversational phrases, 60 verb conjugations and 41 preposition cards. Previous article drills remain in the data for ID stability but are retired from practice.
- `content/italian-core.txt`, `content/italian-expansion.txt`, `content/italian-grammar-words.txt`, `generate-italian.mjs` — editable Italian content and generator.
- `content/` — editable Hungarian source vocabulary, grammar and phrase data.
- `compile-content.mjs` — generates cards from source content.
- `build-assets.mjs`, `sw.template.js` — prepares cached assets for deployment.
- `make_reference.py` — optional PDF reference generator.

## Open and edit in Cursor

1. Extract the ZIP and open the `magyar-flip` folder in Cursor.
2. Edit the HTML, CSS, JavaScript or content files.
3. Run `node compile-content.mjs` after editing Hungarian source content.
4. Run `npm run build` to regenerate Italian cards and versioned PWA assets; `npm run check` checks JavaScript syntax.

Italian priorities are deliberately interleaved across nouns, verbs, adjectives, adverbs, prepositions, phrases and conjugation drills. Previously issued card IDs remain stable across vocabulary expansions, retaining existing Italian review history. Articles remain included with nouns rather than being a separate exercise type.

The `dist/` folder contains the files to publish on an HTTPS static host. For local browser testing, use a simple static development server (for example `python3 -m http.server 8000 --directory dist`); service-worker functionality is also supported on localhost.

## Upload to a new GitHub repository

1. Sign in to GitHub, choose **New repository**, name it `wordflip`, and set it to **Private** if preferred.
2. Open the extracted project in Cursor and open **Terminal → New Terminal**.
3. Run these commands, replacing `YOUR_USERNAME`:

   ```bash
   git init
   git add .
   git commit -m "Initial WordFlip source"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/wordflip.git
   git push -u origin main
   ```

You may need to sign in to GitHub when prompted. This creates a separate source repository; the existing published site is not changed by uploading code.

## Privacy and learning progress

Hungarian progress retains the original `magyar-flip-progress-v1` key; Italian uses `wordflip-italian-progress-v1`. Progress is stored separately in your browser and is **not** included in source exports or synced via GitHub. Do not publish personal progress exports or credentials.
