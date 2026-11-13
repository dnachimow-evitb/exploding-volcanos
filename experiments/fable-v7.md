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
- v7.22 (TEST COPY ONLY): a small orange "Round N" button in the bottom-right of the test page's start screen. Each tap moves the starting round up by one (1 to 10, then back to 1); the next game starts on that round with all its toys. It only exists when the page is play-test.html, so it never shows in the live game even after the test file is published.
- v7.23 (TEST COPY ONLY): two float fixes. (1) Toys that stopped: when two floating things bumped they traded speeds, and the hairball drifts very slowly, so any toy that touched the hairball took its near-zero speed and sat still (the hairball then left with the toy's speed). Now a bump turns both around and each keeps its own speed. Measured over 30 s at rounds 6/9/10: toy time spent at crawling speed 9-12% -> 0%; longest a toy sat still 2.5-5.5 s -> 1.7-2.6 s. This bug is also in the live game (and was in version 5). (2) Drift speed: the per-round increase is halved (floatSpd: round 10 is 1.1 units a frame, was 1.8; round 9 1.02, was 1.65). Average on-screen speed at round 9: 55 -> 38 units a second.
- 2026-11-12: v7.23 published live at Derek's request after he tried the test copy (v7.21 full-width floating, v7.22 test-only Round button, v7.23 stopping fix and slower drift). Cache name exploding-volcanos-v12. The Round button stays hidden in the live game.
- v7.24 (TEST COPY ONLY): coins, a toy shop and a lineup the player picks. No real money anywhere; coins only come from playing.
  - Coins: 5 per round won, 25 extra for finishing all 10, and 20 / 40 / 80 for a badge's Bronze / Silver / Gold level (COIN_ROUND, COIN_WIN, COIN_BADGE). Badge levels already held are paid once, the first time a saved player is loaded.
  - 8 new toys, bought with coins (SHOP table): Whale 30, Turtle 40, Crab 50, Starfish 60, Penguin 75, Tugboat 90, Submarine 110, Purple Dino 130. Total 585.
  - My Toys card (start screen button, or tap the coin count): 12 lineup spots (first 3 start the game, then one joins each round), and all 20 toys below. Owned toys are in colour with a tick if they are in the lineup; locked toys are grey with their price. Tap a spot then a toy (or a toy then a spot) to place it; a toy already in the lineup swaps places. Tap a locked toy then Buy. Default puts the standard 12 back.
  - Coins, owned toys and the lineup are saved per player. A bought toy can also be picked as the player's icon.
  - The game is still 10 rounds and 12 toys. All prices and payouts are first guesses.
  - Test page only: a "+50 Coins" button next to the Round button, bottom-left of the start screen.
- v7.25 (TEST COPY ONLY): the three small start-screen buttons (How To Play, Badges, My Toys) now span exactly the width of Push and Swipe.
- v7.26 (TEST COPY ONLY): the two test-only buttons moved to the empty margin left of Push ("+50" coins) and Swipe ("Rd N" starting round); at the bottom they were hidden under the How To Play row on a real iPhone.
- 2026-11-12: DEVELOPER-GUIDE.md added at the top of the project (file map, workflow, saved-data shape, recipes, testing tips). Keep it current when a recipe changes.
- v7.27 (TEST COPY ONLY): My Toys no longer repeats the lineup in the lower grid. It shows only the toys that are not in the lineup ("Other Toys", 8 of them, bigger cells, names under owned ones, prices under locked ones). Tapping one spot and then another swaps the two.
- v7.28 (TEST COPY ONLY): Other Toys lists owned toys first, then locked ones (cheapest first).
- v7.29 (TEST COPY ONLY): 8 more shop toys, 16 in the shop and 28 toys in all: Jellyfish 35, Swim Ring 45, Clownfish 55, Seal 70, Pufferfish 85, Seahorse 100, Speedboat 120, Narwhal 150 (whole shop now costs 1245 coins). Other Toys on the My Toys card pages 8 at a time with arrows and "1 Of 2". The player icon picker uses 5 smaller columns when it has more than 20 toys to show.
- v7.30 (TEST COPY ONLY): 10 more shop toys, none of them sea creatures, at Derek's request: Crayon 25, Banana 65, Teddy Bear 80, Zebra 95, Robot 105, Airplane 115, Guitar 125, Helicopter 135, Fire Truck 140, Unicorn 160 (ten, with the airplane and helicopter Derek asked for mid-build). 26 toys in the shop, 38 in all; the whole shop costs 2290 coins. Other Toys is now 4 pages. The seahorse was redrawn (teal, tube snout, crown, curled tail) after Derek said the first one looked like a crab. The icon picker uses 6 columns above 30 toys.
- v7.31 (TEST COPY ONLY): the Speedboat is replaced by a Train (same price, 120); Derek found the speedboat too close to the tugboat. `TOY_SWAP` turns a saved `speedboat` into `train` on load, so a player who bought it keeps a toy.
- v7.32 (TEST COPY ONLY): How To Play is five pages. New page 2, "Two Ways To Play", says Push and Swipe are a choice made on the start screen and what Easy or Hard means; the two demo pages are now titled "Way 1: Push" and "Way 2: Swipe"; new last page "Coins And Toys" covers earning coins, buying toys and picking the 12-toy lineup.
- v7.33 (TEST COPY ONLY): the start screen says the two big buttons are modes: a "Pick A Game Mode" heading above them, and a small line inside each (Push: "Press And Hold", Swipe: "Flick To Throw"). The next step is headed "Push Mode: Easy Or Hard?" (or Swipe), with "With Hints" / "No Hints" under Easy / Hard.
- v7.34 (TEST COPY ONLY): start-screen cover is 85% of its old width (282 units, was 332) because the lower half had become crowded; the freed height went into space around the heading and between the buttons (gap 20, was 16). Derek chose this over removing the small lines inside the buttons.
- 2026-11-12: v7.34 published live at Derek's request ("all systems go"): everything from v7.24 to v7.34 (coins, 26 shop toys, My Toys lineup, five-page How To Play, mode labels, smaller cover). Cache name exploding-volcanos-v13. The version label stays visible in the corner of the live start screen on purpose; Derek uses it. Coins, prices and badge targets have had no real play yet.
- v7.35 (TEST COPY ONLY): zebra redrawn (Derek: "a little flat"): bigger head with a white-ringed eye, dark muzzle and smile, black mane, tapered stripes, grey far-side legs and belly shade for depth, tail tuft, hooves, and an off-white body so it stands out from the white sticker rim.
- 2026-11-12: v7.35 published live (redrawn zebra). Cache name exploding-volcanos-v14.
- v7.36 (TEST COPY ONLY): new shop toy, Toy Soldier (72 coins, between Seal and Penguin): the classic green plastic army man, one green all over with darker green shading, helmet, rifle and oval stand, plus the house dot eye and smile. 27 shop toys, 39 toys in all.
- v7.37 (TEST COPY ONLY): buying a toy on the My Toys card jumps Other Toys to the page the new toy is on (page 1 unless the player owns more than 8 spare toys), so it can be put in the lineup without paging back (Derek's request).
- v7.38 (TEST COPY ONLY): the version label (and the test page's debug line) sits higher and further in from the corner: 8 units higher everywhere, and in the iPhone home-screen app it also clears an assumed 34-point home-bar area when the bottom inset reads zero. Derek stopped seeing the label in the home-screen test app.
- v7.39 (TEST COPY ONLY, TEMPORARY): the test page also shows the version in big letters in the middle of the start screen, because Derek still could not see the corner label in the home-screen test app. Remove it once the corner label is confirmed; it must not go live as is (it is wrapped in `if(TEST)`, so it would stay hidden anyway).
- v7.40 (TEST COPY ONLY): the test page always loads the newest build. Cause of Derek not seeing v7.36 to v7.39: his iPhone kept an old saved copy of play-test.html, whose fixed `game-test.js?v=N` address pinned it to the old game (a `?fresh=39` on the link showed the new build). play-test.html now adds the script under a new address on every open (`game-test.js?t=<time>`), and when the app is brought back to the front on the start screen it checks for a newer VERSION and reloads. The `?v=N` bump is gone. A phone still holding the OLD page needs the icon deleted and re-added once.
- v7.41 (TEST COPY ONLY, TEMPORARY): the test page's measurement line (top inset, window / screen height, app or web, bottom inset, drawn height) is also shown under the big mid-screen version label, because Derek sees the big label but still not the corner one. Also the first build delivered by the v7.40 auto-update.
- v7.42 (TEST COPY ONLY, EXPERIMENT): bottom of the game cut off in the iPhone home-screen app. Derek's screenshot of v7.41 read `s62>62 h812/874 app pin b34 H874`: the game was drawn 874 tall but the phone showed only the 812 it reports as the window, so the bottom 62 points (with the corner version label) were clipped and a blue band showed instead. The v7.20-era pin made only the game element screen-tall; the page stayed window-tall with `overflow:hidden`, which clips. Now, in pin mode, html and body are also made screen-tall with overflow visible (the usual workaround for this iOS bug), scrolling is blocked, and the debug line says `pin2`. Not verifiable off a real iPhone. If the bottom is still cut off, fall back to not pinning (game fits the 812 window, band below).
- v7.43 (TEST COPY ONLY): v7.42 reverted. On Derek's iPhone the screen-tall page made the screen flash constantly (screen recording 2026-11-13). The game code is v7.41's again (bottom still cut off in the home-screen app; temporary mid-screen label still on).
- v7.44 (TEST COPY ONLY): the v7.42 screen-tall page again, with the flashing fixed. Derek's recording showed v7.42 alternating between `h812/874 app pin2` (game filling the screen, corner label visible: the fix works) and `h874/874 app` (band back): once the page was screen-tall the iPhone reported the full height, the code un-pinned, the phone reported 812 again, and so on twice a second. Now the pin latches (`pinLatch`): once on, it stays on while the app is in portrait. The canvas is also only re-made when its size really changes. Reproduced off-phone with a fake window height that follows the page height: v7.42 flipped 11 times in 4 s, v7.44 once.

## Tested
Scripted in the preview at 375x812 by stepping the game by hand: Push scores on a held throw,
over-charged push throw does not bounce; Swipe Hard scores, banks off a wall, caps at 3 toys in the air;
Push/Swipe, Easy/Hard, Back, pause and Start Screen buttons. Not tested on a real iPhone.
