# Version 5 (fable-v5): a from-scratch visual build

- **Model:** Claude Fable 5.2 (`claude-fable-5-2`), in Claude Code (desktop app)
- **Date:** 2026-11-11
- **Branch / tag:** `model/fable-v5`, branched from `original-v1`, tagged `fable-v5-v1`
- **Files added:** `game-fable-v5.js`, `play-fable-v5.html`, `experiments/fable-v5.md`
- **Files untouched:** `index.html`, `game.js`, `sw.js`, `style.css`, and every other version's files

Open `play-fable-v5.html` to play. Self-contained: inline CSS, no service worker, no network requests. It loads `assets/cover.png` and `song.mp3` from the folder.

## The prompt

After three rounds on fable-supreme, the feedback (verbatim):

> yo, the fake tutorital that you tried to implement...it looks like a god damn toilet plunger , not an arrow. thsi is the shit i'm talking about, it just pure amateur hour all over hte place. also, the tub covers the fun part of the window and the max poster ont eh wall....i thoought fale was supposed to be good. also, look how faded this shit looks....give a holistic rework ingoring all previous direction and build something from scratch as version 5; maybe i'm the probelm and i just need to get out of your way

Two screenshots came with it: the "So close!" card in a wide window, with the tub drawn over the window and posters, and washed-out toys on the card.

## What was wrong, and the decision

1. **The style was the problem, not the details.** Every earlier version tried to imitate painted, outlined storybook art using code-drawn shapes. That always lands as "MS Paint". Version 5 uses a style that code does well: flat sticker-book art. Solid colours, no gradients, no outlines; the actors (volcano, Noah, Max, toys) get a white sticker keyline so they pop off the scene.
2. **"Faded" came from transparency.** Dimmed toys, translucent overlays, soft glows. Version 5 uses solid colour for everything that matters. Nothing is ghosted to show state.
3. **The tub covered the window and Max's poster** because in a wide window the old layout squeezed to 600 units tall and the wall art had nowhere to go. The new layout is never shorter than 720 units and places the decor in the space between the HUD and the tub rim, scaled to fit.
4. **The tutorial finger looked like a plunger.** It is gone. The hint is a dashed arrow that sweeps from the toy to the crater, with a real arrowhead, a pulse on the toy and a "Press and hold" bubble.

## What version 5 is

- **Title screen:** your actual cover art, uncropped, above a band of water with toy stickers and one large Play button.
- **Scene:** cobalt tile wall, white tub with one shade tone, bright aqua water with drifting light bands and white foam, navy floor, yellow bath mat. Window with a smiling sun on the left; NOAH and MAX drawings side by side on the right, always clear of the tub.
- **Volcano:** flat charcoal cone with a light and a dark facet, solid orange lava runs that lengthen as it fills, big white eyes that follow the toy, and cream line work for the mouth so the expression reads. Wide awake at rest; grins, puffs up and trembles as it fills; gulps toys; pulls a face at hairballs.
- **Noah and Max:** flat heads with spiky hair, dot eyes, strong brows, big grins. No lashes, blush or shading. Noah leans into the throw, shouts, cheers with both arms; Max holds his hands out wide to block and laughs when he gets one.
- **Toys:** the 12 vector toys and the hairball, each with a white sticker edge and a flat shadow on the water. A dashed white ring marks what can be grabbed.
- **HUD:** white chips with navy text. The toy tracker shows empty slots that fill with the real toy.
- **Cards:** white card, solid orange header, navy text, solid green button. "So close!" shows every toy in full colour with a green tick on the ones you got. Behind the card is a solid navy scrim, not a grey wash.
- **Aiming:** white dotted arc that turns green on target, with a green "Let go!" bubble and a chime.
- **Type and casing:** system rounded face on iPhone, Segoe UI on Windows; sentence case everywhere, capitals only for the EXPLODING VOLCANOS wordmark and "POW!".

## What carries over

Rules, scoring, the difficulty table, round structure and the song are unchanged from the original.

The game logic and motion helpers are reused from fable-supreme (extracted by script, not retyped), so these feel tweaks still apply:

1. Release forgiveness: a release within ±0.04 charge (about 70ms) of an on-target throw counts.
2. Eruption delay 700ms instead of 380ms, with the timer frozen for the extra time so bonuses are identical.
3. Fixed 60Hz simulation.
4. Hit-stop: 3 frames on a catch, 7 at the eruption.
5. Buttons fire on lift.
6. Reduced shake and flash; no continuous screen shake when the volcano is nearly full.
7. Three synth sounds: button click, on-target chime, build-up rumble.
8. Kinder copy: "Max got it!", "Splash! Try again!", "So close!".
9. No "toys rain back" banner; the speaker's first tap starts the music.

Every draw call is new.

## How I checked it

Browser pane, no console errors in any state.

- **375×812:** title screen; round 1 with the arrow tutorial; round 5 aiming on target with Max, a hairball, a combo and a low timer; "So close!" card; new-toy card; eruption at the "POW!" beat; win card.
- **Wide desktop window:** play screen, confirming the window and both posters sit above the tub.
- **Real taps (desktop size):** Play → Let's splash! → hold until on target → release → caught (+14, same as the original) → rest of the toys in → eruption → new-toy card (Monster truck) → Splash on! → round 2 with 4 toys.
- Fixes made after looking: the cover was being cropped (now shown whole); Max's raised hands sat behind his head and read as ears (moved out wide).

**Not checked:** a real iPhone (notch and home-bar insets read as 0 in the browser), audio, 430×932, frame rate on an older phone, and rounds 3 to 10 played by hand. I did not screenshot the block, miss or hairball-catch reactions.

---

## v2 revision (same day, tag `fable-v5-v2`)

**Feedback on v1:** a round-3 screenshot captioned "what", then "what's up with the yellow line at the bottom".

**What I fixed**

- **Toys piling up.** The hairball was sitting on the duck and boat, and toys drifted through each other. Each toy now has a home spot (two tidy clusters, left and right of Noah, three rows each) and sways gently around it; the hairball floats on its own in the middle. Toys are drawn slightly smaller when there are more than five, and sorted so nearer ones are in front. The dashed grab rings only show while there are four toys or fewer, so they no longer stack up.
- **Grey disc behind the volcano.** It was a translucent glow. Removed.
- **White blob at Noah's side.** His resting arm was being cut off at the waterline. It now stays under the water.
- **Yellow line at the bottom.** It was a bath mat with only a sliver showing. Removed.

**Gameplay-feel change to judge:** toys no longer drift freely across the tub; they sway around a home spot (the sway is wider in later rounds). Throws still auto-aim from wherever the toy is, and the in-flight drift that makes later rounds harder is unchanged, so difficulty should be the same, but it is a change from the original behaviour. A missed toy lands where it falls and then glides back to its spot.

**How I checked v2:** 375×812, no console errors: round 7 after the first pass (disc, mat and arm fixed, toys still bunched on one side, which led to the home-spot change), then round 10 with all 12 toys and a hairball in two readable clusters. The final row spacing was widened slightly after that last screenshot and not re-shot.

---

## v3 revision (same day, tag `fable-v5-v3`)

**Feedback on v2:** restore the toy behaviour so they float, not just sway; add more colour to the top of the screen (a lot of blue); improve the window, which looked like MS Paint again.

**What I changed**

- **Toys float again.** The v2 home spots are removed and the original free drift is back, including the faster drift in later rounds. One addition: when two floating toys bump, they swap direction and ease apart instead of sliding through each other. In crowded rounds toys still overlap at times, because the original keeps them out of the middle of the tub.
- **Colour at the top.** On phone-height screens the wall has a border row of yellow, coral, mint and pink tiles under the score bar, and a white shelf with two bottles and a rubber duck above the posters. In short, wide windows there isn't room for those, so the colour there comes from the curtains and posters.
- **Window redrawn.** Coral curtains with tie-backs on a gold rod, a bevelled white frame with a shadow on the wall, a layered view (two-tone sky, glass glints, sun with a halo, a proper cloud, two hills and a tree), and a potted plant on the sill. The sun's face is gone.

**Feel tweak to judge:** the toy-bump behaviour above. Everything else about floating is the original.

**How I checked v3:** 375×812 round 6 after 5 seconds (toys had drifted 54 to 134 units, confirming free float), a close crop of the top of the screen, and a wide desktop window. No console errors. I removed some stray coloured tiles after the last screenshots and did not re-shoot.
