# Version 8: Multiplayer (version history)

Design: `experiments/v8-design.md`. Work list: `experiments/v8-backlog.md`. Version 7's history: `experiments/fable-v7.md`.
All of version 8 is on the TEST page only (`game-test.js`, play-test.html). The live game is still v7.45.
Dress Noah (v7.46 to v7.50) is also test-only and ships with version 8 (Derek, 2026-11-17).

Decisions by Derek, 2026-11-17: go ahead with design draft 2; hold Dress Noah for v8; Cloudflare relay for two
devices is OK (he sets up the account when asked); the one-line privacy and listing change is OK.

## Revisions
- v8.0 (TEST ONLY): the first playable piece of Multiplayer: **Play As Max against a computer Noah**, on one phone.
  - Start screen: a Multiplayer button under Swipe (orange, "Noah Vs Max"). The gaps between the big buttons went
    from 20 to 14 to make room; the small row moved down. Nothing else on the start screen changed.
  - Multiplayer card: pick a stage (1 to 10; stage N has N+2 toys from your lineup and that round's crater, drift
    and clock), then Play As Max.
  - Max: drag anywhere to steer; he swims toward the finger at a limited speed; blocks happen by themselves; after
    each block he is dunked (under water, cannot block or move). Noah wins if the volcano erupts, Max if the clock
    runs out. Result card: Play Again, Stage, Home.
  - Computer Noah throws like a Push player (winds up in view, lets go when it will score), so he can be read.
    By stage he waits less, misses less, picks the toy furthest from Max more often, and fakes one side then
    throws from the other. He hurries while Max is dunked.
  - A match never touches the main game's stats, badges or coins (those come later in the backlog).
  - Tuning panel on the Multiplayer card, test page only: Max Speed, Max Reach, Dunk Time, Clock. Saved on the phone.
  - Under the hood: `duel` (null in the main game), `startDuel`, `duelStep`, `cpuNoah`, `TUNE`; play-affecting
    randomness now comes from a seeded source (`rnd`), effects still use Math.random.
  - **Balance numbers came from simulated matches, not from people.** A scripted Max that follows the toy Noah is
    winding up, 40 matches a stage. With the first guesses (speed 3, dunk 0.8 s, clock x1) even a slow, forgetful
    Max won 93 to 100% of matches at every stage. With the chosen defaults (speed 1.6, dunk 1.3 s, clock x1.3):
    a sharp Max (0.25 s reaction) wins 100% at stage 1 falling to about 80 to 85% at stages 6 to 9; a slow,
    forgetful Max (0.5 s reaction, ignores one throw in four) wins about 70% at stage 1 falling to 20 to 35% at
    stages 8 to 10; a Max who never moves wins 0%. Real players need to confirm or change these.
  - Checked in a browser at 375x812 and 375x667 with the real buttons and a real drag: the card, a full match to
    both endings, the result card. Main game re-checked: a Push throw and a Swipe throw both score in round 1, and
    the computer Max still sweeps by himself in round 4. Not tried on a real iPhone.
  - Known: when Max is in the middle of the tub he is partly hidden behind Noah.
- v8.1 (TEST ONLY): a deeper pass on what it is like to be Max, made before Derek's first try (he asked whether v8.0 had
  been thought through enough; it had not).
  - **Max's lane moved up the tub** (`DUEL_Y` 246; the main game keeps 292). At 292 Max and Noah stand in the same spot,
    so one always hid the other. Now Max is in front of the volcano and both boys are in view. `crossX` works out where
    a throw passes the lane from the flight maths instead of a fixed fraction.
  - Intro card before a match ("You Are Max!": drag to swim, block until the clock hits 0, stage / toys / seconds, Go!).
  - Hints while playing Max: a small marker on the water where he is swimming to; while dunked, a ring that empties as
    he comes back, then a splash and a rising note; on stages 1 to 3 only, a dashed "stand here" ring where the throw
    being wound up will pass (gold, green when he is close enough) and an arrow pointing the way.
  - A wake when he swims; a buzz on each block (where the phone allows); the last five seconds tick.
  - **A ladder to climb:** the best stage beaten as Max is saved per player (`mxBest`), shown as ten boxes on the
    Multiplayer card (tap one to pick it), and the result card offers Next Stage after a win. The card opens on the
    next stage not yet beaten.
  - Defaults changed after the lane moved (throws pass the higher lane closer together, which helps Max): speed 1.3,
    dunk 1.6 s, clock x1.5. Simulated matches, 40 a stage: a sharp Max wins about 98% at stage 1 falling to 70 to 88%
    at stages 4 to 9; a slow, forgetful Max wins 80% at stage 1 falling to 20 to 43% at stages 5 to 9; a Max who
    never moves wins 0 to 8%. Stage 10 is easier for Max than stage 9 (95% / 40%): the computer Noah struggles with
    the smallest crater. Not yet fixed.
  - Checked in a browser with the real buttons and a real drag: the ladder, the intro card, a match Max wins (best
    stage saved, Next Stage), a match Noah wins (eruption then card), pause and Go Home during a match. Main game
    re-checked as in v8.0. Not tried on a real iPhone.
  - Still unknown until people play: whether a speed of 1.3 feels sluggish, whether the dunk feels like a fair cost
    or like losing control, and whether following the dotted line is fun for more than a few matches without powers.
- v8.2 (TEST ONLY): after Derek's first try of v8.1 on his iPhone. He said: sometimes hard to see Max (not terrible);
  unclear what makes Max block, and whether height matters; unclear why Max "disappears" after a block; asked whether
  Max can jump; asked where the special powers are.
  - **The block rule is now what it looks like:** a rising toy that touches Max, anywhere from his raised hands down
    to his chest, is blocked (`maxHit`). Before, only a circle around his hands counted, so a weak throw could pass
    through his head unblocked. Height never matters to the player.
  - **The dunk is visible:** he sinks to his eyes and stays in view, with dizzy stars, the word "Dunked!", and a ring
    that empties as he recovers. v8.1 hid him completely, which read as Max vanishing. A big splash on every block.
  - The intro card says the rule in four lines (drag to swim; a toy that hits Max is blocked; each block dunks him for a
    moment; hold out until the clock hits 0). Max's name tag is drawn again on top of Noah.
  - The taller block zone helped Max, so reach went from 30 to 25. Simulated, 40 matches a stage: sharp Max 98% at
    stage 1 to 60 to 70% at stages 7 to 9; slow, forgetful Max about 70 to 80% early, 25 to 38% at stages 7 to 9.
  - Max cannot jump, and powers are not built yet (backlog milestone 4). Asked Derek what should come next.
