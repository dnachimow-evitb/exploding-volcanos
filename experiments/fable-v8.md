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
