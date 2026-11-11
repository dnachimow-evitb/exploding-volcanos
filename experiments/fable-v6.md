# Version 6 (fable-v6): swipe to throw

- **Model:** Claude Fable 5.2 (`claude-fable-5-2`), in Claude Code (desktop app)
- **Date:** 2026-11-11
- **Branch / tag:** `model/fable-v6`, branched from `model/fable-v5` (at `fable-v5-v11`), tagged `fable-v6-v1`
- **Files added:** `game-fable-v6.js`, `play-fable-v6.html`, `experiments/fable-v6.md`
- **Not published.** The live game is still version 5. Open `play-fable-v6.html` locally to try this.

## The request

> I have an idea for a version 6; it fundamentally changes how the toys get tossed and i'd like to experiment with it. instead of a long press hold down, i'd like to mess with swiping haptics, long harder swipes are like holding down longer, weaker swipes and like shorters pushes...this would be similar to like a soccer or field goal game..can we try that

## What changed

Everything is version 5 except how a toy is thrown.

- **Before:** press and hold a toy; power builds with time; let go.
- **Now:** touch a toy and swipe toward the volcano; let go to throw. Power comes from the swipe.

**How swipe power is worked out**

- Distance counts only in the direction of the volcano. Swiping sideways or backwards adds nothing.
- Speed adds a boost: the fastest moment of the swipe multiplies the distance by 0.7 (slow drag) up to 1.15 (very fast flick).
- A "just right" throw (power 1.0) is a slow drag of about 180 units or a quick flick of about 125 units. The screen is 380 units wide, so that is roughly a third to a half of the screen width.
- Under about 80 units falls short; a full-length hard swipe (250 units, fast) overshoots.
- A tap with no swipe (under 16 units) throws nothing and brings the hint back.

**Feedback while swiping**

- A line follows your finger from where it went down, and the dotted arc shows where the toy would land if you let go now. Both turn green when the throw would go in, with a "Let Go!" bubble and the chime.
- The round-1 hint is the same dashed arrow from the toy to the crater, now labelled "Swipe It In!".

**Forgiveness**

Flicks are less precise than holds, so a near-miss snaps to the crater from further away: within ±0.12 power, versus ±0.04 in version 5. This makes version 6 easier to hit than version 5 for the same aim error, on purpose. It is the first number to turn down if swiping feels too easy.

**Haptics**

A tick on grabbing a toy and when the aim turns green, and a double tick on release. Android browsers get real vibration. iPhone Safari has no vibration support, so the game uses a known workaround (toggling a hidden switch control, which produces the system's haptic tick on recent iOS). It may not fire on every iOS version and I could not test it.

**Unchanged:** rules, scoring, difficulty table, rounds, Max's blocking, hairballs, the song, and all the art.

## Numbers to tune (top of the SWIPE block in `game-fable-v6.js`)

| Name | Value | Meaning |
|---|---|---|
| `SWIPE_MIN` | 16 | shorter than this is a tap, not a throw |
| `SWIPE_FULL` | 250 | swipe distance for maximum power at full speed |
| `SWIPE_FAST` | 1500 | swipe speed (units per second) that counts as "fast" |
| forgiveness | ±0.12 | how far a near-miss is pulled to the crater |

## How I checked it

Browser pane at 375×812, no console errors, using scripted pointer events on round 1:

| Swipe | Power | Result |
|---|---|---|
| tap (4 units) | none | nothing thrown, toy stays |
| weak, slow (80 units over 400ms) | 0.63 | fell short, back in the tub |
| medium, slow (180 units over 500ms) | 1.08 | in (arc was green at release) |
| medium flick (125 units in 110ms) | 0.94 | in (pulled in by forgiveness) |
| long, hard (250 units in 120ms) | 1.70 | overshot, back in the tub |
| slightly short flick (112 units in 110ms) | 0.86 | in (pulled in by forgiveness) |

One screenshot mid-swipe confirmed the green finger line, green arc and "Let Go!" bubble. I then moved that bubble below the toy so the swipe line doesn't cover it, and did not re-shoot.

**Not checked:** a real finger on a real phone, which is the whole point of this experiment; haptics on any device; rounds with drift, where the "just right" power shifts slightly; and whether a 4-year-old finds a swipe easier than a hold.

---

## v2 revision (same day, tag `fable-v6-v2`)

**Feedback after trying it on the phone:** "the swipe feels too sensitive and reactive, turn up the forgiveness."

**What I changed**

- **Wide sweet zone.** Power no longer rises in a straight line with swipe length. Swipes of roughly 100 to 240 units all give close to the right power (0.85 to 1.15); only short swipes under about 100 fall away quickly, and only long ones past 240 climb toward an overshoot.
- **More forgiveness.** Near-misses snap to the crater within ±0.18 power (was ±0.12; version 5's hold is ±0.04).
- **Speed counts for less.** The speed multiplier is now 0.85 to 1.075 (was 0.7 to 1.15), so a quick flick and a slow drag of the same length behave almost the same.
- **Calmer arc.** The dotted arc eases toward the current power instead of jumping with every finger movement. The throw itself uses the true value at release.

**Scripted results on round 1 (toy at the left side of the tub)**

| Swipe length | Slow (300ms) | Fast (90ms) |
|---|---|---|
| 50 to 80 units | miss (short) | miss (short) |
| 100 to 110 | in | in |
| 140 to 200 | in | in |
| 240 to 260 | in | in |
| 290 to 300 | miss (over) | miss (over) |

So anything from about a quarter to two thirds of the screen width now goes in. That is very forgiving; if it turns out too easy, narrow the forgiveness first (`assistSwipe`), then the sweet zone.

**Not checked:** a real finger, haptics, and rounds with drift.

---

## v3 revision (same day, tag `fable-v6-v3`)

**Feedback:** "a bit too easy now... it makes it too easy to just go into full on launch mode." Chosen from the options offered: narrow the forgiveness, and make direction count.

**What I changed**

- **Tighter power.** The sweet zone is now swipes of roughly 140 to 235 units (was 100 to 260), and near-misses snap in within ±0.09 power (was ±0.18).
- **Direction steers the throw.** Until now every throw auto-aimed at the crater and the swipe only set power. Now the swipe's angle matters: swiping off the toy-to-crater line lands the toy off to that side. The first 3.4° either way is free; beyond that each extra degree moves the landing spot about 4 units sideways. The dotted arc bends to show it, and only turns green when both power and direction are right.
- How much angle you get away with depends on the crater size, so it tightens as rounds go on: about 12 to 18° off-line still lands in round 1, about 8 to 10° in round 10.

**Scripted results (toy at the left of the tub, 250ms swipes)**

Power, swiping dead straight, round 1:

| Length | 90 | 120 | 165 | 215 | 260 |
|---|---|---|---|---|---|
| Result | short | short | in | in | over |

Direction, 165-unit swipe:

| Angle off-line | 6° | 12° | 18° | 28° |
|---|---|---|---|---|
| Round 1 | in | in | in one side, miss the other | miss |

Round 10 (smallest crater): 0° in, 8° in, 14° miss.

**Not checked:** a real finger, haptics, and whether rapid swiping now sprays as intended; the tests were single deliberate swipes.

**Tuning numbers:** `STEER_DEAD` (free angle, 0.06 radians), `STEER_GAIN` (sideways units per radian, 230), the power forgiveness list in `assistSwipe`, and the three-part power curve in `swipeMove`.

---

## v4 revision (same day, tag `fable-v6-v4`)

**Feedback:** "still a bit too sensitive in that it's too easy to LAUNCH it way too far... also, it would be cool if we could bounce off the walls and effectively create rebound scores."

**Over-launching**

- Fast swipes no longer add extra power (speed multiplier now 0.88 to 1.0, was 0.85 to 1.075).
- The sweet zone reaches further up: swipes of about 110 to 240 units give power 0.8 to 1.2.
- Past the sweet zone, power climbs slowly to a ceiling of 1.5 (was 1.7, reached quickly). A swipe across most of the screen now overshoots a little instead of rocketing off.

**Wall bounces and rebound scores**

- A flying toy bounces off the left and right walls (keeping 82% of its sideways speed) and off the top of the play area just under the score bar (keeping 60%). Each bounce gets a ring, sparkles, a "boing" tone and a haptic tick.
- Previously a toy that reached the side of the screen simply counted as a miss. Now it only misses when it comes back down into the water.
- **A toy that goes in after at least one bounce scores double**, with a "Rebound! x2" callout. The combo multiplier still applies on top. Hairballs get no rebound bonus.
- The dotted aiming arc and the green "Let Go!" check both include bounces, so bank shots can be lined up on purpose by swiping toward a wall.

**This changes scoring.** The original has no rebound bonus. It is new in version 6 only.

**Scripted results (round 1, toy at the left of the tub)**

| Swipe | Power | Result |
|---|---|---|
| 120 units, straight | 0.80 | short |
| 175 units, straight | 0.96 | in, 14 points |
| 240 units, straight | 1.17 | in, 14 points |
| 300 units, straight | 1.28 | overshot, bounced once, missed |
| 360 units, fast | 1.38 | overshot, bounced once, went in: 28 points |
| deliberate bank shot off the right wall | 1.24 | 1 bounce, in: 28 points |

So a plain catch is 14 and a rebound is 28, as intended. One consequence to judge: a big overshoot can now luck into a double score by bouncing back in.

**Not checked:** a real finger, how bank shots feel to aim by hand, haptics, and bounces while Max is blocking.

**New tuning numbers:** `WALL_L` / `WALL_R` (wall positions), `BNC` (side bounce, 0.82), `BNC_TOP` (top bounce, 0.6), and the rebound multiplier in the scoring line.

---

## v5 revision (same day, tag `fable-v6-v5`)

**Request:** a very small version number in the corner of the start screen, to tell at a glance which build is running.

**What I changed:** the start screen shows the version in small text at the bottom-right corner. This build reads `v6.5`. It comes from one `VERSION` line at the top of the game file and should be bumped with every change.

---

## v6 revision (same day, tag `fable-v6-v6`, shows as `v6.6`)

**Feedback:** the last change overcompensated; even a very hard swipe felt weak.

**Cause:** a hard, quick flick covers little distance, and v6.4 had made power almost entirely about distance (speed added at most 12%).

**What I changed:** speed is now what makes a throw hard. The speed factor runs from 0.75 for a slow drag to 1.35 for a fast flick (was 0.88 to 1.0), and the sweet zone is a little wider at the top. The ceiling stays at 1.5 so a huge swipe still cannot rocket off.

**Scripted results (round 1, straight swipes)**

| Fast flick (60 to 110ms) | Result | Slow drag (400 to 600ms) | Result |
|---|---|---|---|
| 50 to 80 units | short | 110 units | short |
| 110 to 200 units | in | 160 to 240 units | in |
| 260 to 320 units | overshot, bounced in (rebound) | 330 units | overshot, bounced, missed |

So a quick flick of about a third of the screen width now lands, where in v6.5 the same flick fell short. From this toy position the long fast overshoots happened to bounce back in; that is the lucky-rebound effect noted in v4.

**Not checked:** a real finger. Real flick speeds and lengths differ from scripted ones, so this is the number most likely to need another pass.

---

## v7 revision (same day, tag `fable-v6-v7`, shows as `v6.7`)

**Feedback:** when the toy is near the far left and you try to bounce it off the left wall (the side you are on), the throw comes out weak however hard the swipe; otherwise it is generally good. Also: get rid of the ceiling bounce.

**Cause of the weak near-wall throw:** power only counted the part of the swipe that pointed at the crater. A swipe at the near wall points away from the crater, so most of it was thrown away. Steering was also capped too low for a near-wall bank to reach the volcano at all.

**What I changed**

- **Power counts the whole swipe** as long as it is heading up the screen. Anything within about 50° of straight up gets full credit, so a swipe at a side wall is as strong as one at the crater. Sideways and downward swipes still do nothing.
- **Steering reaches further.** How far the throw is steered now grows with the tangent of the swipe angle and is capped at ±460 units (was ±160), enough to send a toy into the near wall and back across to the crater.
- **Ceiling bounce removed.** Toys only bounce off the two side walls. A throw that goes too high leaves the top of the screen and falls back in.

**Scripted results (round 1, toy at the far left, 170-unit fast swipes)**

| Swipe | Power | Result |
|---|---|---|
| straight at the crater | 1.08 | in, 14 points, no bounce |
| 35° left of straight up, at the near wall | 1.08 | hit the left wall, in: 28 points |
| 40° left of straight up | 1.08 | hit the left wall, in: 28 points |
| huge swipe, 330 units | 1.45 | flew off the top of the screen, came back, bounced off the right wall and in |

Power stayed at 1.08 for every angle from 25° right to 50° left, confirming the swipe direction no longer weakens the throw. From this spot, near-wall banks land for swipes roughly 35 to 40° left of straight up.

**Not checked:** a real finger, the mirror case on the right side (same code, opposite sign), and rounds with drift.

---

## v8 revision (same day, tag `fable-v6-v8`, shows as `v6.8`)

**Request:** an Easy and Hard choice at the beginning. Hard doesn't show the green indicator that tells you the shot will score, and limits toys in the air to 3. Easy remains the game as it currently is.

**What I changed**

- **Start screen:** the single Play button is now two buttons, a green "Easy" and an orange "Hard".
- **Easy:** unchanged from v6.7.
- **Hard:**
  - No green arc, no green ring on the crater, no "Let Go!" bubble, and no chime or haptic tick when the aim is on target.
  - The dotted arc shows only its first stretch (22 steps). My addition, not in the request: the full arc ends at the crater when the throw is good, which gives the answer away as much as the green does.
  - At most 3 toys in the air. A fourth cannot be picked up until one lands.
  - The score bar reads "Hard · 3/10" in yellow instead of "Round 3/10".
- Power, steering, forgiveness, bounces, scoring and the difficulty table are identical in both modes.
- "Play Again" and "Try Again" keep the mode you chose. To switch modes, reload to get back to the start screen.

**How I checked (375×812, scripted, no console errors)**

- Start screen shows both buttons and `v6.8` in the corner.
- Tapping Hard starts a Hard game; a swipe that would score showed no green signal.
- With 3 toys flying, a fourth could not be grabbed in Hard and could in Easy.

**Not checked:** a real finger, whether the shortened arc is the right length, and the pressed look of each button individually.

**Tuning numbers:** `HARD_MAX_AIR` (3) and `HARD_ARC` (22).

---

## v9 revision (same day, tag `fable-v6-v9`, shows as `v6.9`)

**Request:** a way back to the start screen from the pause card.

**What I changed**

- The pause card has a second button, "Start Screen" (blue, under the green "Resume"). It abandons the current game and returns to the start screen, where Easy or Hard can be chosen again.
- The pause card's info line now also shows the mode: "Easy · Round 1 · Score 0".
- A guard so a round-win timer left over from an abandoned game cannot fire on the start screen.

There is no "are you sure?" step: one tap on Start Screen ends the game in progress and the score is lost.

**How I checked (375×812, scripted taps, no console errors):** Easy → play → pause (both buttons present) → Resume returns to play → pause → Start Screen returns to the start screen with the tub cleared → Hard starts a Hard game. One screenshot of the pause card.
