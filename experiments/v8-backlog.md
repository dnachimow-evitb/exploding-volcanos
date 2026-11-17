# Version 8 backlog: Multiplayer mode

The design is `experiments/v8-design.md` (draft 2, **go-ahead given by Derek 2026-11-17**). What has been built
is in `experiments/fable-v8.md`. Work top to bottom. Tick an item when it is on the test page and noted in the version history.
Size: S = under an hour of building, M = a session, L = several sessions. "Derek" marks items only he can do.

The goal of the whole version (Derek, 2026-11-17): make the game stickier. Judge every item by that.

## Milestone 0: Before starting
- [x] **V8-01** (Derek) Go-ahead on design draft 2: given 2026-11-17. Cloudflare relay OK; small-print change OK.
- [x] **V8-02** (Derek) Dress Noah: **hold it for version 8** (2026-11-17). It is not published separately.
- [ ] **V8-04** S. Decide the live file name (`game-fable-v8.js` alongside v7, as was done for v5 to v7) and
      note what `native/` must change to package it.

## Milestone 1: Framework (nothing a player can see)
- [x] **V8-10** M. (v8.0) Mode switch: main game and Multiplayer rule sets over the same tub, toys, physics and art.
- [ ] **V8-11** M. Controllers: Noah and Max each driven by a finger, the computer or the other device.
      (v8.0 has finger and computer for the two cases built so far; the other device comes with milestone 3.)
- [x] **V8-12** S. (v8.0) Repeatable randomness for everything that affects play.
- [x] **V8-13** S. (v8.0) Main game re-checked: Push and Swipe throws score in round 1; computer Max sweeps in round 4.
      Repeat this check after every framework change.

## Milestone 2: Be Max, against the computer (first fun test, one phone)
- [x] **V8-20** M. (v8.0) Max steered by dragging; limited swim speed. Depends V8-11.
- [x] **V8-21** S. (v8.0) Automatic block, then the dunk (under water about 1 second, bubbles, cannot block).
- [x] **V8-22** M. (v8.0) Computer Noah: picks a toy, winds up visibly, fakes sides; skill by stage.
- [x] **V8-23** S. (v8.0) Win and lose: eruption = Noah wins, clock out = Max wins. Plain result card with Rematch.
- [x] **V8-24** S. (v8.0) Stage picker 1 to 10 from the existing difficulty table; clock x1.3 after simulated matches.
- [x] **V8-25** M. (v8.0) Tuning panel, test page only: Max speed, reach, dunk time, clock.
- [x] **V8-26** S. (v8.0) A plain Multiplayer button on the test start screen to reach all this.
- [ ] **V8-27** (Derek) Play Max on the iPhone test app. Report what felt unfair or dull. **<- waiting on this**
- [ ] **V8-28** S. Max is partly hidden behind Noah in the middle of the tub; decide how to keep him in view.

## Milestone 3: Two devices
- [ ] **V8-30** (Derek) Free Cloudflare account; two keys added to GitHub secrets. Claude gives the steps.
- [ ] **V8-31** M. The relay: passes messages between two devices in a room, stores nothing. Deployed by a
      GitHub workflow. Depends V8-30. Check the free-plan limits again at build time.
- [ ] **V8-32** M. Start A Game (four-letter code) and Join A Game (type it on the game's letter keys).
- [ ] **V8-33** L. Match over the connection: Noah's device runs it; Max's device sends steering and draws
      Max at once; snapshots keep both screens the same. Depends V8-11, V8-12.
- [ ] **V8-34** S. Setup card: stage, who is Noah, handicap (Max Slow / Normal / Fast).
- [ ] **V8-35** S. A dropped player: "Waiting For Max", then the computer takes over after 10 seconds.
- [ ] **V8-36** S. Smarter computer Max (follows throws with a reaction delay), used for take-over and solo.
- [ ] **V8-37** (Derek) Play it on two phones with two people. **Stop here and adjust the design if the core
      is not fun.**

## Milestone 4: Powers and charges
- [ ] **V8-40** M. Charges owned per player; the bag (pack up to 3); spend on use; unused come home.
- [ ] **V8-41** M. Max: Big Splash (one free per match), Pool Noodle, Flippers.
- [ ] **V8-42** M. Max: Bucket, Squirt Blaster, Bubble Bath.
- [ ] **V8-43** M. Noah: Decoy Duck, Rocket Throw, Double Throw.
- [ ] **V8-44** S. Earning: one charge per finished match, a second for winning; buy with coins.
- [ ] **V8-45** S. Power bubble in the main game from round 4.
- [ ] **V8-46** S. Draw each power in the boy's hands in the game.

## Milestone 5: The loop that never ends
- [ ] **V8-50** S. Keep going after round 10 in the main game; best-round record.
- [ ] **V8-51** M. Prize bubble from the volcano after any win (coins, a charge, rarely a golden toy).
- [ ] **V8-52** M. Golden toys: gold version of each toy, a collection page, "7 Of 39".
- [ ] **V8-53** M. Two ranks per player (Noah, Max): stars per match, no top, a prize at each rank.
- [ ] **V8-54** M. The Daily Bath: one seeded round a day with a twist; stamp card; seven stamps pay a prize.
      Missing a day takes nothing away.
- [ ] **V8-55** S. Rivals: running score against each person played, shown on the result card.

## Milestone 6: The rest of the game around it
- [ ] **V8-60** M. Multiplayer home screen; final place for the Multiplayer button on the start screen.
- [ ] **V8-61** S. Coins for matches (5 winner, 2 loser, none under 20 seconds).
- [ ] **V8-62** M. New badges and stats (blocks as Max, wins on each side, Daily Bath days, golden toys).
- [ ] **V8-63** S. Dress Up: the "Noah" button covers both boys; Max wears the 12 existing pieces.
- [ ] **V8-64** S. How To Play pages for Multiplayer, Max's controls, powers and the Daily Bath.

## Milestone 7: Polish and release
- [ ] **V8-70** M. Winner lettering, sounds, moods for both boys, haptics where the phone allows.
- [ ] **V8-71** S. Privacy policy and support page: the line about online play (wording by the writing model).
- [ ] **V8-72** (Derek) Full check on the iPhone test app; then on TestFlight, two devices.
- [ ] **V8-73** S. Publish live when Derek says so (revert tag first).
- [ ] **V8-74** M. App Store 2.0: new build, screenshots, listing text, review notes; recheck Apple's
      definition of "collect" before answering App Privacy.
- [ ] **V8-75** S. Website: the game chapter mentions the new mode (wording by the writing model, Derek's facts only).
- [ ] **V8-76** S. Update DEVELOPER-GUIDE.md: file map, modes, controllers, the relay, recipes for a new power.

## Later (each needs its own decision)
- [ ] **V8-90** M. Two people on one screen.
- [ ] **V8-91** L. iPad layout (the app is iPhone-only today).
- [ ] **V8-92** L. Apple's nearby link as an offline way to connect (app only).
- [ ] **V8-93** M. Weekly quests.
- [ ] **V8-94** M. Tub and volcano themes to unlock.
- [ ] **V8-95** M. Tournaments for up to 4 players.
- [ ] **V8-96** S. A second player steers Max during the main game.
- [ ] **V8-97** M. Hard Max: blocks are not automatic, tap to jump.

## Ideas inbox
New ideas from Derek go here first, dated, before they are sorted into a milestone.
