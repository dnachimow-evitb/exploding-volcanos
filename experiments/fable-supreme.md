# fable-supreme: the Opus 5.5 repaint, taken up a notch

- **Model:** Claude Fable 5.2 (`claude-fable-5-2`), in Claude Code (desktop app)
- **Date:** 2026-11-11
- **Branch / tag:** `model/fable-supreme`, branched from `model/opus-5-5`, tagged `fable-supreme-v1`
- **Files added:** `game-fable-supreme.js`, `play-fable-supreme.html`, `experiments/fable-supreme.md`
- **Files untouched:** `index.html`, `game.js`, `sw.js`, `style.css`, `game-opus55.js`, `play-opus55.html`
- **Not blind:** I read `game-opus55.js`, `play-opus55.html` and `experiments/opus-5-5.md`, and reused toy art from my own earlier `game-fable.js`.

Open `play-fable-supreme.html` to play. The page is self-contained (inline CSS, no service worker, no network requests).

## The prompt

> I'm running a design experiment on my iPhone game "Exploding Volcanos in the Bathtub" (C:\Users\nikna\OneDrive\ExplodingVolcanos). Three versions exist so far:
> - Original: the first version (git tag original-v1)
> - Opus 5.5: a repaint by another model (branch model/opus-5-5, files game-opus55.js + play-opus55.html)
> - Fable: your own earlier repaint (branch model/fable, files game-fable.js + play-fable.html)
>
> After comparing them side by side, I prefer the Opus 5.5 version's look and feel. I want you to take that Opus version as the foundation and bring it up a serious notch into a 4th version called "fable-supreme". This one is NOT blind: read the Opus files and its run notes (experiments/opus-5-5.md on that branch) and build directly on them. Where your own earlier version did something clearly better (for example, you drew all 12 toys as vector art instead of emoji), bring that idea over too, restyled to fit the Opus look.
>
> THE STANDARD
> Approach this as a senior team at a top mobile game studio (art director, game-feel designer, UX designer for young kids) shipping a polished App Store title, not a hobby project. Every detail matters. The players are my young kids, Noah and Max (the characters in the game), with parents watching. Think about:
> - Color psychology: warm, saturated colors for reward and excitement (lava, eruption, score); calm cool blues for the water and the resting state; high contrast on what matters (the crater target, the toy in your hand); no alarming reds for anything that isn't urgent; one consistent palette across scene, HUD and cards.
> - Game feel ("juice"): anticipation before actions, squash and stretch, proper easing (nothing linear), brief impact pauses on big hits, screen shake used sparingly, particles that support the action instead of cluttering it, satisfying build-up to the eruption and a real payoff when it happens.
> - Character and mannerisms: Noah, Max and the volcano should feel alive: idle animations, blinking, glances at the flying toy, clear reactions to hits, misses, combos and eruptions. The volcano is a character too, so give it personality as it fills.
> - Kid-first UX: big forgiving touch targets (at least 44pt), clear affordances for what can be grabbed, instructions that work without reading, positive reinforcement and no harsh failure moments, a celebration a 4-year-old would feel.
> - Readability and hierarchy: the eye should always know where to look; the HUD informs without competing with the play area; consistent outline weights, shading and type.
> - Polish everywhere: screen transitions, button press states, card entrances, the title screen as a strong first impression, and the new-toy and win moments as rewards.
> - iPhone reality: fill the screen, respect the notch and home indicator, stay sharp on Retina, keep a smooth 60fps on older iPhones, and look right at both 375×812 and 430×932.
>
> GUARDRAILS
> - Keep the game's rules, scoring, difficulty table, round structure and the song unchanged. Small game-feel tweaks (input forgiveness, timing of effects) are fine, but list every one in your notes so I can judge them.
> - Keep the existing fixes in the Opus version: no "toys rain back into the tub" banner after a win, and the speaker's first tap starts the music.
> - Noah's skin tone stays matched to the cover art (assets/cover.png).
> - Self-contained: no external libraries, fonts or network requests.
>
> PROCESS
> 1. Play the Opus version first and write a short professional design review: what works, what holds it back, and a prioritized list of what you'll change and why.
> 2. Define the visual and motion system before coding: palette, outline weights, type, easing curves, timing.
> 3. Implement, then review it in the browser like a design lead would, and polish while each round fixes something visible.
>
> SETUP (follow exactly)
> - In that folder, run: git switch -c model/fable-supreme model/opus-5-5
> - Do not edit index.html, game.js, sw.js or other versions' files. Your work goes in new files: game-fable-supreme.js and play-fable-supreme.html (no service worker registration in the play page).
> - Write experiments/fable-supreme.md with: model, date, this prompt, your design review, the design system you defined, what you changed and why, every gameplay-feel tweak, and how you checked it.
> - Commit on model/fable-supreme, tag it fable-supreme-v1, then run: git switch main. Do not push anything.
>
> EFFORT
> Give this your full effort; quality matters more than speed. I want to finish in one sitting without hitting my usage limit, so avoid waste:
> - Work by yourself: no subagents, workflows or extra sessions.
> - Read each file once and keep what you learned.
> - Prefer a few large, well-planned edits over many tiny ones.
> - In the browser, take screenshots at reduced scale (0.5) unless you need detail, don't repeat a screenshot that won't have changed, and jump straight to game states with JavaScript instead of playing through rounds. Check the console for errors before reaching for screenshots.
> - If screenshots look stale or frozen, the preview pane may be hidden: tell me instead of retrying.
> - When it looks right, stop and give me a summary.

## 1. Design review of the Opus 5.5 version

Played at 375×812 (title screen, and round 4 mid-aim with Max blocking).

**What works, and is kept**
- One coherent storybook look: warm brown outline, cream UI chips, saturated blue tile, a cream porcelain tub with apron and feet.
- A good volcano silhouette: squat, wide base, crater on top where the toy actually lands.
- Full-bleed on the phone, crisp on Retina, HUD under the notch.
- Noah and Max share one construction, so they read as brothers.
- The earlier fixes: no "toys rain back" banner, and the speaker's first tap starts the song.

**What holds it back**
1. *Toys and icons are emoji.* They are the things the player touches, and they are the only art that isn't in the game's style. They look different on every device and are small (about 32px).
2. *Nothing has weight.* Motion is linear or a plain sine. No anticipation, no squash, no impact pause; cards and screens cut in instantly; buttons have no press state.
3. *The characters are props.* No blinking, no reactions to a hit, a miss or a block. The volcano has three mouth shapes and otherwise doesn't change.
4. *It expects reading.* A three-line "How to Play" card, a text hint, "RELEASE!" (which clips off the left edge when the toy is near the wall), fraction plates.
5. *Touch targets are small.* Pause and sound are 32px circles; the brief asks for 44pt.
6. *Tone slips toward alarm.* Red timer, red "BLOCKED!", a white full-screen flash on every throw, continuous screen shake once the volcano is 70% full, "Time's Up!" as a failure card.
7. *The eruption has no build-up.* It simply starts 380ms after the last toy.
8. *Technical:* floating score text is DOM-positioned at a fixed CSS size (doesn't scale with the canvas); per-toy shadow blur and per-toy radial gradients every frame; physics advances once per rendered frame, so game speed follows frame rate; the home-indicator inset isn't read; window foliage paints outside the window frame.

**Priorities**
1. Replace every emoji with drawn art in the Opus style (biggest visible inconsistency, and it's what kids touch).
2. Give Noah, Max and the volcano life and reactions (most charm per line of code; it's their game).
3. Add a motion system: easing, squash and stretch, hit-stop, eased cards, pressable buttons.
4. Make it playable without reading: a ghost-finger demo, a sound cue for "let go now", a title screen that is just a PLAY button.
5. Calm the palette and the feedback: no reds outside lava and buttons, less flash and shake, a kind "So close!" instead of "Time's Up!".
6. Build up to the eruption and make the payoff bigger.
7. iPhone details: 44pt+ targets, home-indicator inset, pixel budget, frame-rate independence.

## 2. Design system

**Palette** (one set across scene, HUD and cards)

| Role | Colors | Used for |
|---|---|---|
| Calm / resting | `#17609c` wall, `#94ddff → #52b8f3 → #2a84d6` water, `#5fd0ff` | Scene, "in the BATHTUB!", pause title |
| Reward / excitement | `#ffe45c`, `#ffd23f`, `#ff8a10`, `#ff6a10`, `#e2360a` | Lava, score star, combo, card titles, the primary button, eruption |
| Neutral UI | cream `#fff6e0` / `#ffeccd`, ink `#3b1f0e`, text `#5a3a24`, quiet text `#9a7a5a` | Chips, cards, outlines, body copy |
| "Go" | `#3ad17a` | Only for "on target, let go" and a healthy timer |
| Caution | amber `#ff9a1a` / `#ffb020` | Low timer, "Max got it!". No red is used as a warning anywhere |
| Skin | `#f6c08f` / `#e09a68` / `#ffdcb8` | Unchanged from Opus (matched to the cover) |

**Outline weights** (ink `#3b1f0e`): 3.5 for the tub and volcano silhouettes, 3 for the kids, 2.5 for chips, cards, buttons and toys, 1.5 to 2 for small details. Text over the scene always carries an ink stroke.

**Type**: the system rounded stack already used by Opus (`ui-rounded`, SF Pro Rounded, Arial Rounded), weight 900. Logo 41/45, card titles 24 to 28, buttons 17 to 25, body 13.5 (weight 700), labels 11 to 12.5.

**Easing** (nothing in the UI is linear)
- `out` (cubic ease-out): rises, fades, slides
- `back` (overshoot 1.70): entrances of cards, buttons, banners, toys, logo letters
- `elastic`: reward objects (new toy, trophy)
- `in` (cubic): camera punch decay
- Damped springs: volcano squash, kids' hops

**Timing**

| Moment | Duration |
|---|---|
| Button press | visual on touch-down, action 90ms after lift |
| Card entrance | dim 250ms, panel 380ms `back` + 34px slide |
| Toy pop-in at round start | 380ms `back`, 60ms stagger |
| Floating text | 160ms pop, 1.05s total, rises 44px |
| Hit-stop | 3 frames on a catch, 7 frames at the eruption |
| Eruption build-up | 700ms |
| Blink | 130ms every 2 to 5s, per character |
| Screen shake | 3 on a throw or block, 4 on a catch, 12 at the eruption |

## 3. What I changed and why

Kept from Opus without redesign: the wall, window, kids' drawings, shelf, floor, tub, water, cone shape and lava streams, the kids' proportions, hair and skin, chip and card styling.

**Art**
- All 12 toys and the hairball are vector art (brought over from my earlier version), re-inked in the Opus brown and drawn about 30% larger than the emoji were. Cached once to small canvases. PNGs in `assets/toys/` still override.
- Every emoji icon is now drawn: star, flame, clock, play, trophy, pointing finger. No emoji is drawn anywhere.
- Window foliage no longer spills outside the window frame.

**Characters**
- *Volcano*: sleepy half-lidded eyes when empty, bright and smiling as it fills, toothy grin when hot, then puffed cheeks, a wobbly clenched mouth, worried brows, a sweat drop and trembling when nearly full. It gulps (squash, cheeks, tongue) when it swallows a toy, pulls a "yuck" face for a hairball, goes "oh" on a miss, shuts its eyes and roars on the eruption, then sags into a relieved, tongue-out smile. It blinks and its eyes track the toy.
- *Noah*: breathes, blinks, watches the flying toy, leans back while winding up and forward on the throw, shouts on release, throws both arms up and hops on a catch, goes wide-eyed on a miss or a block, bounces with both arms up through the eruption, waves on the title screen.
- *Max*: breathes, blinks, watches the toy, laughs and wiggles his hands with a hop when he blocks ("Max got it!"), goes wide-eyed when Noah scores, cheers the eruption. He also appears on the title screen.

**Game feel**
- Held toy squashes and trembles as you charge; other toys dim so the one in your hand stands out.
- Catch: 3-frame pause, volcano squash, gold star sparkles (more on a combo of 3+), score chip pops and counts up.
- Eruption: the screen vignettes and the volcano swells and shakes for 700ms, then a 7-frame pause, camera punch, lava fountain, smoke, confetti, a surge in the bathwater, droplets raining from above, and the song's punchline lettered in lava with two comic "POW!" bursts.
- Toys pop into the tub at the start of a round; idle toys take turns hopping after 3.5s to say "pick me".
- Cards scale in with overshoot over a fading dim; buttons depress on touch and fire on lift; the title logo drops in letter by letter.

**Kid-first UX**
- Title screen is the live scene, the logo and one large PLAY button (216×64). The "How to Play" text card is gone.
- Round 1 shows a looping ghost-finger demo on a toy (press, ring fills, dotted arc turns green, lift, toy flies in) until the first real throw.
- "RELEASE! ✋" became a pulsing green "LET GO!" that can't clip off-screen, plus a short chime the moment the aim is on target, so it works by ear.
- The crater target ring is brighter and gets louder while you aim.
- Pause and sound buttons are 38px with 46 to 50px hit areas (were 32px). Card buttons are 54 to 64px tall with padded hit areas.
- The HUD's row of dots is now the actual toys, each lighting up when it's in the volcano. That replaced the fraction plate on the volcano's chest, which freed its face.
- Kinder copy: "Splash! Try again!" (was "missed"), "Max got it!" in amber (was red "BLOCKED!"), "So close!" with TRY AGAIN (was "Time's Up!"), "YOU DID IT!" with a trophy. The win card now waits until the eruption has played.
- Low timer pulses amber instead of red.

**iPhone**
- Reads the home-indicator inset and keeps the PLAY button above it.
- Backing store is capped at about 2.7 megapixels (still 2.5× on a 430×932 phone) and steps down automatically if frames run slow.
- Simulation runs on a fixed 60Hz step, so speed is the same at 30, 60 or 120fps.
- No per-frame shadow blur; floating text is drawn in the canvas so it scales with the game.
- Inline CSS in the play page (no shared stylesheet), overscroll and callouts disabled.

## 4. Every gameplay-feel tweak (for you to judge)

Rules, scoring formulas, the difficulty table, round structure, toy order and the song are unchanged. These are the things that do differ from the Opus build:

1. **Release forgiveness.** If your release misses but a charge within ±0.04 (about 70ms of hold) would have hit, the throw uses that charge. Applies in every round. This makes hitting slightly easier.
2. **Eruption delay 380ms → 700ms** after the last toy, for the build-up. The round timer runs for the first 380ms exactly as before and is frozen for the extra 320ms, so time bonuses are identical.
3. **Fixed 60Hz simulation.** Previously physics ran once per drawn frame. On a 60fps phone nothing changes; on a slower or faster display the game now runs at the intended speed.
4. **Hit-stop.** The simulation pauses 3 frames (50ms) on each catch and 7 frames (about 115ms) at the eruption. The round timer pauses with it, which gives back about 50ms per catch.
5. **Buttons fire on lift**, 90ms after you let go, not on touch-down.
6. **Less shake and flash.** Throw shake 6→3 and flash .30→.12; catch 7→4 and .30→.14 (cream, not white); block 5→3; eruption 18→12. The continuous screen shake above 70% full is removed; the volcano itself trembles instead.
7. **Three small new sounds** using the existing synth: a button click, a chime when the aim becomes on-target, a rising rumble during the build-up. The song and existing effects are untouched.
8. **Touch areas.** Sound button hit radius 20→25, pause 18→23; both moved slightly to fit the larger buttons.
9. **Copy changes** listed above ("Max got it!", "Splash! Try again!", "LET GO!", "So close!", "YOU DID IT!").
10. **Cosmetic only:** water droplets now keep falling during the eruption (they used to freeze in mid-air), flying toys shed a few droplets, `startGame` clears the previous game's leftover toys behind the intro card.

## 5. How I checked it

Served the folder locally and used the Claude desktop browser pane.

- **Console:** no errors on load or in any state.
- **375×812:** title screen; round 1 with the ghost-finger demo; round 5 mid-aim on target with Max, a hairball, a combo and a low timer; new-toy card; eruption at the "POW! POW!" beat; "So close!" card; win state.
- **430×932:** a real pointer-driven run: PLAY → LET'S SPLASH! → hold a toy until on target → release → caught (score +14, the same as the original) → remaining toys in → build-up → eruption → new-toy card (Monster Truck) → SPLASH ON! → round 2 with 4 toys. Then the win card.
- **Wide desktop window:** letterboxed layout still correct.
- Polish made after looking: clipped the window foliage, raised the contrast of the volcano's mouth, made un-collected toys in the HUD tracker visible, tightened the "So close!" card.

**Not checked**
- A real iPhone, real touch, real notch and home-indicator insets (the browser reports both as 0), audio, and actual frame rate on an older phone.
- The block, miss, hairball-catch and combo reactions are wired to the same events as the catch reaction I watched, but I did not screenshot each one.
- Rounds 3 to 10 were not played through by hand; the round logic is the Opus code unchanged.

---

## v2 revision (same day, tag `fable-supreme-v2`)

**Feedback on v1:** "still feels supremely amateurish": bland colors on the pop-up screens, every character looks like it was made in MS Paint, the font is annoying and the casing is inconsistent.

**What I changed**

- **Characters repainted.** v1 kept the flat fills, single brown outline and tube arms, which is what read as MS Paint.
  - Noah and Max: a shaped head (cheeks and chin, not a circle), radial skin shading, hair shadow on the forehead, chin shadow on the chest, coloured sienna line work instead of one brown outline, shoulders with collarbones, tapered arms with a form shadow and wet highlight, hands with fingers and a thumb that point along the arm, flowing hair locks with a gradient and shine band.
  - Faces: eyes with coloured irises (brown for Noah, green for Max), lid shadow, two highlights, heavy upper lash line and shaped brows; a mouth with curved teeth and a shaded tongue; soft blush.
  - Volcano: charcoal rock (as on the cover) with a scale texture, warm rim light on the left, cool bounce light from the water, wider lava glow, glossier eyes, and the face drawn 15% larger.
  - Toys: form shading (light upper left, cool shadow below) and a white glossy rim so they read against the water.
- **Pop-ups in full colour.** The cream cards are replaced by a water-blue panel with drifting bubbles, a lava-gradient frame, an orange title ribbon, a cream "well" that holds the toys or trophy, and a green go-button. The "So close!" card now shows which toys you got ("You splashed 5 of 8 toys!").
- **Type.** On Windows v1 fell through to Trebuchet MS with synthetic bolding. The stack is now `ui-rounded` / SF Pro Rounded (iPhone), then Segoe UI Black, then Helvetica Neue. No fake-bolded face is used.
- **Casing: one rule.** Sentence case everywhere (buttons, titles, HUD, labels, floating text, name tags). Capitals are reserved for the EXPLODING VOLCANOS wordmark and "POW!". Examples: "Play", "Let's splash!", "New toy!", "You did it!", "Round 5/10", "Hold…", "Let go!", "It's getting hotter!", "Monster truck".

**Palette addition:** the primary button moved from lava orange to green (`#8cec4e → #27b637`), so green now means "go" in both places it appears (the button and "Let go!"), and orange is left for lava, titles and rewards.

**No gameplay or feel changes in v2.** The tweak list in section 4 is unchanged.

**How I checked v2:** 375×812 in the browser pane, no console errors: round 5 in play with Max (plus a close crop of the characters), new-toy card, "So close!" card, win card, title screen. I confirmed by measuring text that the font stack resolves to Segoe UI on this machine.

**Still true:** this is code-drawn art. It is cleaner and has form now, but it will not match the painted cover. The next real step up in character quality is illustrated sprites; the toy loader already accepts PNGs.
