# Version 8: Multiplayer (version history)

Design: `experiments/v8-design.md`. Work list: `experiments/v8-backlog.md`. Version 7's history: `experiments/fable-v7.md`.
All of version 8 is on the TEST page only (`game-test.js`, play-test.html). The live game is still v7.45.
Dress Noah (v7.46 to v7.50) is also test-only and ships with version 8 (Derek, 2026-11-17).

Decisions by Derek, 2026-11-17: go ahead with design draft 2; hold Dress Noah for v8; Cloudflare relay for two
devices is OK (he sets up the account when asked); the one-line privacy and listing change is OK.

## Revisions
- v8.0 (TEST ONLY): the first playable piece of Multiplayer: **Play As Max against a computer Noah**, on one phone.
  - Start screen: a Multiplayer button under Swipe (orange, "Noah Vs Max"). The gaps between the big buttons went
    from 20 to 14 to make room; the small row moved down. Nothing else on the start screen changed.
  - Multiplayer card: pick a stage (1 to 10; stage N has N+2 toys from your lineup and that round's crater, drift
    and clock), then Play As Max.
  - Max: drag anywhere to steer; he swims toward the finger at a limited speed; blocks happen by themselves; after
    each block he is dunked (under water, cannot block or move). Noah wins if the volcano erupts, Max if the clock
    runs out. Result card: Play Again, Stage, Home.
  - Computer Noah throws like a Push player (winds up in view, lets go when it will score), so he can be read.
    By stage he waits less, misses less, picks the toy furthest from Max more often, and fakes one side then
    throws from the other. He hurries while Max is dunked.
  - A match never touches the main game's stats, badges or coins (those come later in the backlog).
  - Tuning panel on the Multiplayer card, test page only: Max Speed, Max Reach, Dunk Time, Clock. Saved on the phone.
  - Under the hood: `duel` (null in the main game), `startDuel`, `duelStep`, `cpuNoah`, `TUNE`; play-affecting
    randomness now comes from a seeded source (`rnd`), effects still use Math.random.
  - **Balance numbers came from simulated matches, not from people.** A scripted Max that follows the toy Noah is
    winding up, 40 matches a stage. With the first guesses (speed 3, dunk 0.8 s, clock x1) even a slow, forgetful
    Max won 93 to 100% of matches at every stage. With the chosen defaults (speed 1.6, dunk 1.3 s, clock x1.3):
    a sharp Max (0.25 s reaction) wins 100% at stage 1 falling to about 80 to 85% at stages 6 to 9; a slow,
    forgetful Max (0.5 s reaction, ignores one throw in four) wins about 70% at stage 1 falling to 20 to 35% at
    stages 8 to 10; a Max who never moves wins 0%. Real players need to confirm or change these.
  - Checked in a browser at 375x812 and 375x667 with the real buttons and a real drag: the card, a full match to
    both endings, the result card. Main game re-checked: a Push throw and a Swipe throw both score in round 1, and
    the computer Max still sweeps by himself in round 4. Not tried on a real iPhone.
  - Known: when Max is in the middle of the tub he is partly hidden behind Noah.
- v8.1 (TEST ONLY): a deeper pass on what it is like to be Max, made before Derek's first try (he asked whether v8.0 had
  been thought through enough; it had not).
  - **Max's lane moved up the tub** (`DUEL_Y` 246; the main game keeps 292). At 292 Max and Noah stand in the same spot,
    so one always hid the other. Now Max is in front of the volcano and both boys are in view. `crossX` works out where
    a throw passes the lane from the flight maths instead of a fixed fraction.
  - Intro card before a match ("You Are Max!": drag to swim, block until the clock hits 0, stage / toys / seconds, Go!).
  - Hints while playing Max: a small marker on the water where he is swimming to; while dunked, a ring that empties as
    he comes back, then a splash and a rising note; on stages 1 to 3 only, a dashed "stand here" ring where the throw
    being wound up will pass (gold, green when he is close enough) and an arrow pointing the way.
  - A wake when he swims; a buzz on each block (where the phone allows); the last five seconds tick.
  - **A ladder to climb:** the best stage beaten as Max is saved per player (`mxBest`), shown as ten boxes on the
    Multiplayer card (tap one to pick it), and the result card offers Next Stage after a win. The card opens on the
    next stage not yet beaten.
  - Defaults changed after the lane moved (throws pass the higher lane closer together, which helps Max): speed 1.3,
    dunk 1.6 s, clock x1.5. Simulated matches, 40 a stage: a sharp Max wins about 98% at stage 1 falling to 70 to 88%
    at stages 4 to 9; a slow, forgetful Max wins 80% at stage 1 falling to 20 to 43% at stages 5 to 9; a Max who
    never moves wins 0 to 8%. Stage 10 is easier for Max than stage 9 (95% / 40%): the computer Noah struggles with
    the smallest crater. Not yet fixed.
  - Checked in a browser with the real buttons and a real drag: the ladder, the intro card, a match Max wins (best
    stage saved, Next Stage), a match Noah wins (eruption then card), pause and Go Home during a match. Main game
    re-checked as in v8.0. Not tried on a real iPhone.
  - Still unknown until people play: whether a speed of 1.3 feels sluggish, whether the dunk feels like a fair cost
    or like losing control, and whether following the dotted line is fun for more than a few matches without powers.
- v8.2 (TEST ONLY): after Derek's first try of v8.1 on his iPhone. He said: sometimes hard to see Max (not terrible);
  unclear what makes Max block, and whether height matters; unclear why Max "disappears" after a block; asked whether
  Max can jump; asked where the special powers are.
  - **The block rule is now what it looks like:** a rising toy that touches Max, anywhere from his raised hands down
    to his chest, is blocked (`maxHit`). Before, only a circle around his hands counted, so a weak throw could pass
    through his head unblocked. Height never matters to the player.
  - **The dunk is visible:** he sinks to his eyes and stays in view, with dizzy stars, the word "Dunked!", and a ring
    that empties as he recovers. v8.1 hid him completely, which read as Max vanishing. A big splash on every block.
  - The intro card says the rule in four lines (drag to swim; a toy that hits Max is blocked; each block dunks him for a
    moment; hold out until the clock hits 0). Max's name tag is drawn again on top of Noah.
  - The taller block zone helped Max, so reach went from 30 to 25. Simulated, 40 matches a stage: sharp Max 98% at
    stage 1 to 60 to 70% at stages 7 to 9; slow, forgetful Max about 70 to 80% early, 25 to 38% at stages 7 to 9.
  - Max cannot jump, and powers are not built yet (backlog milestone 4). Asked Derek what should come next.
- v8.3 (TEST ONLY): Derek's answers after v8.2 (2026-11-17): build powers next (before two devices); give Max a dive;
  **replace the dunk** (he does not want to lose control of Max).
  - **Energy replaces the dunk.** Max has one energy bar under his name (green, amber, red, "Tired!"). Every block and
    every dive costs 35% of it; it refills from empty in 11 seconds. The emptier it is, the slower he swims, down to
    20% of full speed. He always answers the finger and a toy that touches him is always blocked. Noah's opening is
    a tired Max who cannot get across in time. His full swim speed went up from 1.3 to 2.2, so a fresh Max is quick.
  - **Dive:** a quick tap (under a quarter of a second, finger barely moving) makes Max lunge to that spot. Costs the
    same energy as a block; needs that much left. A drag still just steers.
  - **Why something had to replace the dunk** (simulated, 24 to 30 matches a stage): with no cost for a block, a sharp
    Max won 96 to 100% at every stage even at a swim speed of 0.8, and a slow, forgetful one still won most. The
    lane where throws pass him is only about 160 units wide and a Push wind-up shows him the throw for over a second.
  - **Computer Noah winds up quicker at higher stages** (1.3 s at stage 1 to about 0.7 s at stage 10), like a Swipe
    player. Without this, tiring alone did not stop a sharp Max.
  - **Powers and the bag** (backlog V8-40 to V8-42, V8-44, V8-46): six powers owned as charges per player (`pw`); a
    player new to them starts with one of each. Pack Your Bag card before every match: up to 3; tap a power to pack,
    tap a slot to take out; a power you have none of can be bought for 15 coins. One Big Splash is free every match.
    In the match they are buttons along the bottom; a charge is used up only when tapped.
    Big Splash (a wave carries the floating toys to the walls and knocks the toy out of Noah's hand), Pool Noodle
    (reach x1.7 for 10 s), Flippers (swim x1.7 for 10 s), Bucket (the next block within 12 s is a catch: the toy is out
    of play for 4 s, then tipped out by a wall), Squirt Blaster (a jet straight up knocks down any toy flying above
    him; costs no energy), Bubble Bath (4 s of bubbles over the toys; the computer Noah misses three throws in four).
    A match of 20 seconds or more pays one random charge, and a second for winning; shown on the result card.
  - The rules card shows for a player's first two matches as Max (`mxN`), then matches open on the bag card.
  - Chosen defaults: speed 2.2, reach 25, tire 35%, rest 11 s, clock x1.3. Simulated, 30 matches a stage, no powers
    used: a sharp Max wins 100% at stages 1 to 2, 87% at 4 to 5, 57% at 8, 40 to 50% at 9 to 10; a slow, forgetful Max
    wins 80% at stage 1, about 40% at stages 4 to 6, and 3 to 20% at stages 7 to 10; a Max who never moves, 3%.
    So the late stages are meant to need powers. Not yet confirmed by real play.
  - Tuning panel rows are now Max Speed, Max Reach, Tire Per Block, Rest To Full, Clock.
  - Checked in a browser with the real buttons, taps and drags: rules card, bag (pack, unpack, buy), dive on a tap, no
    dive on a drag, every power's button, the bucket catching a toy, charges earned and saved, Next Stage. Main game
    re-checked (Push and Swipe score, computer Max sweeps in round 4). Not tried on a real iPhone.
  - Not built yet: Noah's three tricks (they need a person playing Noah), the power bubble in the main game.
- v8.4 (TEST ONLY): Derek asked for a review of everything new before he tests. Two passes: Claude's own through
  each feature, and an independent read of the whole diff since v7.45 by a second reviewer (a subagent given the
  code, not the reasoning). The reviewer reproduced five bugs; all are fixed here.
  - **Bugs fixed (from the independent review):** (1) a second Bucket overwrote the toy already in the bucket, which
    stayed out of play for the rest of the match, so Noah could not win; (2) fingers were not told apart, so a second
    finger on a power button or pause stopped the steering finger and could fire a dive (even while paused); (3) a fast
    double tap ran a button's action twice with stale values: stage could go to 0 (crash) or 11, and Buy could take
    coins below zero; (4) if the last toy went in with under a third of a second left, Max was given the win;
    (5) a toy hit by the Squirt Blaster on its way down into the crater counted as a block and still scored.
  - **Gaps fixed (from Claude's pass):** powers had names but no explanation anywhere (the bag card now says what the
    tapped power does, and Buy works on it); a tap near Max dived and wasted energy (a tap now dives only when it is
    more than 40 units from him, otherwise it steers); a dive with no energy did nothing and said nothing (now "Too
    Tired To Dive!", and Max looks worn out when low); nothing in play taught the dive (stages 1 to 3 show "Tap Here
    To Dive!" when the throw is too far to swim to); Big Splash sent the toys to both walls, which spread Noah's
    throws and helped him (it now sweeps every toy to Max's side); matches paid no coins although powers cost coins
    (now 5 for a win, 2 for a loss, matches of 20 seconds or more, shown on the result card); the power buttons could
    sit in the iPhone home-bar strip (moved up, labels larger); the pause card said "Push Easy, Round, Score" during
    a match; a hairball in the Bucket showed an empty bucket; Bubble Bath 5 s (was 4), Squirt Blaster jet wider;
    tuning numbers are saved under a new name so values changed on an older build cannot skew this one.
  - The review found the main game unchanged when no match is on, no state leaking between a match and the main game,
    old saves loading correctly, no button id clashes and no load-order problems.
  - Simulated again, 30 matches a stage, no powers: sharp Max 100 / 97 / 90 / 43 / 30% at stages 1 / 3 / 5 / 7 / 9;
    slow, forgetful Max 87 / 60 / 37 / 7 / 3%.
  - Checked in a browser: each bug above re-run and now correct; packing, info line, buying, near tap, far tap, tired
    tap, a full match, coins and powers on the result card; main game re-checked. Not tried on a real iPhone.
  - **Known gaps, not fixed in this build:** no badges or lifetime stats for matches; no How To Play page for
    Multiplayer; Max cannot wear the dress-up pieces yet; Noah's tricks and the power bubble in the main game are not
    built; power balance has not been simulated (the scripted players do not use powers); late stages may be too hard
    for a slow player without powers; none of it has run on a phone.
- v8.5 (TEST ONLY): **power balance, measured.** Derek asked for the gap named in v8.4 to be closed. Scripted Max
  players now use powers (`experiments/sim/pow.js`): timed powers spread evenly through the match; Big Splash when a
  throw is out of reach and he is too tired to dive; Squirt Blaster when a toy has got past him. Each power packed
  three times, 150 matches in each of four situations (sharp Max at stages 7 and 9, slow Max at stages 3 and 5).
  "Lift" is the average rise in Max's win rate over packing nothing (about 49% in these four).
  - **Before:** Squirt Blaster +28 (for the slow Max at stage 5, 39% became 81%), Flippers +20, Bubble Bath +19,
    Pool Noodle +18, Big Splash +11, Bucket +3. The Blaster undid a score every time for no energy; the Bucket was
    just a block with a short delay.
  - **Changes:** Squirt Blaster jet narrower (half-width 32, was 46) and a hit now costs energy like a block.
    Bucket holds the toy 6 seconds (was 4) and a catch costs no energy. Big Splash wave runs 2.4 seconds (was 1.3).
  - **After:** Bubble Bath +22, Pool Noodle +20, Squirt Blaster +19, Flippers +18, Bucket +16, Big Splash +15. With
    150 matches a cell these are within noise of each other (about 4 to 5 points either way). Big Splash is the
    lowest, and one is free every match.
  - **A full bag (three powers plus the free Big Splash), 100 matches a cell:** sharp Max at stage 8: 51% with nothing,
    67 to 79% with a full bag; at stage 10: 49% to 65 to 71%. Powers help a lot but do not make him unbeatable.
    Slow Max at stage 5: 39% to 63 to 70%. **Slow Max at stage 8: 11% to only 16 to 20%**, and at stage 10: 10% to
    18 to 31%. So the late stages stay very hard for a slower player even with a full bag. Not changed in this
    build; a difficulty choice for the computer Noah (as the main game has Easy and Hard) is the likely fix.
  - Limits of the method: the scripted players use each power by a simple rule, so a clever person may get more out
    of one than they do (most likely the Bucket and Big Splash, which reward timing); and no simulation says which
    powers are fun.
  - The scripts that produced every balance number in this file are kept in `experiments/sim/` (they drive the test
    page in a headless browser; `lib.js` loads the game from disk with no server). Run from that folder, for example
    `node pow.js '[[null,0],["bucket",3]]' '[["sharp",7],["slow",5]]' 150`.
  - Re-checked in a browser after the changes: the v8.4 bug list, packing and buying, dive, a full match; main game.
- v8.6 (TEST ONLY): Derek, after trying v8.5: "Can Max jump or dive?" and "we also need the tutorial for how to use
  the Max blocking toys". The dive existed (a quick tap away from Max) but the game was not teaching it.
  - **Max School**: eleven hands-on lessons, each waits for the player to do the thing: Swim, Block, Block Again,
    Dive, Energy, then one for each power (Big Splash, Pool Noodle, Flippers, Bucket, Squirt Blaster, Bubble Bath).
    Noah's throws are scripted and wait until Max is in place; the clock is stopped; energy stays full except in the
    Energy lesson; powers are lent, not spent. A power lesson shows a bouncing "Tap" arrow over its button. The
    Squirt Blaster lesson holds Max in the middle, lets one toy past him and slows time while it is overhead.
    A missed step repeats with a hint. Skip is top left; Home and pause work.
  - A player who has never seen it is taken there by Play As Max the first time (`mxTut`: 0 never, 1 skipped,
    2 finished). Finishing it the first time pays three random powers. It can be replayed any time from the
    Max School button on the Multiplayer card.
  - The old "You Are Max!" rules card is gone; matches open straight on Pack Your Bag. "Two phones: coming next"
    was removed from the Multiplayer card to make room for the button.
  - Code: `TUT` (lesson table), `startTut`, `tutSet`, `tutStep` (the script for each lesson), `tutWind` / `tutHold`
    (a scripted throw that waits), `tutEnd`, `drawTutEnd`, `playMax`.
  - Checked in a browser by playing all eleven lessons with real drags and taps, then: the reward and the saved flag,
    Play As Max going straight to the bag the second time, the Max School button, and Skip. Not on a real iPhone.
  - Max still cannot jump: height never decides a block, so a jump would have nothing to do.
- v8.7 (TEST ONLY): Derek: when playing as Max there must be more distance between Max and Noah so Max's whole
  body can be seen, **without changing the physics at all**.
  - When you play Max, Noah is drawn 60 units lower in the tub, down among the floating toys (`noahBase`). Max's
    whole body is now clear above him. It is a picture change only: Noah's body never takes part in play (throws
    start from the toy, not from his hand), and the lane, the block rule, the throws and the toys did not move.
    In the main game Noah is where he always was.
  - Proof the rules did not change: `experiments/sim/fp.js` plays three scripted matches (stages 2, 6, 9) with a fixed
    seed and prints a fingerprint of every toy and Max position through the match. It is identical before and after:
    `[[2,2521,18,0,4216522139],[6,3421,25,6,418616597],[9,3676,28,11,3725102286]]`. Use it for any future change that
    is meant to be visual only.
  - Seen in a browser with Max in the middle and at each side during a wind-up, and the main game at round 4.
    Noah's name tag and lower body are now partly behind the toys when you play Max. Not tried on a real iPhone.
- v8.8 (TEST ONLY): Derek asked how Max tires (answer: a block, a dive and a Squirt Blaster hit each cost 35%; swimming
  and the other powers cost nothing; the bar always refills, 11 s from empty) and then for "a bonus item for Max to
  allow an automatic refill of energy".
  - **Juice Box**, a seventh power: fills Max's energy at once and keeps it full for 3.5 seconds (`JUICE_T`), so
    nothing tires him while it lasts. A juice box shows by his head, blinking before it ends. Same price as the
    others (15 coins), earned at random like them; players start with one. It has its own Max School lesson,
    straight after Energy (the school is now twelve lessons).
  - **Measured before choosing the length** (`experiments/sim/pow.js`, packed three times, 150 matches in each of the
    four usual situations, used when Max is too tired to dive): a refill and nothing else lifted Max's win rate by
    only +4 points, because the bar refills by itself anyway; full energy for 8 seconds lifted it +38 (he won 83 to
    95%); 3.5 seconds lifts it +21, inside the 15 to 22 band of the other six.
  - Pack Your Bag shows the seven powers four to a row (was three).
  - Checked in a browser: packing it, using it when tired, a block during it costing nothing, it ending, the new
    lesson and all twelve lessons played through, main game. Physics fingerprint unchanged. Not on a real iPhone.
  - Open question for Derek: "automatic" was read as "it happens at once when tapped". If he meant it should fire by
    itself when Max runs out, that is a small change.
- v8.9 (TEST ONLY): Derek chose two devices as the next thing to build (2026-11-18). This build is the first half:
  the other side of the match, and the relay. **Two phones cannot play each other yet.**
  - **Be Noah**: the Multiplayer card now has Be Max and Be Noah. As Noah you pick Push or Swipe on a "You Are
    Noah!" card and throw as in the main game, against a **computer Max** (`cpuMax`). He plays by a person's rules
    (same speed, reach and energy): he watches the wind-up a little late and swims to where the throw will pass,
    dives if he thinks of it and has the energy, and with no wind-up to read goes for a toy already rising. By
    stage he reacts faster (1.1 s at stage 1 to 0.4 s at stage 10), judges the spot better, dives more, is caught
    napping less, and packs powers: a Pool Noodle from stage 6, a Juice Box too from 8, a Bubble Bath too at 10;
    from stage 6 he also uses his free Big Splash. His powers never touch the player's stock.
  - Max's name and energy bar are now drawn for both sides (`maxBar`), so Noah can see when Max is tired.
  - The best stage beaten as Noah is saved (`nhBest`). The ladder on the card shows orange for stages beaten as Max,
    blue for stages beaten as Noah, a green box for both, with a key. Next Stage is offered after a win on either side.
  - **Balance (simulated, 60 matches a stage, `experiments/sim/noah.js`)**: a scripted Noah of fixed skill against
    the computer Max. First version of him was far too good (a beginner-level Noah won 40% at stage 1 and under 3%
    from stage 5). As shipped, Noah's win rate at stages 1 to 10: beginner 93 82 78 62 37 7 2 0 0 0; middling
    95 100 97 100 92 72 58 57 45 23; expert 100 100 100 98 98 93 83 83 82 57.
  - **Known problem: Swipe.** A flick has no wind-up, so the computer Max barely reacts to it (in the browser a
    Swipe match at stage 2 went 4 for 4 with no blocks). The numbers above are for Push-style throws only. A person
    playing Max on a second phone will have the same trouble. Needs a decision: Push only in matches, or give Max a
    way to anticipate. The physics is not to be changed (Derek).
  - **The relay** (`relay/`): a Cloudflare Worker with one Durable Object per four-letter room code. First device in
    is the host, one more may join, each message is passed to the other and nothing is stored or logged; both are
    told when someone arrives or leaves. Refusals: 4004 no such room, 4003 full, 4009 code in use; other websites
    403. **Run locally in Cloudflare's own runtime (wrangler dev) and tested with real WebSocket clients: 13 of 13
    checks pass** (`relay/test/relaytest.js`). The first version failed 3 of them (a refused device was left
    connected); fixed. It is not deployed: `.github/workflows/relay.yml` deploys it once Derek adds two repository
    secrets, and does nothing until then.
  - Cloudflare's documentation site is not reachable from the cloud session (blocked host), so the configuration
    follows search results of that documentation plus the local run; check the free-plan limits again at deploy time.
  - Checked in a browser: the card, Be Noah with Push (real press and hold) through a whole match, Swipe, the result
    and rewards, the computer Max using powers at stage 10 with the player's stock untouched. Physics fingerprint
    for playing as Max unchanged. Main game re-checked. Not on a real iPhone.
  - Still to build for two devices: Start A Game / Join A Game with a code, the match kept in step between the two
    screens, what happens when a player drops, and Noah's three tricks.
- 2026-11-23: **the relay is deployed.** Derek already had a Cloudflare account (welcome mail of 2026-11-05); he made an
  API token (Cloudflare's token screen has been redesigned: the Workers template arrives as three "policies"; the Zone
  policy has to be deleted or set to All zones when the account has no domain) and added the two GitHub secrets.
  Address: `https://exploding-volcanoes-relay.dnachimow.workers.dev` (WebSocket: `wss://…/room/CODE?role=host|join`).
  The first deploy failed on a line break in the Account ID secret while the run showed green (the log was piped
  without pipefail); the workflow now strips whitespace from both secrets, fails properly, and after every deploy runs
  `relay/test/relaytest.js` against the live address from GitHub's runner: 13 of 13 pass. The cloud session cannot
  reach workers.dev (network allowlist; this session runs in the Default environment and cannot be moved), so the
  live relay can only be checked that way, and the two-screen match has to be developed against a local copy.
