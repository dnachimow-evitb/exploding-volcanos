# Version 7 ("fable-v7"): Push Or Swipe

Test link: https://dnachimow-evitb.github.io/exploding-volcanos/play-fable-v7.html
Files: game-fable-v7.js, play-fable-v7.html. The live game (index.html, version 5) is NOT changed.

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

## Tested
Scripted in the preview at 375x812 by stepping the game by hand: Push scores on a held throw,
over-charged push throw does not bounce; Swipe Hard scores, banks off a wall, caps at 3 toys in the air;
Push/Swipe, Easy/Hard, Back, pause and Start Screen buttons. Not tested on a real iPhone.

## To make this the live game
Point index.html at game-fable-v7.js, add it to sw.js ASSETS and bump the cache name.
