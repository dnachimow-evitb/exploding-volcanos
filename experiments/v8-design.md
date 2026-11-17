# Version 8: Multiplayer mode (design for review)

Status: **DRAFT 2 for Derek to review. Nothing here is built.** Written 2026-11-17 at test v7.50 / live v7.45.
The work list that goes with it is `experiments/v8-backlog.md`.

Draft 2 changes (Derek, 2026-11-17): two devices is required, not optional; Max's powers are limited and
earned; the whole version is judged by one goal, making the game stickier.

Every number in this document is a starting guess, to be changed after real play (section 10).

## 1. The goal

Today the game is ten rounds, and then you are done. Version 8 has one job: **give players a reason to come
back tomorrow.** Everything below is there because it adds something to earn, collect, defend or beat that
does not run out.

Two things deliver that:

- **Multiplayer:** Noah against Max, two people, two devices. A human opponent never plays the same way twice.
- **A reward loop that never ends** (section 7): power charges, ranks, prizes from the volcano, a daily
  round, a running score against each rival.

**Multiplayer does not replace anything.** The ten-round game stays exactly as it is, with Push and Swipe
where they are now. This document calls it "the main game".

## 2. Decided so far

| Decided | By |
|---|---|
| The new mode is called Multiplayer and sits beside the main game | Derek |
| It must work across **two devices** | Derek |
| Max's powers are limited in number, with ways to earn more | Derek |
| Stickiness is the measure of every feature | Derek |
| Two people sharing one screen is dropped from 8.0 (parked) | Claude, follows from two devices |

## 3. How a match works

1. **Connect.** One player taps Start A Game and gets a four-letter code. The other taps Join and types it.
2. **Setup.** The host picks the stage, and who is Noah and who is Max. Each player packs their bag (section 5).
3. **Play.** One round on the clock.
4. **Noah wins** if every toy goes in and the volcano erupts. **Max wins** if the clock runs out first.
5. **Result:** who won, what each player earned, the running score between the two. Rematch, Swap Sides, Home.

**Stages** reuse the ten rounds' difficulty table: stage 1 is 3 toys and a big crater, stage 10 is 12 toys and
a small crater that drifts. The clock runs longer than in the main game (start at 1.5 times), because a
person playing Max blocks far more than the computer does today.

Either side can also be the computer, so one child can play as Max alone, on any stage.

## 4. Playing as Max

You asked whether Max is "simply left and right". I measured the game to answer that.

**What I found.** A thrown toy passes Max's height about a third of the way from where it started toward the
volcano. So Max has to be on the same side as the toy, and Noah has toys on both sides. Left and right is
already a real contest, like a goalkeeper reading a penalty.

**The problem.** A Push throw takes Noah about 1.3 seconds of holding, in full view of Max. If Max could move
freely and block everything he touched, he would block nearly every throw.

**The design:**

- **Steer.** Drag anywhere on the screen. Max swims toward your finger at a limited speed.
- **Blocks happen by themselves.** If a toy reaches Max, he swats it back. A small child can play Max.
- **The dunk.** After every block Max goes under for about a second and cannot block. This is Noah's
  opening: throw one toy to draw the block, then get the next one in behind it.
- **Powers.** Tap a power in the bag to use it (section 5).

Noah wins by switching sides and throwing in pairs. Max wins by reading which toy is the real one.

## 5. Powers: limited, earned, worth saving

Powers are **charges you own and spend**. Use one in a match and it is gone. This is the heart of the
stickiness: every match earns the things that make the next match more fun.

- **The bag.** Before a match each player packs up to **3 charges**, any mix. Unused charges come home.
- **One free move.** Max always has one Big Splash per match, so a player with an empty bag is never helpless.
- **Both boys get them.** If only Max had powers, the Noah player would have nothing to save up for.

**Max's powers**

| Power | What it does |
|---|---|
| **Big Splash** | A wave shoves the floating toys toward the walls; Noah's aim wobbles for 2 seconds. |
| **Pool Noodle** | Max's reach is 40% wider for 10 seconds. |
| **Flippers** | Max swims 30% faster for 10 seconds. |
| **Bucket** | The next block is a catch. Max keeps the toy for 4 seconds before dumping it back. |
| **Squirt Blaster** | A jet straight up from Max knocks down any toy flying above him. |
| **Bubble Bath** | Bubbles cover the bottom of the tub for 3 seconds and hide the toys. |

**Noah's tricks**

| Trick | What it does |
|---|---|
| **Decoy Duck** | A fake throw. Max swats it and gets dunked for nothing. |
| **Rocket Throw** | The next toy flies twice as fast. |
| **Double Throw** | The next throw sends two toys at once, one from each side. |

**How charges are earned** (several small sources, so there is always one close):

- Every finished multiplayer match pays one random charge; winning pays a second.
- The prize from the volcano (section 7).
- The Daily Bath (section 7).
- Each new rank (section 7).
- A power bubble that floats by in the main game from round 4: throw it in the volcano to keep it. This
  ties the two modes together. Playing the ten rounds stocks you up for multiplayer.
- Coins, at about 15 a charge, so coins never stop being useful once the toys are all bought.

## 6. Two devices

**How they connect.** A four-letter room code, typed on the letter keys the game already has. Behind it is a
small relay: a service that passes messages between the two devices and keeps nothing. It works on the
website and in the App Store app, on the same Wi-Fi or across the country. Grandparents can play.

**Why this way.** I compared three:

| Way | Verdict |
|---|---|
| **Room code through a relay** | **Chosen.** Works everywhere the game does. I can build and test it here with two browser windows. |
| Apple's nearby link | App only. Every test would need a TestFlight build on two of your phones. Possible later as an offline extra. |
| Game Center | App only, and children's accounts are often blocked from multiplayer. |

**What each player sees.** The same tub, on their own full screen. No shared strip, no fingers in the way.

**Lag.** Noah's device runs the match. Max's device sends where Max is steering about 20 times a second and
draws Max moving at once, without waiting for an answer, so steering feels instant. Max's limited swim speed
hides the rest.

**If a player drops.** The match pauses with "Waiting For Max". After 10 seconds the computer takes over,
so nobody is left stuck, and the player who stayed still earns their reward.

**Safety, for a children's game.** No chat. Nothing typed during a match; the other player sees only your
saved player name and toy. No matching with strangers: the only way in is a code someone gave you.

**What it costs.** The relay runs on Cloudflare's free plan. By my arithmetic from their published limits
that covers roughly a thousand one-minute matches a day; past that it is 5 dollars a month. To be rechecked
when it is built.

**What changes in the small print.** The privacy policy and the store listing each gain a line: online play
passes messages through a relay; nothing is stored. Apple counts data as "collected" only if it is kept
longer than needed to handle the request in real time, so the "Data Not Collected" answer should stand. I
will check that against Apple's wording again before the app is submitted. "Works without an internet
connection" stays true for the main game and for playing against the computer.

## 7. The loop that never ends

Play, earn, spend, come back. Each piece below gives a different reason to open the game again.

| Piece | What it is | Why it brings people back |
|---|---|---|
| **Power charges** | Section 5 | Something to stock up, and a reason to play one more match |
| **Two ranks** | Every player has a Noah rank and a Max rank. Every match adds stars. Ranks have no top. Each new rank pays a prize. | A number that only goes up, in both roles |
| **Prize from the volcano** | After any win, in either mode, the eruption throws out a prize bubble: coins, a charge, or, rarely, a golden toy. | You never know what you will get |
| **Golden toys** | A gold version of each of the 39 toys. They only come from prize bubbles. A page shows "7 Of 39". | A collection that takes months |
| **The Daily Bath** | One special round a day, the same for everyone, with a twist (tiny crater, all ducks, Max has a noodle). Clearing it stamps a card; seven stamps pay a big prize. | A reason to open the game every day |
| **Rivals** | The game keeps the score between you and each person you have played: "You 12, Grandpa 9". | Nobody walks away from a rivalry they are losing |
| **Keep going after round 10** | The main game no longer stops. Round 11, 12 and on, harder each time, with a best-round record. | Removes "and then you are done" |

**What I am leaving out on purpose.** No real money, no ads, no notifications, and nothing is taken away for
missing a day: a missed Daily Bath leaves the stamp card where it was. Sticky because there is more to do,
not because the game nags.

Later pieces, once these are in: weekly quests, tub and volcano themes to unlock, tournaments.

## 8. Screens

**Start screen.** It stays as it is, plus a **Multiplayer** button. Its place needs a look on a real phone,
because the lower half of that screen is already full.

**Multiplayer home.** Start A Game, Join A Game, Play The Computer, the Daily Bath, your two ranks, your bag.

**During a match.** The clock, toys left, your bag of charges along the bottom edge, the other player's name.

**Result.** Winner lettering in the style of the eruption, then the prize bubble, then the card.

**Dress-up.** The "Noah" button becomes "Dress Up" and covers both boys. Max can wear the same 12 pieces.

## 9. Coins, badges and stats

Coins are paid for matches (5 to the winner, 2 to the loser, none for a match under 20 seconds, so nobody
farms coins by quitting). New badges for the new mode: blocks made as Max, matches won on each side, days
of the Daily Bath, golden toys found. Stats are kept per saved player, as now.

## 10. Getting the balance right

I can make the rules work. I cannot tell from here whether it is fun, or fair between a six-year-old and a
dad. So:

- **A tuning panel on the test page only:** Max's speed, reach, dunk time, the clock. Change a number, play
  again, tell me which felt right.
- **Max against the computer is built first.** I can test that alone, and you can try Max on one phone
  before the two-device part exists.
- **A handicap for mixed ages:** Max's speed as Slow, Normal or Fast on the setup card.
- **Swap Sides** after every match.

## 11. How it is built

- **A mode switch.** The main game and Multiplayer share the tub, toys, physics and art. The main game must
  play exactly as it does today; I check that first.
- **Controllers.** Each boy is driven by a controller: a finger, the computer, or the other device.
- **The relay.** A few dozen lines of code on Cloudflare, deployed by GitHub the way the iPhone app is built.
- **Fair randomness.** Anything random that affects play moves to a repeatable source, so both devices and
  every player's Daily Bath see the same thing.
- **Saved data.** Each player gains charges, ranks, golden toys, the stamp card, rivals and Max's outfit.
  Old saves keep working.
- **Testing.** Two browser windows here cover the rules, the connection logic and the layout. Feel, real
  network lag and two real people need two phones.

## 12. Parked

Two people on one screen. An iPad layout. Apple's nearby link as an offline extra. Tournaments. A second
player steering Max during the main game. Hard Max with a jump button.

## 13. Releasing it

- **Version numbers.** Test builds run v8.0, v8.1 and so on. The App Store version becomes 2.0.
- **The live game is not touched** until you say publish. A revert point is tagged first.
- **The App Store app** needs a new build, new screenshots, new listing text and another Apple review.

## 14. What I need from you

1. **A go-ahead on this draft**, or changes. Everything not listed below I have decided; veto anything.
2. **Dress Noah (v7.46 to v7.50): publish it as the last v7 release, or hold it for v8?** I recommend
   publishing it once you have tried it on your phone, so v8 starts from a clean live base.
3. **A free Cloudflare account**, and two keys added to GitHub the way you added the Apple ones. About ten
   minutes. Not needed until the two-device milestone; I will give exact steps then.
4. **Your OK on the small-print change** in section 6 (one line each in the privacy policy and the listing).
5. **Two phones and two people** when the first playable build is ready. The second phone can be anything
   with a browser.
