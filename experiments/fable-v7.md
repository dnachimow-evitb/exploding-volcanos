# Version 7 ("fable-v7"): Push Or Swipe

Test link: https://dnachimow-evitb.github.io/exploding-volcanos/play-fable-v7.html
Files: game-fable-v7.js, play-fable-v7.html.

**LIVE since 2026-11-12 (v7.18):** index.html loads game-fable-v7.js and sw.js caches it (cache name exploding-volcanos-v9).
The commit before the switch is tagged `before-v7-publish`. To go back to version 5:
`git checkout before-v7-publish -- index.html sw.js`, commit, push, then raise the cache number in sw.js by one and push again.
Since v7.19 changes are made in a separate test copy first: game-test.js, loaded by play-test.html (its own saved players and badges, key `evitb-test-profiles-v1`, seeded once from the live ones). Publishing = copy game-test.js over game-fable-v7.js, bump the sw.js cache name, commit, push.

One game, two ways to throw, chosen on the start screen:

- Push: the version 5 game. Press and hold, let go. No wall bounces, no haptics, no Easy/Hard.
- Swipe: the version 6.9 game. Swipe to throw, wall rebounds score double, haptics.
  Choosing Swipe asks a second question: Swipe Easy or Swipe Hard (Back returns to Push/Swipe).

Every difference is behind one flag, `swipeMode`, in game-fable-v7.js.
The pause card shows the mode (Push, Swipe Easy, Swipe Hard) and has a Start Screen button.

## Revisions
- v7.0: first merge of v5.12 (push) and v6.9 (swipe).
- v7.1: Push also asks Easy or Hard. Push Hard only removes the green "it will score" signal (arc stays full length, no cap on toys in the air).
- v7.2: crowding fix for late rounds (8 to 12 toys). Rounds 3+ start with toys spread over both sides instead of one pile in the middle; touching toys slide past each other up and down and are pushed apart harder; a side with more than 3 toys drifts slower; walls always turn a toy inward. Missed toys still land exactly where they fall. Measured in the game at round 10 (12 toys, 30 s, 4 runs each): time a toy spends touching another fell from 14-28% to 10-13%, and the longest two toys stayed stuck together fell from 1.4-3.1 s to 0.3-1.1 s.
- v7.3: How To Play button on the start screen. Two pages (Push, then Swipe), each a small looping demo plus three short steps.
- v7.4: How To Play gets a first page, The Game: the toys, the clock, Max blocking, and the hairball (5 more seconds). Now three pages.
- v7.5: Badges and stats. Lifetime numbers are saved on the phone (localStorage key `evitb-stats-v1`), shared by Push and Swipe.
  A Badges button on the start screen opens a three-page card (two pages of badges, one of stats). Earning a level shows a banner in the game.
  12 badges, each Bronze / Silver / Gold:
  New Toy First! (new toy in first: 1/5/10), Hairball Hero (10/20/50), Sneak Past Max (round won with no Max block, rounds 4+: 1/5/15),
  Never Miss (scores in a row, carries across rounds: 10/20/40), Perfect Round (1/10/30), Beat The Clock (win with 15 s left: 1/10/30),
  Volcano Feeder (toys in: 50/250/1000), Kaboom! (rounds won: 10/50/150), Rebound Champ (Swipe wall scores: 5/25/75),
  Hard Hat (rounds won in Hard: 5/25/75), This Is The End! (all 10 rounds: 1/3/10), Big Score (1000/3000/6000).
  The thresholds are first guesses and are all in the BADGES table in game-fable-v7.js.
- v7.6: start screen toys moved into a row on the waterline, above the buttons, so buttons no longer cover them.
- v7.7: Players. Up to 4 profiles on the phone, each with its own stats and badges (localStorage key `evitb-profiles-v1`).
  A chip in the top left of the start screen shows who is playing; tapping it opens the Players card (pick, Add Player, Rename, Delete).
  Names are typed into the browser's own text box, 10 letters at most. Stats saved before v7.7 become Player 1's.
- v7.8: fix: Add Player and Rename did nothing where the browser's own text box does not open. Names are now typed on in-game letter keys (letters only, 10 at most), and Delete asks its question on an in-game card. No system pop-ups remain.
- v7.9: players can pick their toy from all 12 toys in the game: a Pick A Toy card opens after naming a new player, and a Toy button on the Players card changes it later.
- v7.10: start screen uses the corrected cover art, assets/cover-volcanoes.webp ("Volcanoes"). The live version 5 game got the same swap as v5.13 (offline cache name bumped to exploding-volcanos-v6). The old art stays at assets/cover.png.
- v7.11 (and live v5.14): visible wording changed from "Volcanos" to "Volcanoes": round-win lettering, page titles, home-screen app name. File names, the web address and the original game are unchanged. Offline cache name is now exploding-volcanos-v7.
- v7.12 (live v5.15, v6.10): spelling sweep. Every remaining "Volcanos" a person can see now reads "Volcanoes", including the original game (game.js, original.html: wording only), the story page and the README. Left alone on purpose: the web address and folder name (exploding-volcanos), saved-data and cache names, and the old history notes.
  Same release: the taped cover picture on the v7 start screen sits 24 units lower so the player chip and sound button no longer cover the tape; the waterline, toys and buttons moved down with it. The story page and v6 test page also use the corrected cover.
- v7.13: the second start-screen step just says Easy and Hard. A home button sits left of pause during play: one tap goes straight to the start screen (no question asked; the game in progress is lost). The timer bar is a little narrower to make room.
- v7.14: the home button (and Start Screen on the pause card) now asks "Go Home?" first, with Keep Playing and Go Home buttons. The game is paused while the question is up.
- v7.15: Badges and How To Play cards have a Back button on pages 2 and 3 (Close on page 1), next to the Next button.
- v7.16: every badge has its own picture inside the medal (duck, hairball, Max, clock, volcano, trophy and so on); the medal rim shows the level. Each row also says which level comes next ("Next: Silver") under its progress bar.
- v7.17: the two personal-best badges (Never Miss, Big Score) no longer look like running totals: the row reads "Best streak: 14" / "Best game: 3400" with "Goal: 20" / "Goal: 6000" on the right.
- v7.18: published as the live game (see the top of this file).
- v7.19: separate test copy set up (game-test.js + play-test.html). No change to how the game plays. The start-screen corner reads "v7.19 TEST" on the test page.
- v7.20 (confirmed working by Derek on his iPhone home-screen app, then published live the same day, cache exploding-volcanos-v11): fix for the iPhone home-screen app, where the top buttons sat under the clock/battery bar and could not be tapped, and a strip at the bottom was left empty. The page now re-checks the screen size twice a second after launch, falls back to the real screen height, and always keeps the top buttons at least 54 points down on notch phones. The test page shows the measured numbers in the bottom-left corner.
- Test page now has its own home-screen icon (apple-touch-icon-test.png: the volcano with a yellow TEST strip) and the name "Volcanoes Test"; before, it pointed at an SVG, which iPhones ignore.
- .nojekyll added so GitHub Pages publishes the files as they are (two builds had failed with a generic error).
- v7.21 (TEST COPY ONLY, not live): toys drift the full width of the tub. The no-go zone in the middle (116 units in front of Noah) is removed, rounds 3+ start with toys spread across the whole tub, and the crowd slow-down now looks at the whole tub (7 or fewer toys = full speed). Measured in the game, 25 s runs, 3 each, old v7.20 -> new: round 10 (12 toys) time touching 8-15% -> 5%, longest stuck 0.2-1.5 s -> 0.1 s; round 8: 6-7% -> 3-4%; round 6: 3-4% -> 3%. Toys now spend about 40-45% of the time in the middle.

## Tested
Scripted in the preview at 375x812 by stepping the game by hand: Push scores on a held throw,
over-charged push throw does not bounce; Swipe Hard scores, banks off a wall, caps at 3 toys in the air;
Push/Swipe, Easy/Hard, Back, pause and Start Screen buttons. Not tested on a real iPhone.
