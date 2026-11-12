# Exploding Volcanoes In The Bathtub: Developer Guide

Read this first before changing the game. It says where things are and gives step-by-step recipes for the
common jobs (add a toy, change prices, add a badge, publish). The history of *why* things are the way they are
is in `experiments/fable-v7.md` (one line per version) and, for the art, `experiments/fable-v5.md`.

Last updated: 2026-11-12, at test version v7.27 / live version v7.23.

## 1. The files that matter

| File | What it is |
|---|---|
| `game-test.js` | **The working copy. Make every change here first.** |
| `play-test.html` | Test page that loads `game-test.js?v=N`. No offline cache. Own saved data. |
| `game-fable-v7.js` | **The live game.** Never edit directly; it is overwritten by `game-test.js` when publishing. |
| `index.html` | Live page. Loads `game-fable-v7.js`, registers `sw.js`. |
| `sw.js` | Offline cache, cache-first. **Its `CACHE` name must be bumped on every live change.** |
| `apple-touch-icon.png`, `apple-touch-icon-test.png` | Home-screen icons (live, test). iPhones ignore SVG icons. |
| `assets/cover-volcanoes.webp` | Start-screen cover art. |
| `game-fable-v5.js`, `game.js` + `original.html` | Older versions, kept for reverting. Do not delete. |
| `.nojekyll` | Makes GitHub Pages publish files as-is. Without it builds were failing. |

The whole game is one JavaScript file drawing to one `<canvas>`. No build step, no libraries.

Links: live `https://dnachimow-evitb.github.io/exploding-volcanos/` , test `.../play-test.html`.

## 2. Workflow (agreed with Derek)

1. Edit `game-test.js`. Bump `VERSION` (top of file) and the `?v=N` number in `play-test.html` every time.
   He checks the small version label in the corner of the start screen to confirm he has the new build.
2. Commit, push, wait for GitHub Pages, confirm the test link serves the new `VERSION`.
3. He tries it on his iPhone (home-screen icon "Volcanoes Test").
4. **Publish only when he says so:** copy `game-test.js` over `game-fable-v7.js`, bump the `CACHE` name in
   `sw.js`, bump `?v=` in `play-fable-v7.html`, commit, push, confirm the live site serves the new `VERSION`.
5. Add a line to `experiments/fable-v7.md` for every version.

Git: work on branch `model/fable-v7`, fast-forward `main` to it, push both. GitHub Pages serves `main`.
Tags: `test-vX.YY` for test builds, `fable-v7-vN` for live publishes. Revert points: `before-v7-publish`
(back to version 5) and `before-v5-publish` (back to the original). Exact revert commands are in `README.txt`.

If a Pages build sticks or fails: `gh api -X POST repos/dnachimow-evitb/exploding-volcanos/pages/builds`.

## 3. Map of `game-test.js`

Sections are marked with `// ── NAME ──` comments, in this order:

- Top: `VERSION`, flags (`swipeMode`, `hardMode`, `TEST`), toy tables (`BASE`, `NEWBY`, `TOYNAME`, `SHOP`,
  `DEF_LINE`, `ALL_TOYS`), difficulty table `DIFF` (one row per round: crater size, drift, Max speed, time).
- AUDIO, INPUT (`down`, `release`, swipe handling), PHYSICS (`step`: floating, bumping, flight, scoring;
  `roundWin`; `startRound`; `startGame`).
- TOYS: the vector toy painters (`TOYS` object) and `buildToys` (caches each toy to a canvas with a white rim).
- Renderer: backdrop, water, volcano, Noah and Max, toys, aim guide and tutorial, HUD.
- CARDS + TITLE: `cardBegin` / `cardEnd`, `button`, intro / new-toy / pause / result cards.
- BADGES AND STATS: players (`PF`), stats (`ST`), `BADGES` table, coins, badge banner, Badges card, Players cards.
- MY TOYS: lineup + shop card.
- HOW TO PLAY, start screen (`drawMenu`), eruption lettering, SWIPE TO THROW, FRAME (`draw`, `resize`).

Conventions:
- Logical canvas is 380 units wide; height `HS` varies (720 minimum). `SAFE` / `SAFEB` are the top / bottom
  phone insets in logical units. All top-of-screen UI is positioned from `SAFE`.
- **Buttons:** `button(x,y,w,h,label,action,{size,id,col,colD,colP})`. `id` 0 is the main button (`card`),
  2/3/4 are `card2/3/4`, **5 and up go into the `hits` list** (use a fresh number for a new button).
  Bare tap areas: `hits.push({x,y,w,h,act,key:uiKey,id})`. Everything is cleared and rebuilt each frame.
- **Start-screen cards** are flags checked in `drawMenu`: `howTo`, `bdgPg`, `toysT0`, `pfOpen` (+ `nameEd`,
  `pfToy`, `pfDel`). A new card needs: a flag, a branch in that if-chain, a reset in `goMenu`, and to be added
  to the `!howTo&&!bdgPg&&!pfOpen&&!toysT0` conditions that hide the chips and test buttons.
- **Text style (Derek's rule):** Title Case On Every Word for titles, buttons and labels; sentence case only
  for full sentences. Nothing faded or see-through in the game art. Few rounded shapes.
- **No system pop-ups** (`prompt`, `confirm`, `alert`): they do not open in the iPhone home-screen app.
- The `TEST` flag is true only on `play-test.html`. Test-only tools (the "+50" coin and "Rd N" start-round
  buttons beside Push and Swipe, the debug line bottom-left) are wrapped in `if(TEST…)`, so they stay hidden
  in the live game even though it runs the same file.

## 4. Saved data (per phone, `localStorage`)

- Live key `evitb-profiles-v1`, test key `evitb-test-profiles-v1` (seeded once from the live one).
- Shape: `{cur, list:[{name, icon, st:{…stats}, coins, owned:[toy keys], line:[12 toy keys]}]}`, up to 4 players.
- Loading is defensive: unknown stats are dropped, a bad lineup resets to default (`lineFix`), missing `coins`
  is back-paid from badges already held. **When adding a field, add it in three places:** the load `map`,
  the default "Player 1" object, and the new-player object in `pfNameDone`. Give old saves a sensible default.
- Old key `evitb-stats-v1` (pre-players) is read once and becomes Player 1.

## 5. Recipes

### Add a toy to the shop
1. **Draw it.** In the `TOYS` object add a painter, just before the `'🧶'` (hairball) entry:
   ```js
   seal(k){const{C,E,S,blob,sh,line,eye,gloss}=k;
    blob('#8a97a8',[E(0,8,34,22)]);   // filled shapes with the white sticker rim
    eye(20,-2,3.6); },
   ```
   Draw inside roughly -48..48 in both directions, centred on 0,0, facing right. Kit helpers:
   `C(x,y,r)` circle path, `E(x,y,a,b)` ellipse path, `S(x,y,R,r)` star path;
   `blob(fill,[paths],rim)` filled shape(s) with rim; `sh(path,fill,strokeW,strokeCol)` flat detail;
   `line(path,col,width,rim)`; `eye(x,y,r)`; `gloss(path)`. Paths are SVG path strings.
   Look at `whale`, `crab`, `penguin` for the house style: 2 to 4 flat colours, dot eyes, a smile, pink cheeks.
2. **Name it:** add `seal:'Seal'` to the `Object.assign(TOYNAME,{…})` line.
3. **Price it:** add `['seal',95]` to `SHOP`.
4. That is all the wiring. `ALL_TOYS`, the grey "locked" copy, the My Toys grid, the icon picker and the
   lineup all pick it up from `SHOP`.
5. **My Toys card: keep "Other Toys" at 8 per page.** The lower grid shows only toys that are not in the
   lineup, 4 per row, 2 rows. With 20 toys that is exactly 8. **Derek's decision (2026-11-12): when there are
   more than 20 toys, do NOT make the card taller. Keep the 8-cell area and add paging** (previous / next
   arrows and a "1 Of 2" label, like the Badges card). Paging is not built yet: the 21st toy is the trigger
   to build it in `drawMyToys` (slice `pool` by page; reset the page in `openToys`).
6. Optional real art: put `assets/toys/<name>.png` in place and add the key to `SPRITE_FILE`; a PNG replaces
   the drawn version automatically.

### Change the default 12 toys or the number of rounds
`BASE` (3 starting toys) + `NEWBY` (round 2..10) make `DEF_LINE`, which must stay 12 long. More rounds also
needs: more rows in `DIFF`, the `round>=10` checks in `roundWin`, "/10" in the HUD, the win card text, the
lineup size (12) in `lineFix` / `drawMyToys` / `startGame`, and the "This Is The End!" badge. Crowding was
measured for up to 12 toys only.

### Change prices or coin payouts
`SHOP` (prices), `COIN_ROUND`, `COIN_WIN`, `COIN_BADGE` near the top. The back-pay table `[0,20,60,140]`
(running totals of `COIN_BADGE`) is next to `addCoins`; keep the two in step.

### Add or retune a badge
`BADGES` table: `{id, name, how, t:[bronze,silver,gold], best?}`. `id` is a stat in `ST0`. For a new stat:
add it to `ST0`, call `stat('id')` (count up) or `statMax('id',value)` (personal best) where it happens,
add a picture in `badgeIcon`. `best:'Label'` marks a personal-best badge (shown as "Best …" and "Goal: …").
Six badges per Badges page; a 13th needs a third page.

### Add a start-screen button
The row under Swipe is drawn in `drawMenu` (step 0) and spans exactly the width of Push/Swipe (232 units).
Derek wants that alignment kept.

### Tune floating, speed, difficulty
- Float speed: `floatSpd(d)`. Bumping and the crowd slow-down: top of `step`. Toys keep their own speed when
  they bump (trading speeds let the slow hairball freeze toys: fixed in v7.23, do not reintroduce).
- Throw feel: SWIPE TO THROW block (constants documented there); push uses `CHARGE_RATE`, `CHARGE_MAX`.
- Per-round difficulty: `DIFF`.

## 6. Testing without a phone

- Serve the folder with any static server and open `play-test.html` at about 375x812.
- Jump to a state from the browser console: globals are plain (`state`, `round`, `objs`, `PF`, `ST`, …).
  Start round 9: use the "Rd" test button, or set `round`, `currentToys`, call `startRound(false)`, `state='play'`.
- **Step the game by hand** when timers are throttled (hidden tab): stub `requestAnimationFrame`, then call
  `loop(t)` with `t` rising 16.67 each call. That is how the bumping and speed numbers in the notes were measured.
- Click real buttons, do not just call their actions: the Add Player bug (system pop-up) was missed that way.
- Things that only show on a real iPhone home-screen app: the status-bar inset (see the comment above
  `resize`), haptics, audio start, the home-screen icon. Ask Derek to check those; the debug line on the test
  page (`s<inset> h<window>/<screen> app|web`) reports what his phone measures.
