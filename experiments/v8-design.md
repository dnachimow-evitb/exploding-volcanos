# Version 8: Multiplayer mode (design for review)

Status: **DRAFT for Derek to review. Nothing here is built.** Written 2026-11-17 at test v7.50 / live v7.45.
The work list that goes with it is `experiments/v8-backlog.md`.

Every number in this document is a starting guess. The plan is built around trying it with real players and
changing the numbers (section 9).

## 1. The idea

Today there is one way to play: you are Noah, there are ten rounds, and from round 4 Max pops up as a nuisance
the computer controls.

Version 8 adds a second way to play, **Multiplayer** (Derek's name for it, 2026-11-17):

- One person is Noah and throws toys at the volcano. One person is Max and stops them.
- There are no levels to climb. You pick one stage, play it, and somebody wins.
- Max gets gear of his own. Noah's gear is for looks; Max's gear changes what he can do.
- Either side can be played by the computer, so one child can play as Max on their own.

**Multiplayer does not replace anything** (Derek, 2026-11-17). The ten-round game stays exactly as it is, with
Push and Swipe where they are now. Multiplayer is one more mode beside it. This document calls the existing
game "the main game"; it does not need a new name on screen.

## 2. What is in Version 8, and what is not

| In 8.0 | Not in 8.0 (parked, see section 11) |
|---|---|
| Multiplayer on **one device**, two people touching the same screen | Two phones playing each other |
| Play as Max against a computer Noah | iPad-sized layout |
| Play as Noah against a smarter computer Max, on any stage | Powers for Noah |
| Stage picker (1 to 10) | Tournaments, best-of-five |
| Max's gear: 5 powers, plus Dress Max using the 12 pieces Noah already has | New characters |
| Coins, badges and stats for the new mode | |
| New start screen, How To Play pages, App Store update | |

Two phones is the biggest thing left out, on purpose. Section 7 explains why and what it would take.

## 3. How a match works

1. **Setup.** Pick who is Noah and who is Max (each is one of the saved players, or Computer). Pick a stage.
   Pick Push or Swipe for Noah. Max picks one power.
2. **Play.** One round on the clock.
3. **Noah wins** if every toy goes in and the volcano erupts. **Max wins** if the clock runs out first.
4. **Result card:** who won, toys in, blocks made, time left. Buttons: Rematch, Swap Sides, Home.

**Stages** reuse the ten rounds' difficulty table: stage 1 is 3 toys and a big crater, stage 10 is 12 toys and
a small crater that drifts. The clock is longer than in the main game (start at 1.5 times), because a person
playing Max blocks far more than the computer does today.

**The hairball** stays: Noah gets 5 more seconds for landing it, and Max can block it like a toy.

## 4. Playing as Max

You asked whether Max is "simply left and right". I measured the game to answer that.

**What I found.** A thrown toy passes Max's height about a third of the way from where it started toward the
volcano. A toy thrown from the far left passes Max well to the left; from the far right, well to the right.
So Max has to be on the same side as the toy, and Noah has toys on both sides. Left and right is already a
real contest, like a goalkeeper reading a penalty.

**The problem.** A Push throw takes Noah about 1.3 seconds of holding, in full view of the person playing
Max. If Max could move freely and block everything he touched, he would block nearly every throw. Left and
right with nothing else makes Max too strong.

**The design.** Max keeps one simple control and gets one rule that gives Noah his openings:

- **Steer.** Slide a finger left and right in Max's strip. Max swims toward the finger at a limited speed, so
  he cannot teleport across the tub.
- **Blocks happen by themselves.** If a toy reaches Max, he swats it back into the water. No timing needed,
  so a small child can play Max.
- **The dunk.** After every block Max goes under the water for about a second (bubbles show where he is) and
  cannot block. This is Noah's window: throw one toy to draw the block, then get the next one in behind it.
- **The power button.** Max's gear gives him one special move. It charges up over about 12 seconds, faster
  when he blocks. When the button glows, tap it.

That gives Max two things to do (steer, tap the power) and gives both players something to think about.
Noah wins by switching sides and throwing in pairs. Max wins by reading which toy is the real one.

Later, as an option for older players: a **Hard Max** where blocks are not automatic and you tap to jump.

## 5. Max's gear

Max picks **one power** per match. The first is free; the rest are bought with coins like toys.

| Power | What it does | Kind |
|---|---|---|
| **Big Splash** (free) | Max slaps the water. A wave shoves the floating toys toward the walls and Noah's aim wobbles for 2 seconds. | Tap |
| **Pool Noodle** | Max's reach is about 40% wider. | Always on |
| **Flippers** | Max swims about 30% faster. | Always on |
| **Bucket** | The next block is a catch. Max keeps the toy for 4 seconds before dumping it back. | Tap |
| **Squirt Blaster** | A jet straight up from Max knocks down any toy flying above him, however high. | Tap |
| **Bubble Bath** | Bubbles cover the bottom of the tub for 3 seconds and hide the toys. | Tap |

Always-on powers have no button; that is the trade for being simpler.

**Dress Max.** The drawing code for Noah's hat, goggles and the rest already works on any head, so Max can
wear the same 12 pieces for very little work. A player owns a piece once and can put it on either boy.

## 6. Who can play

| Noah | Max | What it is |
|---|---|---|
| Person | Person | The headline mode: two people, one device |
| Computer | Person | **Be Max.** New for a child playing alone |
| Person | Computer | One staged round against a Max who actually follows your throws |
| Person | Computer | The main game: the ten rounds, unchanged |

The computer Noah picks a toy, winds up where you can see it, and sometimes fakes one side then throws from
the other. The stage sets how accurate and how sneaky he is.

**Two people on one screen.** Noah plays at the bottom, as now. Max's strip goes at the top of the screen,
replacing the score bar, so the two players' fingers never cross and nobody's hand covers the tub. If the
two sit facing each other across the phone, Max's labels flip to read the right way up for him.

## 7. Two phones: why it is not in 8.0

There are three ways to connect two devices. Each has a cost that changes the product, so this is your call.

| Way | Works on | Needs | Cost |
|---|---|---|---|
| **Nearby** (Apple's device-to-device link) | App Store app only | Native code, a "find devices on your network" permission prompt | No server, no accounts, works with no internet. Slow to build: I cannot run two iPhones here, so every try is a TestFlight build on your phones. |
| **Online with a room code** | Website and app | A small always-on service to introduce the two phones | The privacy policy, the App Store privacy answers and "nothing is collected" all have to change. Something to pay for or keep running. |
| **Game Center** | App Store app only | Native code, Game Center sign-in | Apple runs it, but children's accounts are often blocked from multiplayer. |

My recommendation: ship 8.0 on one device, and build it so a second phone can be added without a rewrite
(section 10). If you want two phones next, Nearby fits this game best: it keeps the "no accounts, nothing
collected, works offline" promise the store listing makes.

## 8. Screens

**Start screen.** It stays as it is: "Pick A Game Mode", Push and Swipe, then Easy or Hard. One thing is
added: a **Multiplayer** button, which opens the match setup card. Where it sits needs a look on a real
phone, because the lower half of the start screen is already full (a third big button under Swipe, or a
wide button in place of the small row with that row moved down). The row of
small buttons stays (How To Play, Badges, My Toys, Noah); "Noah" becomes "Dress Up" and covers both boys.

**Match setup.** One card: Noah's player, Max's player, stage, Push or Swipe, Max's power, Go.

**During a match.** Max's strip across the top with his power button; the clock; a "toys left" count;
Noah's toys at the bottom as now. Home and pause stay.

**Result.** Winner lettering in the style of the eruption ("Kaboom! Noah Wins!" or "Max Saved Bath Time!"),
then the result card.

## 9. Getting the balance right

I can make the rules work. I cannot tell you from here whether it is fun, or fair between a six-year-old and
a dad. So the plan has balance built in:

- **A tuning panel on the test page only**: Max's speed, reach, dunk time, power charge time, the clock.
  You change a number, play again, and tell me which felt right.
- **First playable as early as possible** (milestone 2 in the backlog), before any gear, coins or polish.
  If the core is not fun with two people, we find out in days and change it cheaply.
- **A handicap for mixed ages:** Max's speed as Slow, Normal or Fast on the setup card.
- **Swap Sides** on the result card, so a pair can each play both roles and compare.

## 10. How it is built

- **A mode switch.** The game learns there are two rule sets, the main game and Multiplayer, sharing the same
  tub, toys, physics and art. The main game must play exactly as it does today; I will check that before anything else.
- **Controllers.** Each boy is driven by a "controller": a person's finger, the computer, or (later) another
  phone. The game only sees what the controller wants to do. This is what makes a second phone an add-on.
- **Two fingers at once.** Today the game follows one finger. It will follow each finger separately and
  give it to Noah or Max by where it started.
- **Fair randomness.** Anything random that affects play (which way a toy drifts, where the hairball
  appears) moves to a repeatable source, which a two-phone version needs.
- **Saved data.** Each player gains Max's owned powers, Max's outfit, and duel stats. Old saves keep working.
- **Testing.** I can drive two fingers in a browser and check rules and layout. Feel, haptics and two real
  people need your phone.

## 11. Parked for later

Two phones (section 7). An iPad layout (the app is iPhone-only today and runs small on an iPad; a shared
screen is much nicer large). Powers for Noah. Best-of-three and tournaments. A second player steering Max
during the main game. Hard Max with a jump button.

## 12. Releasing it

- **Version numbers.** Test builds run v8.0, v8.1 and so on, as v7 did. The App Store version becomes 2.0.
- **The live game is not touched** until you say publish. A revert point is tagged first, as for v5 and v7.
- **The App Store app** needs a new build, new screenshots, new listing text and another Apple review.
- **Store wording to recheck:** "up to four players" and "nothing to buy" stay true; "ten rounds" needs the
  new mode added.

## 13. Decisions I need from you

1. **Dress Noah (v7.46 to v7.50) is still test-only.** Publish it as the last v7 release once you have tried
   it on your phone, or hold it for v8? *I recommend publishing it first:* it gets real play on the prices,
   and v8 starts from a clean, live base.
2. **One device first, two phones later?** *Recommended: yes* (section 7).
3. **Max's control: steer, automatic blocks, the dunk, one power button?** *Recommended: yes*, and tune it
   with the panel (section 4).
4. **Max's powers cost coins, with Big Splash free?** *Recommended: yes.* The other choice is everything
   unlocked in a duel, so a sibling with fewer coins is never at a disadvantage.
5. ~~The name.~~ **Decided 2026-11-17: the mode is called Multiplayer; the main game is not renamed or replaced.**
6. **Do duels pay coins?** *Recommended:* a small amount (5 to the winner, 2 to the loser), none for matches
   shorter than 20 seconds, so nobody farms coins by losing on purpose.
7. **The six powers in section 5:** any to cut, change or add?
