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
- v8.10 (TEST ONLY): Derek, on Swipe in matches: "find a way to anticipate the flick". The throw is not changed.
  - **Measured first** (`experiments/sim/swipe.js`: a scripted Noah who flicks with the game's own Swipe throw, three
    skill levels, against the computer Max): as v8.9 stood, a middling or expert flicker won 100% at every stage.
  - **The computer Max now anticipates a flick.** Between throws he waits where the next flick is most likely to pass
    (the side of the tub with more toys), and because he is already watching for a finger on a toy his reaction is
    half as long. How often he bothers to guard rises with the stage (5% at stage 1 to 95% at stage 10). Guarding is
    what does the work: shortening his reaction alone changed little.
  - **After** (50 matches a stage), Noah's win rate with Swipe at stages 1 to 10: beginner 96 86 70 66 30 4 4 0 0 0;
    middling 100 94 96 98 90 64 60 50 40 26; expert 98 98 100 96 98 88 86 68 74 48. Close to the Push ladder.
  - Push is unaffected (same code path as before; spot-checked), and the physics fingerprint for playing as Max is
    identical.
  - In a browser, the fast scripted swiper that went 4 for 4 with no blocks at stage 2 was blocked 11 times.
  - **Not built yet: the tell for a PERSON playing Max against a flicking Noah.** That only happens on two devices
    (the computer Noah throws Push-style), so it is built with the two-screen match: a marker in Max's lane the
    moment Noah's finger lands on a toy, and one for a toy already in the air. Whether a person can react in time is
    unknown until two phones are playing.
- v8.11 (TEST ONLY): Derek: "There's no need to be Noah in a multiplayer game. That is the original game." and asked
  whether the Swipe anticipation was over-engineering. It partly was: the problem only existed because of a
  "Be Noah against a computer Max" mode he had not asked for.
  - **The Be Noah button is removed.** The Multiplayer card is back to Play As Max and Max School, and the ladder shows
    stages beaten as Max only.
  - Kept in the code, unreachable on one phone, because two devices need them: Noah's side of a match
    (`startDuel(stage,'noah')`, the "You Are Noah!" card, `nhBest`) for the second person, and the computer Max
    (`cpuMax`, including the Swipe guarding) to take over if the Max player drops. Do not polish these further until
    two phones are playing.
  - **Rule for this project (Derek):** on one phone, Multiplayer means playing as Max. Playing as Noah against the
    computer is the main game. Do not add solo modes that duplicate it.
  - Checked in a browser: the card, Play As Max, Max School start and Skip; main game; fingerprint unchanged.
- v8.12 (TEST ONLY): Derek made the shape of Multiplayer clear (2026-11-23): just playing = the original game as
  Noah; **Multiplayer = against a person, you choose Max or Noah and are paired with someone who has the other side.**
  His answers: pairing is BOTH a code for a friend and Quick Match with anyone; playing Max against the computer
  stays, and the computer fills in when no opponent is found or one drops. (So `cpuMax` and Noah's side of a match,
  kept in v8.11, are needed after all.)
  - **This build finds and connects the other player. The match between two phones is NOT built yet.**
  - Multiplayer is now a small menu: Play A Person, Play The Computer (the old card: stage, ladder, Play As Max, tuning),
    Max School.
  - Play A Person: **Start A Game** (pick Max or Noah, get a four-letter code, wait), **Join A Game** (type the code on
    the game's own letter keys; you get the other side), **Quick Match** (pick a side, wait for anyone who picked the
    other). When paired, a Connected card shows both players and sides, with a Wave button that makes the other phone
    say "… waved!". That card is a connection test until the match is built.
  - Codes are four consonants (no vowels, so no code spells a word); a code already in use is swapped for another.
  - **Quick Match is with strangers, so it shows and sends no names**: the other player is "A Player" with their toy.
    There is no chat anywhere. Apple's age-rating and privacy answers must be looked at again before release.
  - Relay: a Quick Match lobby added (`Lobby`, `/match?side=max|noah`): longest-waiting player of the other side is
    paired; both get a fresh room code. 22 of 22 relay checks pass locally and (after this push) on the live relay.
  - Tested with three game pages against a local relay (`experiments/sim/two-devices.js`), real taps throughout:
    start and code, wrong code, a typing mistake erased, pairing with opposite sides and each other's name and toy,
    wave, a third phone refused, the joiner leaving (host waits again on the same code, another can join), the host
    leaving (joiner is told), Quick Match pairing a Max with a Noah while a second Max keeps waiting, names hidden
    in Quick Match, cancel, and going home closing the connection. With the relay unreachable the game shows
    "Could not connect" and recovers. Main game and physics fingerprint unchanged.
  - **Not tested: real phones, and the live relay from a browser** (the cloud session cannot reach it; only the
    relay's own checks run against it, from GitHub). Derek's two-phone try of this build is the first real test.
- 2026-11-23: **Derek connected two real phones on v8.12** with a code, and Wave worked. Quick Match on real phones is
  not yet confirmed.
- v8.13 (TEST ONLY): **the match between two devices.** First playable; not yet played on real phones.
  - On the Connected card the one who started the game picks the stage, can Swap Sides, and taps Play. Max's device
    goes to Pack Your Bag, Noah's to the "You Are Noah!" card (Push or Swipe). When both are ready the match starts
    on both. After the result, Play Again brings both back to the Connected card.
  - **How the two screens stay in step** (comment block above `netBegin`): each device runs the game and is in charge
    of its own boy, so nobody waits on the network to see their own move. Noah's device owns the toys, the clock and
    every score; Max's device owns where Max is, his energy, his powers and every block. Noah's device sends the
    state of every toy about 15 times a second plus each throw and each score; Max's device sends Max 20 times a
    second plus each block and each power. A block arrives a moment late and is applied to the toy where it is by
    then; if it arrives after the toy has gone in, the score stands.
  - **If the other device goes**, the computer takes over that boy (`cpuNoah` / `cpuMax`) and the match carries on,
    with "They Left. The Computer Took Over."
  - A two-device match cannot pause (the pause button is hidden); Home needs a second tap within 2.5 seconds.
  - Max's device sees Noah's outfit. **The tell against a flick:** on Max's device the stand-here ring shows at every
    stage when Noah is on Swipe, from the moment Noah's finger lands on a toy.
  - Two-device matches pay coins and powers like any match but do not count on the stage ladder.
  - **Bug found and fixed:** the main button of a card (`card`) was not cleared each frame, so on a card with no main
    button a tap could run the previous card's button. On the joiner's Connected card, tapping Wave ran the old Join
    and showed "That game is full." Present since the main-button scheme existed; harmless before because every
    card had a main button. Now cleared every frame.
  - Tested with two game pages through a local relay, real pointer input on both sides
    (`experiments/sim/two-device-match.js`, `two-device-swipe.js`): same toys in the same places at the start; the
    wind-up, Max's position and energy, the clock and the count of toys in all matching on both screens through a
    match; 18 blocks counted on both; Big Splash sweeping Noah's toys; the same winner and rewards on both; Play
    Again; Swap Sides; a Swipe match Noah wins on both; one page closed mid-match and the computer taking over; a
    player leaving from the result card. Main game, Max School, the one-phone match and the physics fingerprint
    re-checked.
  - **Not tested and not knowable from here:** real phones, real network delay (the local relay has none), mobile
    data, whether a late block looks acceptable, whether a person can react to the flick tell.
  - Not built: Noah's tricks; a notice when the two phones run different versions beyond a line on the Connected card.
- 2026-11-23: **Derek confirmed Quick Match on two real phones** (one Max, one Noah, paired through the live relay). Start / Join by
  code, Wave and Quick Match are now all confirmed on real phones. The two-phone MATCH (v8.13) is not yet reported on.
- v8.14 (TEST ONLY): Derek asked for tap-to-copy on the code to share with a friend. On the Your Code card, tapping
  the code itself or the Copy Code button under it copies the four letters; the button turns green and says
  "Copied!", or the card says "Could not copy. Tell them the letters." A tap area can now be marked `now:true` so
  its action runs inside the tap instead of 90 ms later: phones only allow copying during the tap itself
  (`copyText`, `release`). Checked in a browser (clipboard read back, both ways of tapping). Whether the iPhone
  home-screen app allows the copy is not known until Derek tries it.
- v8.15 (TEST ONLY): Derek, again: "make it easy to copy the code to send to someone". Copying four letters still left
  the friend to find the Join screen and type them, so:
  - **Send It** on the Your Code card opens the phone's own share sheet (Messages, WhatsApp and so on) with a short
    message and an **invite link** that carries the code (`?join=CODE`). Where there is no share sheet, the whole
    invitation is copied instead. Copy Code stays beside it for the four letters alone.
  - **Opening an invite link starts the game and joins straight away**, with nothing to type (`JOIN`, `joinFromLink`);
    the code is then removed from the address bar so a reload does not rejoin. A link with a bad code is ignored; a
    link to a game that has gone says "No game with that code."
  - The link points at whichever page made it (the test page for now). The iPhone App Store app cannot make a link
    to itself, so there it will point at the website's game.
  - Checked in a browser: the fallback copy, the share sheet (stubbed) receiving the message and link, Copy Code,
    a second page opening the link and being paired, a bad link, a dead link. Not known until Derek tries: the real
    iPhone share sheet, and that a link tapped in Messages opens in Safari, not in the home-screen app (so the
    friend plays as their Safari player, not their home-screen one).
- 2026-11-24: **Derek: the invite link works on real phones** ("Holy shit, it actually works", v8.15). Not yet reported: how a whole
  two-phone match plays (delay, late blocks, the flick tell).
- 2026-11-24: Derek: "The match worked, build Noah's tricks next" (a whole two-phone match plays).
- v8.16 (TEST ONLY): **Noah's tricks** (V8-43). Three charges for the person playing Noah, kept in the same stock as
  Max's powers (`q.pw`; `TRK`, `ALLPW`): Decoy Duck (a copy of the toy flies, the real one stays; swatting it tires Max
  twice a block, `DECOY_TIRE`), Rocket Throw (the toy flies two physics steps a frame, and Max must be closer to swat
  it, `ROCKET_REACH`=.6), Double Throw (a second toy goes too, from the other side, thrown true). Noah's device: after
  Push/Swipe comes "Pack Your Tricks" (the bag card, three tricks), then buttons along the bottom; a tap arms the trick
  ("Ready") and spends the charge, and the next throw uses it (`useTrick`, `doLaunch`). Flight moved into `flyStep`
  (no change to the main game: fingerprint identical). Over the connection: the `L` message carries `f` (rocket) and
  `dc`/`em` (decoy); a decoy has its own id (900+), is left out of snapshots and lives on each device by itself.
  Match rewards now draw from all ten items. Measured (`experiments/sim/tricks.js`, scripted Noah with three of one
  trick, used on his first throws, against the computer Max, 30 matches a stage): Double Throw lifts Noah's win rate
  10 to 19 points; **Decoy Duck and Rocket Throw show no gain within the noise (about 8 points)** used blindly like
  this. They are bluffing tools, and whether they work on a person is not known until two people play. Tested with two
  pages on a local relay (`two-device-tricks.js`): both screens agree on the decoy, Max's energy, the rocket and both
  toys of a double. Not tested on phones.
- v8.17 (TEST ONLY): Derek, two phones: "When I left the game, it said computer took over but max wasn't moving and the
  toys weren't moving". Not reproduced exactly as described (Push, both sides, leaving by Home, a dead page, a page
  that sleeps: the computer took over and played in every run). Two real faults found on the way and fixed:
  (1) if the Noah player left a **Swipe** match, the computer Noah wound up for ever and never threw (he only knows
  Push); a take-over now switches the match to Push. (2) a phone that goes to sleep keeps its connection open for a
  while and says nothing, so the other screen stood still with no message (Max's screen: clock and toys frozen);
  now 3 seconds of silence (`NET_QUIET`) counts as gone and the computer takes over. Scripts:
  `two-device-noahleaves.js`, `two-device-maxleaves.js`, `two-device-background.js`. The computer Max reacts with a
  delay (0.8 s at stage 5) and barely moves at stage 1, which can look like standing still.
- v8.18 (TEST ONLY): Derek, rethinking: in the main game Max just moves back and forth, in Multiplayer he reacts to
  the shot, "more like basketball defense. Maybe this brings back the case for multiplayer vs computer as Noah. And
  I'd expect the decoys to be useful here too." **Be Noah is back** on the Play The Computer card (Be Max / Be Noah
  side by side; a blue dot under a stage beaten as Noah, `nhBest`). Same path as a two-phone Noah: Push or Swipe, Pack
  Your Tricks, play. Checked in a browser at stage 8: three decoys thrown near the computer Max, he swatted all three
  and lost 55 to 70% energy each time. Balance against the computer is the v8.16 table (Double strong; Decoy and
  Rocket no gain when fired blindly); whether a person timing a decoy before a real throw gains from it is not measured.
- v8.19 (TEST ONLY): Derek, four tasks at once: (1) decouple the computer from Multiplayer and make playing it a main
  game feature ("playing as max is no different than playing as Noah in the original game"; Multiplayer only for
  people; the computer only on a connection failure or a quit); (2) parallel badges for Max; (3) the Max game gets
  harder round by round like Noah's; (4) Max against the computer was too easy. Asked where the reacting Max for a
  Noah player should go: **"A third main-game choice"**.
  - **Start screen: Pick A Game.** Noah (the original, then Push/Swipe, then Easy/Hard: one more tap, play unchanged),
    Max, Noah Vs Smart Max, and Multiplayer ("Play A Person"). `menuStep` 0/1/2.
  - **Solo games** (`startCamp`, `solo(D)`): the two new ones are a duel without a connection, played as ten rounds.
    Win: Next Round. Lose: Try Again (same round). Round 10 won: +25 coins, Play Again from round 1. Cards say Round,
    not Stage. Smart Max asks Push/Swipe once, then goes straight to Pack Your Tricks each round.
  - **Multiplayer card**: Play A Person and Max School only. The old Play The Computer card survives on the test page
    as "Test: Any Round + Tuning".
  - **Max's badges**: twelve more in `BADGES` (`mx:1`), stats `mx*` in `ST0`, counted only in the solo Max game
    (`statSet`), same coins per level. Badges card: Noah's 1-2, Max's 3-4, Noah's stats, Max's stats. Smart Max has no
    badges yet (only `nhBest`).
  - **Difficulty** (`CAMP`, `experiments/sim/camp.js`, scripted Max with no powers and no dives, 40 games a round).
    Before: quick player 100 100 100 100 95 80 80 65 65 50; slower player 90 90 90 90 70 25 35 15 5 10 (a walkover
    for four rounds, then a cliff). Now the computer Noah starts at skill .4 (was 0) and the clock is x1.6 falling to
    x1.5 (was x1.3): quick 100 100 85 65 75 43 55 53 40 55; slower 73 75 45 33 28 20 25 10 8 18. A bag of powers adds
    to these. Round 10 still reads easier than round 9 (V8-2A). Two-phone matches are unchanged (fingerprint identical).
  - Not done: How To Play pages for the new games; badges for Smart Max; whether three powers every round make the
    Max game too easy again is not measured.
- v8.20 (TEST ONLY): Derek: "make Noah vs Smart Max as a sub choice under easy and hard". Start screen is Noah, Max,
  Multiplayer again (full-width buttons). Noah, then Push/Swipe, then Easy / Hard / **Smart Max**. Smart Max keeps the
  throw already chosen, so its "You Are Noah!" card has one Next button instead of Push/Swipe.
- v8.21 (TEST ONLY): Derek's screen recording of the Max game, round 1: "too easy; toy wasn't floating and I just stood
  in the same spot as Max and Noah was toast". The recording shows one duck left near the middle, Max parked on its
  only path, Blocks 14 to 21 in 17 seconds. **This is a hole in the match rules, not a tuning miss**, and is probably
  also his earlier "Max wasn't moving and the toys weren't moving ... destined to lose" (v8.17): a Push throw has one
  path per toy position, toys barely drifted in early rounds, a block dropped the toy back where it came from, and
  energy only slows swimming, so a Max who does not need to swim blocks for ever.
  - **Fix (matches only): a blocked toy is swatted across the tub** (`swat`, `SWAT`): it lands on the far side from
    where it was thrown, so Max has to swim for the next throw and his energy matters. Toys also drift faster in a
    match (`DUEL_DRIFT` .8). The throw itself is unchanged; the original game is unchanged.
  - Tried and dropped: (a) "too tired to block": outcome became arithmetic, every scripted Max lost at tire .35 and
    every one won at .2; (b) a computer Noah that waits for an unguarded lane: it only ran down his own clock.
  - `CAMP` retuned for the new rule: skill .15 to .8, clock x1.3 to x1.2. `camp.js`, 24 games a round, no powers or
    dives: quick Max 83 79 63 75 75 54 46 38 17 38; slower 38 58 42 33 8 25 8 0 4 29; a Max who shadows the toys with
    no thought 50 33 8 21 0 4 0 0 0 0; a Max who stands in the middle 4 0 0 0 0 0 0 0 0 0. Round 10 is still easier
    than round 9. Smart Max (`noah.js`): Noah skill .2: 100 100 83 63 58 17 13 4 0 0; skill .6: 100 x6, 96 83 83 42.
  - The match fingerprint (`fp.js`) changed on purpose: now [[2,2521,17,1,651229356],[6,3421,23,4,1917037585],[9,3112,20,11,2357667211]].
  - Two-phone matches get the same rule. Two pages on a local relay agreed on score and blocks. Not played by people.
- 2026-11-24: Derek on v8.21: "I like the bounce after a block."
- v8.22 (TEST ONLY): Derek: "how can we build logging into the game so that you can get real feedback about when I test
  the game and then adjustments based on the actual data". **Test log**: every round played on the test page adds one
  line to a list on the phone (`LOG_KEY`, newest 150; `logBegin`, `logTick`, `logEnd`). A teal "Log N" button on the
  test start screen copies it; Derek pastes it into the chat. Nothing is sent anywhere, no names, and the live game has
  none of it. A line: version | date time | game | round | WIN/LOSS/QUIT | seconds | clock left | toys in | throws, then
  for a match: blocks | dives | powers | tricks | lowest energy | % of the round tired | distance swum | longest stand-still
  | any tuning changed; for the original game: misses | Max's blocks | score. Example from a scripted round:
  `v8.22 | 11-24 17:39 | max | r1 | WIN | 44s | left 0 | in 1/3 | thr 19 | blk 16 | dive 0 | pw splash | trk - | eMin 0.00 | tired 67% | swim 1327 | still 4.3s`
  Chosen over sending logs to the relay: the relay stores nothing by design, this session cannot reach it, and the
  store listing says no data is collected. Not built: a full replay of a round (the seed and every input).
- v8.23 (TEST ONLY): Derek: "I want you to be able to make difficulty and enjoyability factors based on what you're
  seeing in the logs". The log now also records, per round: which attempt it was (`try`), seconds since the previous
  round ended (`gap`), when the last toy went in (`lastin`), and the player's own word: a **"How Was That?" row (Easy /
  Fun / Hard)** under every result card on the test page (`rateRow`, one optional tap, `felt`).
  `experiments/sim/readlog.js log.txt` turns a pasted log into a table per game and round (plays, win rate, first-try
  win rate against a target of 85% in round 1 falling to 40% in round 10, most tries, how close the wins were, time
  tired, longest stand-still, the Easy/Fun/Hard taps) and a list of flags: TOO EASY / TOO HARD (needs 3 first tries),
  A WALL (4 tries), NEVER IN DOUBT, PARKING, player says EASY/HARD, STOPPING AFTER A LOSS. The targets are my starting
  guesses, to be corrected by what Derek says felt right.

