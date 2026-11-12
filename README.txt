EXPLODING VOLCANOES IN THE BATHTUB — web app (PWA)
==================================================

WHICH VERSION IS LIVE (updated 2026-11-12)
------------------------------------------------------------------
The live game at https://dnachimow-evitb.github.io/exploding-volcanos/
is now VERSION 7 (index.html loads game-fable-v7.js).
Version 7 = choose Push or Swipe, then Easy or Hard; How To Play; badges and
stats; up to 4 players, each with their own toy and badges.
Full notes: experiments/fable-v7.md

Nothing older has been deleted:
  - VERSION 5 (the previous live game): game-fable-v5.js is still in this folder.
    The commit just before the switch to version 7 is tagged  before-v7-publish
  - The ORIGINAL game: game.js and style.css, playable any time at
    https://dnachimow-evitb.github.io/exploding-volcanos/original.html
    (Only its spelling changed: "Volcanos" -> "Volcanoes".)
    The commit just before the switch to version 5 is tagged  before-v5-publish

TO SWITCH THE LIVE GAME BACK TO VERSION 5 (any time):
Open a terminal in this folder and run these three commands:
    git checkout before-v7-publish -- index.html sw.js
    git commit -m "Back to version 5"
    git push
Then open sw.js and raise the number at the end of the CACHE name by one
(for example exploding-volcanos-v9 -> v10), commit and push again, so phones
that already have version 7 saved pick up the change.
Or just ask Claude: "revert the live game to version 5".

TO SWITCH THE LIVE GAME BACK TO THE ORIGINAL (any time):
    git checkout before-v5-publish -- index.html sw.js
    git commit -m "Back to the original game"
    git push
Or just ask Claude: "revert the live game to the original".

Either way the home-screen app switches the next time or two it is opened
(the first open downloads the change, the next one shows it).
Badges and players are saved on each phone, not in these files, so switching
versions does not erase them.

HOME-SCREEN ICON ON AN IPHONE
The icon is apple-touch-icon.png (the volcano from the cover art).
An iPhone only reads the icon when you tap "Add to Home Screen", so to
update it: delete the Volcanoes icon from the home screen, open the link
above in Safari, then Share -> Add to Home Screen.

VERSION 6 TEST LINK (swipe to throw, experimental)
A test build that is NOT the live game:
  https://dnachimow-evitb.github.io/exploding-volcanos/play-fable-v6.html
It does not replace version 5 and can be deleted at any time
(remove play-fable-v6.html and game-fable-v6.js). Notes: experiments/fable-v6.md

TEST COPY (where changes are tried before they go live)
------------------------------------------------------------------
Test link:  https://dnachimow-evitb.github.io/exploding-volcanos/play-test.html
The corner of its start screen shows the version followed by TEST.

  game-test.js ........ the working copy. New changes are made HERE first.
  play-test.html ...... the page that loads it. No offline cache.
  game-fable-v7.js .... the LIVE game. Not edited directly any more.

The test page keeps its own players and badges, separate from the live game's,
so nothing tried there can damage real progress. The first time it is opened
it starts from a copy of the live players and badges.

TO PUBLISH A TESTED CHANGE (or ask Claude: "publish the test version"):
  1. Copy game-test.js over game-fable-v7.js.
  2. In sw.js raise the number at the end of the CACHE name by one.
  3. Commit and push.

(play-fable-v7.html is the older test link. It loads the live file, so it now
shows exactly what the live game shows.)

Full notes on version 5: experiments/fable-v5.md

WHAT THIS IS
A complete, installable web version of the game, with your song as the
soundtrack. Runs on any phone or computer browser, works offline once
loaded, and can be added to your iPhone home screen like a real app.

FILES
  index.html ............ the page
  game.js ............... the whole game
  style.css ............. layout
  song.mp3 .............. your soundtrack (plays on first tap; 🔊 toggles it)
  manifest.webmanifest .. makes it installable
  sw.js ................. offline caching (service worker)
  icon.svg .............. app icon

------------------------------------------------------------------
TEST IT ON YOUR COMPUTER (quickest)
------------------------------------------------------------------
Just double-click index.html. It opens in your browser and plays.
(Note: the offline/install features only fully work over http — see below —
but the game itself runs fine from a double-click.)

------------------------------------------------------------------
PUT IT ON YOUR IPHONE (recommended — free, no Mac, ~2 minutes)
------------------------------------------------------------------
1. Go to  https://app.netlify.com/drop  in your browser.
2. Drag this whole "ExplodingVolcanos" folder onto the page.
3. Netlify gives you a public link (e.g. https://something.netlify.app).
4. Open that link in Safari on your iPhone.
5. Tap the Share button, then "Add to Home Screen."
6. Launch it from the home screen — fullscreen, with your song. 🎉

(Any static host works too: GitHub Pages, Cloudflare Pages, Vercel.)

------------------------------------------------------------------
RUN A LOCAL SERVER (optional, for testing install/offline on your PC)
------------------------------------------------------------------
If you have Python installed, open a terminal in this folder and run:
    python -m http.server 8080
Then visit  http://localhost:8080

------------------------------------------------------------------
WHAT'S NEXT (toward the App Store)
------------------------------------------------------------------
- Swap the code-drawn shapes for real sprite art (your cover-art style)
  for a professional look.
- Wrap this exact project with Capacitor to make a true iOS app.
  The final iOS build/submission needs a Mac — rent one in the cloud
  (Codemagic, Ionic Appflow) for ~$20 if you don't have one.
- Add haptics (native only) and a coin/toy-shop economy.
