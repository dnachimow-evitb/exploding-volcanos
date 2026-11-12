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

## Tested
Scripted in the preview at 375x812 by stepping the game by hand: Push scores on a held throw,
over-charged push throw does not bounce; Swipe Hard scores, banks off a wall, caps at 3 toys in the air;
Push/Swipe, Easy/Hard, Back, pause and Start Screen buttons. Not tested on a real iPhone.

## To make this the live game
Point index.html at game-fable-v7.js, add it to sw.js ASSETS and bump the cache name.
