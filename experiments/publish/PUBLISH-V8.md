# Publishing version 8 to the live website (DONE 2026-11-26 at v8.30; Derek said "Publish". Revert point: commit a017b34)

Derek chose "Prep, then I test once" on 2026-11-26. **Do nothing below until he says "publish".**
The App Store app does not change with this: it packages `game-fable-v7.js` and needs its own 2.0 build and review.

## Steps, in order
1. Re-run the checks (all must pass on the build being published):
   `node experiments/sim/reg.js`, `fp.js`, `live-upgrade.js`, and `two-device-match.js` against a local relay.
2. `cp game-test.js game-fable-v8.js` (a new file, as was done for v5 and v7; `game-fable-v7.js` stays for reverting
   and for the App Store app's build).
3. `index.html`: load `game-fable-v8.js` instead of `game-fable-v7.js`; update its comment.
4. `sw.js`: `CACHE` to `exploding-volcanos-v16`; `ASSETS` lists `game-fable-v8.js`.
5. `cp experiments/publish/privacy.html privacy.html` (the Multiplayer section; wording drafted by the writing model
   from checked facts).
6. Commit, push `model/fable-v7`, fast-forward `main`, push. GitHub tags it. Revert point: the commit before this one
   (note its hash here), or point `index.html` back at `game-fable-v7.js` and bump `CACHE`.
7. Confirm the live address serves `VERSION` of the build; open it once as a returning player.
8. DEVELOPER-GUIDE: file map and workflow now name `game-fable-v8.js`.

## Checked on 2026-11-26 at v8.30
- A returning live player (v7.45 save) keeps players, coins, toys, lineup and badge numbers; new fields start empty;
  one of each power and trick; no test buttons, no log, no rating row, no tuning card (`live-upgrade.js`).
- The relay already accepts the live address (`relay/src/index.js` ALLOWED) and an invite link made on the live page
  points at the live page.

## Open, for Derek to know before saying publish
- He has not played v8.24 to v8.30. Difficulty of Smart Max against Swipe rests on bot games and one log.
- Quick Match pairs strangers. Names are hidden and there is no chat, but it is the first feature that connects a
  child to someone they do not know. Fine for the website if he is; for the App Store it needs Apple's age-rating and
  privacy answers rechecked (V8-39).
- The story website's game chapter does not mention version 8 (V8-75).
- The relay runs on Cloudflare's free plan; heavy use would hit its daily limit and Multiplayer would stop until the
  next day (the rest of the game is unaffected).
