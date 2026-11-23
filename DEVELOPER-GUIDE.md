# Exploding Volcanoes In The Bathtub: Developer Guide

Read this first before changing the game. It says where things are and gives step-by-step recipes for the
common jobs (add a toy, change prices, add a badge, publish). The history of *why* things are the way they are
is in `experiments/fable-v7.md` (one line per version) and, for the art, `experiments/fable-v5.md`.

Last updated: 2026-11-17, at test version v8.13 / live version v7.45.

**Next major version (v8, Multiplayer mode: a new mode beside the main game, which it does not replace): design in `experiments/v8-design.md`, work list in
`experiments/v8-backlog.md`.** Derek gave the go-ahead on draft 2 on 2026-11-17; what is built so far is in
`experiments/fable-v8.md` (add a line there, not in fable-v7.md, for every v8 version). His fixed points: two devices is
required, powers are limited and earned, and the goal of the whole version is to make the game stickier. New ideas from him go in the backlog's Ideas inbox.

## 1. The files that matter

| File | What it is |
|---|---|
| `game-test.js` | **The working copy. Make every change here first.** |
| `play-test.html` | Test page. Loads `game-test.js` under a new address on every open, so it always runs the newest build (no `?v=N` to bump). No offline cache. Own saved data. |
| `game-fable-v7.js` | **The live game.** Never edit directly; it is overwritten by `game-test.js` when publishing. |
| `index.html` | Live page. Loads `game-fable-v7.js`, registers `sw.js`. |
| `sw.js` | Offline cache, cache-first. **Its `CACHE` name must be bumped on every live change.** |
| `apple-touch-icon.png`, `apple-touch-icon-test.png` | Home-screen icons (live, test). iPhones ignore SVG icons. |
| `assets/cover-volcanoes.webp` | Start-screen cover art. |
| `game-fable-v5.js`, `game.js` + `original.html` | Older versions, kept for reverting. Do not delete. |
| `.nojekyll` | Makes GitHub Pages publish files as-is. Without it builds were failing. |
| `site-src/` | **Source of the story website. Edit here, then run `python3 site-src/build.py`.** Fragments `home.html`, `the-song.html`, `the-game.html`, `album.html` hold each page's content; `build.py` holds the header, menu, side rail, footer and `<head>` once, and the site map (`PAGES`). Bump `VERSION` in `build.py` on every change. |
| `story.html`, `the-song.html`, `the-game.html`, `album.html` | **The story website, BUILT files: never edit them directly.** Split on 2026-11-16 at Derek's request into a homepage and three chapters. `story.html` is the homepage (hero, a three-chapter overview, download buttons); its address is the one the App Store listing links to, so it must keep that name. Chapter One `the-song.html`: 01 The Jam (`#story`), 02 The AI (`#journey`), 03 The Song (`#song`, the player). Chapter Two `the-game.html`: 01 The Experiment, 02 The Game, 03 The Cast, then For Parents and his quote. Chapter Three `album.html`: The Pile, The Upload, The Conflict, The Name. Each chapter ends with a link to the next. Old links to sections of `story.html` are redirected to the right chapter. |
| `assets/site/` | The site's shared stylesheet (`site.css`), scripts (`site.js`: menu, side rail, fade-in) and images: toys, Noah, Max and the volcano exported from the game, crops of the cover, web-sized copies of `native/screenshots/`. |
| `privacy.html`, `support.html` | Hand-written companion pages (not built). |
| `relay/` | **The Multiplayer relay** (v8.9): a Cloudflare Worker that passes messages between two devices in a room and stores nothing. `src/index.js`, `wrangler.toml`, tests in `test/relaytest.js`. Deployed by `.github/workflows/relay.yml` on every push to `relay/` (the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set), which then tests the live relay. Live since 2026-11-23 at `https://exploding-volcanoes-relay.dnachimow.workers.dev`. The cloud session cannot reach that address; read the workflow's log for the live test. |
| `native/` | **The iPhone App Store app** (Capacitor wrapper that packages the live game). Roadmap, checklist and decisions: `native/APP-STORE.md`. Built on GitHub's Macs by `.github/workflows/ios.yml`. |

The whole game is one JavaScript file drawing to one `<canvas>`. No build step, no libraries.

Links: live `https://dnachimow-evitb.github.io/exploding-volcanos/` , test `.../play-test.html`.

## 2. Workflow (agreed with Derek)

1. Edit `game-test.js`. Bump `VERSION` (top of file) every time. (`play-test.html` needs no change: since v7.40
   it fetches the newest `game-test.js` on every open and reloads itself when a newer `VERSION` is published.)
   He checks the small version label in the corner of the start screen to confirm he has the new build.
2. Commit, push, wait for GitHub Pages, confirm the test link serves the new `VERSION`.
3. He tries it on his iPhone (home-screen icon "Volcanoes Test").
4. **Publish only when he says so:** copy `game-test.js` over `game-fable-v7.js`, bump the `CACHE` name in
   `sw.js`, bump `?v=` in `play-fable-v7.html`, commit, push, confirm the live site serves the new `VERSION`.
5. Add a line to `experiments/fable-v7.md` for every version.
6. **The iPhone App Store app does not update when the live game is published.** It packages the live game
   (`native/`, see `native/APP-STORE.md`) and needs a new TestFlight build and Apple review for each update.

Git: work on branch `model/fable-v7`, fast-forward `main` to it, push both. GitHub Pages serves `main`.
Tags: `test-vX.YY` for test builds, `fable-v7-vN` for live publishes. **GitHub adds both by itself** after a push to `main`
(`.github/workflows/tag-versions.yml`, approved by Derek 2026-11-13): Claude's cloud sessions can push branches but
not tags (the gateway answers "only branch updates are permitted"), so do not push these tags by hand. Revert points: `before-v7-publish`
(back to version 5) and `before-v5-publish` (back to the original). Exact revert commands are in `README.txt`.

If a Pages build sticks or fails: `gh api -X POST repos/dnachimow-evitb/exploding-volcanos/pages/builds`.

### Facts Derek has confirmed for the story pages (use these; invent nothing beyond them)
- He enjoys writing music. When something catchy turns up while he is strumming, he hits record so he does not
  forget it. The bath-night volcano song was captured that way, which is why he was recording at all.
- The whole pile of song ideas (about twenty years of them) was effectively captured the same way.
- Noah and Max were part of the bath night only, not the earlier ideas.
- He uploaded his 15 best ideas in one shot; the result is an album. The project/band is also called
  Exploding Volcanoes because that is what started everything.
- It never occurred to him to try AI on the old ideas until the first song worked ("what if we do it for this
  other stuff").
- He does not have the best voice; he is good enough on guitar, no prodigy; he always thought he could write a
  compelling tune; his voice and playing were the wall. No time or money for production. Ideas stuck at 85%.
- He feels real artistic conflict about using AI and wants that said honestly and left unresolved.
- He works in technology and AI for a living. Once they had the song, he applied those same skills in a
  different way to make the game, using Claude Code, to see how far he could push it. (No job title, employer
  or other detail supplied.)
- The album is on Suno: https://suno.com/s/BB8lxmcuPdgzCYWk (Derek's link, 2026-11-16). Read from that page: album
  title "Exploding Volcanoes", by @dnachimow, **11 tracks, about 34 minutes** (list in `site-src/album-tracks.json`).
  Track 1 is the bath-night song. 10 of the 11 are not public on Suno (reachable by the link). The album page
  plays them through Suno's own embed player (`https://suno.com/embed/<id>`), loaded only when a track is tapped;
  Suno does not serve the audio files to anonymous visitors, so they are not hosted on this site.
- OPEN: the page copy says fifteen ideas were uploaded; the album has 11 tracks. Ask Derek before changing either.
- Do NOT use the Suno album's cover image: it is a personal photo of a child with another person in view.
  Track artwork (generated images, copied to `assets/album/`) is fine.

### Probable next chapter: the café (noted 2026-11-19; do not build yet)
The Exploding Volcanos family café is the probable next extension of the site and overall project once things have launched. The concept lives in Derek's Google Drive folder "Exploding Volcanos" (Handbook, Scratchpad, business plan; see `Scratchpad_Addendum_2026-11.md` there). **Do not add anything about it to the site, the game or the repo until Derek says so.**

### After every change to the site or game, give Derek a fresh link (his rule, 2026-11-16)
End the reply with the full, tappable URL of what changed, carrying the new version so his phone does not show
a saved copy: `.../story.html?v=N` or `.../album.html?v=N` (N = the site's `data-v`, add `#section` when one
section changed), `.../play-test.html` for the test game, the bare site address for the live game.

### Who writes what (Derek's rule, 2026-11-16)
- **Words are written by Claude Haiku. Code and design are done by the session's main model.**
  Update 2026-11-16: Derek found a Haiku passage awkward and said to pick a better model for the wording when
  needed. Use a larger model through the same subagent route (`model: "opus"`) for short personal prose that
  has to sound like him; Haiku is fine for plainer copy. Tell him which model wrote what.
  For any copy a person will read on the website (story, album and future pages), hand the writing to a
  Haiku subagent (`Agent` tool with `model: "haiku"`), giving it Derek's facts and his existing pages as the
  voice to match. Do not write or rewrite that copy yourself.
- Haiku may only use facts Derek has given. Tell it so, and ask it to list what it was tempted to invent.
- If Haiku's draft drops or distorts something Derek said, send it back to Haiku with the correction, or
  restore Derek's own words verbatim and tell him. Do not substitute your own phrasing.
- Derek's own sentences (the story sections of `story.html`) are his; neither model rewrites them unasked.
- Short functional labels that are part of building a page (button text, alt text, form labels) are code.

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
- DRESS NOAH: gear shop and what Noah wears (`GEAR` table is at the top, next to `SHOP`).
- TWO DEVICES (v8.12 to v8.13): `net`, `netRoom`, `netQuick`, `drawPerson` (start / join / quick match / the Connected lobby),
  `drawMultiMenu`; the match: `netBegin`, `netSetup`, `netMsg` (every message of a match), `netDrop` (computer takes
  over), `duel.net` ('N' on Noah's device, 'M' on Max's). Read the comment block above `netBegin` before touching it.
  Test with two pages and a local relay: `experiments/sim/two-device-match.js`.
  The relay address is `RELAY`; a test page can set `window.RELAY_URL` first. `mpPg` picks the Multiplayer card.
- MULTIPLAYER (v8): `duel` state and `TUNE` at the top; `startDuel`, `duelStep`, `cpuNoah` after `dist`;
  `drawMulti` (the card, with the test-only tuning panel) and `drawDuelCard` before `askHome`. `duel` is null in the
  main game, and every multiplayer change is behind `if(duel)`, so the main game plays as before.
- HOW TO PLAY, start screen (`drawMenu`), eruption lettering, SWIPE TO THROW, FRAME (`draw`, `resize`).

Conventions:
- Logical canvas is 380 units wide; height `HS` varies (720 minimum). `SAFE` / `SAFEB` are the top / bottom
  phone insets in logical units. All top-of-screen UI is positioned from `SAFE`.
- **Buttons:** `button(x,y,w,h,label,action,{size,id,col,colD,colP,sub})`. `sub` is an optional small second line. `id` 0 is the main button (`card`),
  2/3/4 are `card2/3/4`, **5 and up go into the `hits` list** (use a fresh number for a new button).
  Bare tap areas: `hits.push({x,y,w,h,act,key:uiKey,id})`. Everything is cleared and rebuilt each frame.
- **Start-screen cards** are flags checked in `drawMenu`: `howTo`, `bdgPg`, `toysT0`, `noahT0`, `mpT0`, `pfOpen` (+ `nameEd`,
  `pfToy`, `pfDel`). A new card needs: a flag, a branch in that if-chain, a reset in `goMenu`, and to be added
  to the `!howTo&&!bdgPg&&!pfOpen&&!toysT0&&!noahT0&&!mpT0` conditions that hide the chips and test buttons.
- **Text style (Derek's rule):** Title Case On Every Word for titles, buttons and labels; sentence case only
  for full sentences. Nothing faded or see-through in the game art. Few rounded shapes.
- **The version label stays on the live start screen** (bottom-right corner). Derek wants it there; do not hide it.
- **What Multiplayer is (Derek, 2026-11-23):** just playing = the original game, as Noah. Multiplayer = against a
  PERSON: you choose Max or Noah and are paired with someone who has the other side, by a friend's code or by Quick
  Match. Playing Max against the computer stays as practice, and the computer fills in when nobody is found or a
  player drops. Do not add a solo "be Noah against the computer" mode: that is the main game. Ask before building
  a helper mode he did not request.
- **Derek's rule for Multiplayer (2026-11-17): the physics is not to change; fix what the player sees.** To prove a
  change is picture-only, run `experiments/sim/fp.js` before and after: the fingerprint line must be identical.
- **A button's action runs about 90 ms after the tap and can run twice on a fast double tap.** Re-check inside the
  action (enough coins, value still in range); never trust a value captured when the button was drawn. Found in
  review at v8.4 (stage picker, Buy on the bag card).
- **No system pop-ups** (`prompt`, `confirm`, `alert`): they do not open in the iPhone home-screen app.
- The `TEST` flag is true only on `play-test.html`. Test-only tools (the "+50" coin and "Rd N" start-round
  buttons beside Push and Swipe, the debug line bottom-left) are wrapped in `if(TEST…)`, so they stay hidden
  in the live game even though it runs the same file.

## 4. Saved data (per phone, `localStorage`)

- Live key `evitb-profiles-v1`, test key `evitb-test-profiles-v1` (seeded once from the live one).
- Shape: `{cur, list:[{name, icon, st:{…stats}, coins, owned:[toy keys], line:[12 toy keys], gear:[gear keys owned], wear:[gear keys Noah has on], mxBest: highest Multiplayer stage beaten as Max, mxN: matches played as Max, mxTut: Max School (0 never, 1 skipped, 2 finished), nhBest: highest stage beaten as Noah, pw:{power key: charges owned}}]}`, up to 4 players.
- Loading is defensive: unknown stats are dropped, a bad lineup resets to default (`lineFix`), missing `coins`
  is back-paid from badges already held. **When adding a field, add it in three places:** the load `map`,
  the default "Player 1" object, and the new-player object in `pfNameDone`. Give old saves a sensible default.
- Old key `evitb-stats-v1` (pre-players) is read once and becomes Player 1.

## 5. Recipes

### Add a toy to the shop
1. **Draw it.** In the `TOYS` object add a painter, just before the `'🧶'` (hairball) entry:
   ```js
   otter(k){const{C,E,S,blob,sh,line,eye,gloss}=k;
    blob('#8a97a8',[E(0,8,34,22)]);   // filled shapes with the white sticker rim
    eye(20,-2,3.6); },
   ```
   Draw inside roughly -48..48 in both directions, centred on 0,0, facing right. Kit helpers:
   `C(x,y,r)` circle path, `E(x,y,a,b)` ellipse path, `S(x,y,R,r)` star path;
   `blob(fill,[paths],rim)` filled shape(s) with rim; `sh(path,fill,strokeW,strokeCol)` flat detail;
   `line(path,col,width,rim)`; `eye(x,y,r)`; `gloss(path)`. Paths are SVG path strings.
   Toys do not have to be sea creatures (Derek, 2026-11-12: "it can be anything"). Look at `whale`, `crab`,
   `penguin`, `robot`, `firetruck` for the house style: 2 to 4 flat colours, dot eyes, a smile, pink cheeks.
   Never use pure white for a body: it disappears into the white sticker rim (use an off-white such as `#eef1f7`).
   Add depth with a darker far-side leg or a belly shade; a first zebra without those read as flat.
2. **Name it:** add `otter:'Otter'` to the `Object.assign(TOYNAME,{…})` line.
3. **Price it:** add `['otter',95]` to `SHOP`, in its place by price.
4. That is all the wiring. `ALL_TOYS`, the grey "locked" copy, the My Toys grid, the icon picker and the
   lineup all pick it up from `SHOP`.
5. **Nothing to resize.** On the My Toys card, "Other Toys" (toys not in the lineup) always shows 8 per
   page, owned first, then locked in `SHOP` order, with previous / next arrows and "1 Of 2" once there are
   more than 8 (built in v7.29; Derek's rule: never make the card taller, add pages). Keep `SHOP` sorted by
   price so locked toys read cheapest first. The player icon picker (`drawToyCard`) uses 4 columns up to 20
   toys, 5 up to 30, 6 above that, and grows by rows; with all 39 it is 7 rows. Check it still fits a
   720-unit-tall screen past about 48 toys.
6. Optional real art: put `assets/toys/<name>.png` in place and add the key to `SPRITE_FILE`; a PNG replaces
   the drawn version automatically.

### Replace or remove a shop toy
Players may already own it. Never just delete the key: add `oldkey:'newkey'` to `TOY_SWAP` (next to `SHOP`).
On load, the old key is swapped for the new one in the player's owned toys, lineup and icon, so nobody loses
a toy they paid for. Then rename the painter in `TOYS`, the `TOYNAME` entry and the `SHOP` entry.
Done once so far: `speedboat` became `train` in v7.31 (too similar to the tugboat).

### Add something for Noah to wear (Dress Noah, v7.46)
1. Add a row to `GEAR` (top of the file): `['cape',90,'Cape']` (key, price, name). Keep it in price order. The Dress Noah card
   shows 8 to a page (two rows of 4) with arrows in its top line, so nothing needs resizing (12 pieces at v7.50).
   If the new piece sits where another one does (head, eyes, neck), add it to `GEAR_SLOT` so the two swap.
2. Draw it. On the head: in `kidHead`, behind `wr.includes('key')`. Shapes that stick out past the head (hat,
   goggle frames) go BEFORE `if(!PASS)return` and use `shp()` so they get the white sticker rim; details inside
   the face (lenses, mustache) go after it. Head coordinates: before that line use `x`, `y` and the radius `r`;
   after it the face is scaled so the head is 27 units in radius, eyes at (±10.5, 1.5), mouth from y 10.5.
   In a hand: copy `foamFinger` and call it from `kid()` (both the resting and the cheering arms) and `noahBust`.
   On the body or arms: see `bowTie` and `floatie`, called from the same two places. Give it a picture in `gearIcon`
   if it does not show on a head alone. The snorkel is on the throwing side (`side`), the foam finger on the other.
3. Only Noah passes `wear` to `kidHead`; Max and the badge pictures do not.
4. Saving needs nothing: `gearFix` keeps only keys that are in `GEAR`.
5. Check how pieces look TOGETHER. A red cap plus a black mustache read as Mario (Derek, 2026-11-17) and were
   redrawn in v7.47; keep Noah clear of any well-known character. The foam finger was redrawn in v7.49 for reading as a
   rude gesture: its finger sits at the edge of a fist with knuckles beside it, never alone in the middle.

### Add a power for Max (Multiplayer, v8.3)
1. Add a row to `POW` (top of the file): `['key','Name',seconds]`, and its one-line description to `POWDESC`. The Pack
   Your Bag card shows 4 to a row and has two rows (7 powers at v8.8; a ninth needs a third row or pages).
2. Say what it does in `usePower` (a timer on `duel.mx` for a lasting power, or an instant effect), and count the
   timer down in `duelStep` (the list `['noodle','flip','bucket','bub','juice']`).
3. Draw it: its small picture in `powIcon`, and what it looks like on Max in `maxGear`.
4. Saving needs nothing: `pwFix` gives every player a count for every key in `POW` (new keys start at 1).
   Give it a lesson in Max School: a row in `TUT` with `k` set to its key, and its script in `tutStep`.
5. Measure it: `experiments/sim/pow.js` plays scripted matches with a power packed three times. At v8.8 the seven
   powers each lift Max's win rate by 15 to 22 points; keep a new one in that band (how to run: `experiments/fable-v8.md`, v8.5).

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

### Change How To Play
`HOWTO` table, one entry per page. A page with `rows` is a list of picture + title + sentence (pictures are the
`r[0]==='…'` branches in `drawHowTo`); a page with `steps` shows the looping throw demo (page 3 is Push,
page 4 is Swipe: the demo checks `howTo===4`). Page count and Back / Next follow the table length.
**When a feature is added, check whether How To Play needs a line about it.**

### Add a start-screen button
The row under Swipe is drawn in `drawMenu` (step 0) and spans exactly the width of Push/Swipe (232 units).
It holds four buttons since v7.46 (How To Play, Badges, My Toys, Noah) at text size 11 and is full: a fifth needs a second row.
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
