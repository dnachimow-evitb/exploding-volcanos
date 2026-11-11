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
