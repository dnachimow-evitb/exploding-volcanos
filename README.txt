EXPLODING VOLCANOS IN THE BATHTUB — web app (PWA)
==================================================

WHICH VERSION IS LIVE (updated 2026-11-11)
------------------------------------------------------------------
The live game at https://dnachimow-evitb.github.io/exploding-volcanos/
is now VERSION 5 (index.html loads game-fable-v5.js).

The ORIGINAL game has not been deleted or changed:
  - game.js and style.css are untouched.
  - It is playable any time at
    https://dnachimow-evitb.github.io/exploding-volcanos/original.html
  - The commit just before the switch is tagged  before-v5-publish

TO SWITCH THE LIVE GAME BACK TO THE ORIGINAL (any time):
Open a terminal in this folder and run these three commands:
    git checkout before-v5-publish -- index.html sw.js
    git commit -m "Back to the original game"
    git push
Or just ask Claude: "revert the live game to the original".
The home-screen app switches back the next time or two it is opened
(the first open downloads the change, the next one shows it).

To return to version 5 after that:
    git revert HEAD
    git push

HOME-SCREEN ICON ON AN IPHONE
The icon is apple-touch-icon.png (the volcano from the cover art).
An iPhone only reads the icon when you tap "Add to Home Screen", so to
update it: delete the Volcanos icon from the home screen, open the link
above in Safari, then Share -> Add to Home Screen.

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
