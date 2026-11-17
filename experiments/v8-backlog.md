# Version 8 backlog: Multiplayer mode

The design is `experiments/v8-design.md`. **Nothing is built yet; the design is waiting for Derek's review.**
Work top to bottom. Tick an item when it is on the test page and noted in the version history.
Size: S = under an hour of building, M = a session, L = several sessions. "Derek" marks items only he can do.

## Milestone 0: Before starting
- [ ] **V8-01** (Derek) Answer the decisions in section 13 of the design (number 5, the name, is decided: Multiplayer).
- [ ] **V8-02** (Derek) Try Dress Noah (v7.50) on the iPhone test app; say whether to publish it as the last v7.
- [ ] **V8-03** S. If yes: publish v7.50 live (copy the test file, bump the cache name, history line).
- [ ] **V8-04** S. Decide the live file name (`game-fable-v8.js`
      alongside v7, as was done for v5 to v7) and note what `native/` must change to package it.

## Milestone 1: Framework (nothing a player can see)
- [ ] **V8-10** M. Mode switch: main game and Multiplayer rule sets over the same tub, toys, physics and art.
- [ ] **V8-11** M. Controllers: Noah and Max each driven by finger, computer or (later) remote. Depends V8-10.
- [ ] **V8-12** M. Two fingers at once: follow each finger separately, assign by where it started.
- [ ] **V8-13** S. Repeatable randomness for everything that affects play.
- [ ] **V8-14** S. Check the main game plays exactly as v7.50 (scripted run of rounds 1, 4 and 10, Push and Swipe).

## Milestone 2: First playable duel, one device (the fun test)
- [ ] **V8-20** M. Max steered by a finger in a strip across the top; limited swim speed. Depends V8-11, V8-12.
- [ ] **V8-21** S. Automatic block, then the dunk (under water about 1 second, bubbles, cannot block).
- [ ] **V8-22** S. Win and lose: eruption = Noah wins, clock out = Max wins. Plain result card with Rematch.
- [ ] **V8-23** S. Stage picker 1 to 10 from the existing difficulty table, clock at 1.5 times.
- [ ] **V8-24** M. Tuning panel, test page only: Max speed, reach, dunk time, clock, toys in the air at once.
- [ ] **V8-25** (Derek) Play it with two people. Report what felt unfair or dull. **Stop here and adjust the
      design if the core is not fun.**

## Milestone 3: Computer players
- [ ] **V8-30** M. Computer Noah (for Be Max): picks a toy, winds up visibly, fakes sides; skill by stage.
- [ ] **V8-31** S. Smarter computer Max for a staged round: follows throws with a reaction delay.
- [ ] **V8-32** S. Setup card: who is Noah, who is Max (saved player or Computer), Push or Swipe, handicap.

## Milestone 4: Max's gear
- [ ] **V8-40** M. Power button and charge meter; Big Splash (free). Depends V8-21.
- [ ] **V8-41** S. Pool Noodle and Flippers (always on).
- [ ] **V8-42** M. Bucket, Squirt Blaster, Bubble Bath.
- [ ] **V8-43** M. Shop and pick-a-power on the dress-up card; saved per player (three places, see the guide).
- [ ] **V8-44** S. Dress Max: the 12 existing pieces on Max; outfit saved per player; shown in the main game too.
- [ ] **V8-45** S. Draw each power in Max's hands in the game (the noodle, the bucket and so on).

## Milestone 5: The rest of the game around it
- [ ] **V8-50** M. Start screen: add a Multiplayer button; Push, Swipe, Easy and Hard stay as they are. Placement to be tried on a real phone.
- [ ] **V8-51** S. Coins for duels, with the anti-farming rule Derek chooses.
- [ ] **V8-52** M. Duel stats per player and new badges (for example blocks as Max, duel wins on each side).
- [ ] **V8-53** S. How To Play pages for Multiplayer and for Max's controls.
- [ ] **V8-54** S. Swap Sides on the result card; labels flip for a Max sitting across the phone.

## Milestone 6: Polish and release
- [ ] **V8-60** M. Winner lettering, sounds, moods for both boys, haptics where the phone allows.
- [ ] **V8-61** (Derek) Full check on the iPhone test app; then on TestFlight.
- [ ] **V8-62** S. Publish live when Derek says so (revert tag first).
- [ ] **V8-63** M. App Store 2.0: new build, five new screenshots, listing text, review notes.
- [ ] **V8-64** S. Website: the game chapter mentions the new mode (wording by the writing model, Derek's facts only).
- [ ] **V8-65** S. Update DEVELOPER-GUIDE.md: file map, modes, controllers, recipes for a new power.

## Later (needs its own decision)
- [ ] **V8-90** L. Two phones. Nearby (app only), online with a room code, or Game Center: design section 7.
- [ ] **V8-91** L. iPad layout (the app is iPhone-only today).
- [ ] **V8-92** M. Powers for Noah.
- [ ] **V8-93** M. Best-of-three and tournaments for up to 4 players.
- [ ] **V8-94** S. A second player steers Max during the main game.
- [ ] **V8-95** M. Hard Max: blocks are not automatic, tap to jump.

## Ideas inbox
New ideas from Derek go here first, dated, before they are sorted into a milestone.
