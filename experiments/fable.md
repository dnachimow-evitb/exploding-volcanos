# Exploding Volcanos — visual pass: fable

- **Model:** Claude Fable 5.2 (`claude-fable-5-2`), running in Claude Code (desktop app)
- **Date:** 2026-11-11
- **Branch / tag:** `model/fable` / `fable-v1` (branched from `original-v1`)
- **Files added:** `game-fable.js`, `play-fable.html`, `experiments/fable.md`
- **Files untouched:** `index.html`, `game.js`, `sw.js`, `style.css` (the play page carries its own inline CSS and registers no service worker)

Open `play-fable.html` to play this version.

## The prompt

> I want to see if a new model improves the visual deficiencies we've faced in the past with my Exploding Volcanos game (C:\Users\nikna\OneDrive\ExplodingVolcanos).
>
> This is a blind comparison between AI models, so please follow this setup exactly:
> - Start from the original: run `git switch -c model/fable original-v1` in that folder.
> - Do not check out, diff, log or open any other branch (model/*, compare) or the experiments/ folder, and don't read any game-*.js or play-*.html files other than your own.
> - Do not edit index.html, game.js or sw.js. Put your work in new files: game-fable.js and play-fable.html (no service worker registration in the play page).
> - When done, write experiments/fable.md with: model, date, this prompt, what you changed, and how you checked it.
> - Commit everything on model/fable, tag it fable-v1, then run `git switch main`. Do not push anything.
>
> Give this your full effort. Quality matters more than speed, so take the time and polish rounds you need to make it look great. I just want to finish in one sitting without hitting my usage limit, so please avoid waste:
> - Work by yourself: no subagents, workflows or extra sessions.
> - Read each file once and keep what you learned; don't re-read files you've already seen.
> - Prefer a few large, well-planned edits over many tiny ones.
> - When checking in the browser, take screenshots at reduced scale (0.5) unless you need detail, don't repeat a screenshot that won't have changed, and jump straight to game states with JavaScript instead of playing through rounds. Read the console for errors before reaching for screenshots.
> - If screenshots look stale or frozen, the preview pane may be hidden: tell me rather than retrying.
> - Keep polishing while each round fixes something visible; stop when it looks right, then give me a summary.
> - If something is blocked, stop and tell me instead of trying lots of workarounds.

## What I changed

Gameplay is the same game: the constants, difficulty table, physics, catch test, timing, scoring, audio and input
handling were carried over from `game.js` unchanged. Everything that is *drawn* was rewritten, using
`assets/cover.png` as the style reference.

**Sharpness**
- The canvas backing store is now sized to real device pixels (CSS size × devicePixelRatio, capped), so it is
  crisp on phones instead of a 380×600 bitmap stretched up.
- The static scene (wall, window, shelf, tub) is painted once into an offscreen canvas per resize and blitted
  each frame.

**Toys**
- All 12 toys plus the hairball are drawn as vector art in one consistent outlined cartoon style and cached to
  small canvases. No emoji anywhere, so the game looks the same on iOS, Android and Windows.
- PNGs dropped into `assets/toys/` still take over automatically, as before.

**Scene**
- Bathroom wall in the cover's blue mosaic tile, with a sunny window, the kids' taped-up NOAH and MAX drawings,
  a shelf of bottles and a striped towel. The decor now sits below the HUD instead of half under it.
- A proper porcelain tub: glossy rim, shaded basin, faucet with a dripping tap, bath mat peeking out below.
- Water has a depth gradient, drifting light glints and soap foam along the waterline and tub edges.
- Things that sit in the water (toys, Noah, Max) are cut at their own waterline with a ghosted underwater
  part and a ripple. The old full-width blue overlay that tinted every toy is gone.

**Volcano**
- Rebuilt as the cover's charcoal volcano. The crater is now a real opening at the summit, exactly where toys
  are caught (the original drew the crater on the front of the cone, 60px below its peak, with the eyes inside it).
- Lava pool in the crater, lava rivulets that creep further down the slopes as toys go in, heat glow rising
  from the base, foam where it meets the bathwater.
- A face with eyes that follow the toy you are aiming or throwing, blinking, a gulp when it swallows a toy,
  and a mouth that opens wider as it fills.
- Eruption: a lava fountain from the crater, smoke, glowing lava blobs, lava-lettered "THIS IS THE END!",
  a comic burst behind "POW! POW!", and toys rain back without the white discs behind them.

**Noah and Max**
- Redrawn to match the cover: bare-shouldered in the bath, messy dark hair for Noah, ginger hair and freckles
  for Max, rosy cheeks, laughing faces. Noah laughs when he splashes and cheers with both arms on an eruption;
  Max has open grabbing hands. Both watch the flying toy. Name labels are outlined text at the waterline.

**HUD and screens**
- HUD redrawn with drawn icons (star, flame, clock, pause, speaker) and a glossy timer bar. The row of dots
  became a row of the actual toys, each lighting up once it is in the volcano.
- Floating score/comment popups moved from DOM elements into the canvas so they are outlined, scale with the
  game and stay on screen. "Look, Daddy, look!" no longer lands on top of the points popup.
- Title screen shows the live scene under a lava-lettered logo instead of a card on bare tile.
- Intro, new-toy, pause, time's-up and win cards share one panel/button style; new-toy has a sunburst and
  confetti, win has stars and confetti.
- Aiming guide: outlined trajectory dots, a rounded charge ring, pulsing "RELEASE!" and a green crater ring
  when on target. Round-1 hint uses a tap pulse instead of an emoji hand.
- Floating toys settle upright with a gentle rock instead of keeping their mid-air rotation after a miss.

**Small non-visual differences worth knowing about**
- Render errors are logged to the console once instead of being silently swallowed.
- A flying toy sheds a few cosmetic water droplets; this does not affect physics.

## How I checked it

Served the folder with the project's `evitb-site` launch config and opened `play-fable.html` in the Claude
desktop browser pane.

- Console: no errors on load or in any state (the 404s for `assets/toys/*.png` are the expected sprite probes,
  same as the original).
- Jumped to states with JavaScript and looked at screenshots of: title screen, intro card, round 1 with the
  aim hint, charging/aiming with the trajectory on target, a toy in flight with popups and banner, round 5 with
  Max and a hairball, round 10 with all 12 toys and a nearly full volcano, the eruption ("THIS IS THE END!" and
  title phases), new-toy card, time's-up card, win card and pause card.
- Rendered all toy sprites large in a temporary gallery to check each drawing.
- Drove a real play-through with synthetic pointer events: START → START SPLASHING → hold a toy until the
  trajectory was on target → release → toy caught (collected 1, score +14, the same value the original gives) →
  round win → eruption → new-toy card (Monster Truck) → round 2 started with 4 toys. No errors.
- Polish rounds made after looking: simplified the kids' eyes, rounded their shoulders, moved the title-screen
  toys out from behind the panel, tightened the result cards, moved the eruption title clear of the banner.

**Not checked:** a real phone/touch device, audio, and long-session performance. Near the end the pane stopped
delivering animation frames (it looked hidden), so the final play-through was verified through game state
rather than a screenshot. The car and frog were only seen at in-game size, not in the large gallery.
