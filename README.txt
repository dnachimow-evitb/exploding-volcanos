EXPLODING VOLCANOS IN THE BATHTUB — web app (PWA)
==================================================

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
