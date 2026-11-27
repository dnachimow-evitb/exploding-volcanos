# App Store Listing: Exploding Volcanoes

Rewritten 2026-11-26 for **version 2.0** (game v8.30: Max, Smart Max, Multiplayer, tricks, powers, outfits). The 1.0 text
is in git history. The promotional text, description and What's New were drafted by the writing model from checked
facts; Derek has not edited them yet. Character limits are Apple's.

## Where each thing goes in App Store Connect

| Field | Value |
|---|---|
| Name (30 max) | `Exploding Volcanoes` (decided) |
| Subtitle (30 max) | `In The Bathtub` (decided) |
| Primary category | Games, then subcategories **Family** and **Casual** |
| Price | Free (decided) |
| Privacy Policy URL | `https://dnachimow-evitb.github.io/exploding-volcanos/privacy.html` |
| Support URL | `https://dnachimow-evitb.github.io/exploding-volcanos/support.html` |
| Marketing URL (optional) | `https://dnachimow-evitb.github.io/exploding-volcanos/story.html` or leave empty |
| Copyright | `2026 Derek Nachimow` (Apple adds the © sign; use the name you want shown) |
| Screenshots (iPhone 6.9") | the eight files in `native/screenshots/`, in number order |
| Build | the newest one in TestFlight (build 26 = version 2.0, game v8.30) |

## Promotional text (170 max; can be changed any time without a new review)

```
Now play as Max, the brother who blocks! Take on Smart Max, play a friend on two devices, dress Noah and earn 24 badges. No ads. Nothing to buy.
```

## Description (4000 max)

```
The bath is full, the toys are floating, and the volcano is hungry.

Help Noah splash every bath toy into the volcano before the clock runs out. Get them all in and... KABOOM! The volcano erupts and a new toy joins the tub for the next round.

Or switch sides and play as his brother Max, the one who blocks.

HOW IT PLAYS
• Push: press and hold a toy, then let go to throw it.
• Swipe: flick a toy toward the volcano. Bank it off the wall for double points.
• Pick Easy for helpful hints, Hard for a real challenge, or the new Smart Max.
• Watch out for Max, who loves to block your throws.
• Toss in the hairball for extra time.

NEW: SMART MAX
• Smart Max watches where you aim and swims to block
• Noah gets three tricks to beat him: Decoy Duck, Rocket Throw and Double Throw

NEW: PLAY AS MAX
• Ten rounds where you are the brother who blocks
• Drag to swim, tap to dive. A blocked toy is swatted across the tub
• Blocking and diving use up his energy
• Seven powers to collect, pack three per game: Big Splash, Pool Noodle, Flippers, Bucket, Squirt Blaster, Bubble Bath and Juice Box
• Max School teaches every move hands-on

NEW: PLAY A FRIEND
• Two devices: one player is Noah, the other is Max
• Start a game and send a friend the four-letter code or a link
• Or use Quick Match to play someone who is waiting
• Works between iPhones and the free web version of the game
• No chat

WHAT'S INSIDE
• 10 rounds that get busier and faster
• 39 bath toys to collect: ducks, dinosaurs, a submarine, a unicorn, a toy soldier and many more
• Earn coins by playing and pick your own toy lineup
• Dress Noah: 12 things to wear, like a hat, goggles, a mustache and a foam finger, bought with coins
• 24 badges to earn, 12 for Noah and 12 for Max, each in Bronze, Silver and Gold
• Up to 4 players on one device, each with their own toys, coins and badges
• An original song as the soundtrack
• A How To Play guide with pictures

MADE FOR FAMILIES
• No ads
• No in-app purchases. Coins only come from playing
• No accounts and no sign-up
• Nothing is collected. Progress is saved only on your device
• Single-player games work without an internet connection
• Playing a friend needs the internet. The two devices share only the moves, each player's toy picture, Noah's outfit and, in games joined with a code, the player names. None of it is stored

Made by a dad, inspired by bath time with his boys.
```

Check before using: the last line and the names Noah and Max are from the story page; change or cut as you like.

## Keywords (100 max, commas, no spaces; words already in the name and subtitle are left out)

```
kids,toddler,bath,toys,family,volcano,lava,toss,throw,duck,dinosaur,splash,casual,preschool,tub
```
(95 characters)

## What's New (version 2.0)

```
• Play as Max: ten rounds as the brother who blocks, with seven powers to collect and Max School to learn every move
• Smart Max: he watches where you aim, and Noah gets three new tricks to beat him
• Play a friend on two devices with a code, a link or Quick Match
• Dress Noah with 12 things to wear
• 24 badges, 12 for Noah and 12 for Max
• My Toys now has Noah's Toys and Max's Toys, and How To Play covers everything new
Everything from before is still here and plays the same.
```

## Age rating questionnaire

Checked against Apple's definitions on 2026-11-26 (developer.apple.com, "Age ratings values and definitions").
The Store listing job answers **None / No** to every question. For 2.0 these are the ones to look at by hand,
because the answers are Derek's declaration:

- **Messaging and Chat** ("Users can directly communicate with one another... text, voice and/or video chat..."): **No.**
  Nothing can be typed or said to the other player.
- **User-Generated Content** ("the broad distribution of content created by users..."): **No**, on the reading that a
  profile name of up to 10 letters shown to one friend in a code game is not broad distribution. This is the one
  judgement call. Derek chose on 2026-11-26 to keep names in code games. If Apple's reviewer disagrees they may ask
  for a way to report or block a player (guideline 1.2); the fallback is to stop sending names.
- **Contests** ("events that allow users to compete with one another for rankings, rewards..."): **None.** A match has
  no rankings or prizes between players.
- **Unrestricted Web Access, Social Media, Advertising, Shared Location:** No.
- Expected result: **4+** (Apple's 4+ tier allows even apps that do answer yes to user content or chat).

## App Privacy ("nutrition label")

- Apple: "'Collect' refers to transmitting data off the device in a way that allows you and/or your third-party
  partners to access it for a period longer than what is necessary to service the transmitted request in real time."
  Its FAQ adds that data "sent to your servers then immediately discarded after servicing the request" need not be
  disclosed. The relay forwards match messages and stores nothing, so the answer can stay **No / Data Not Collected**.
- Not settled by Apple's page: it also says an app with "multiplayer matching" should declare Gameplay Content, without
  saying whether that holds when nothing is kept. If Derek prefers the cautious answer: declare **Gameplay Content**
  and **User ID** (the profile name), used for **App Functionality**, **not linked** to the user, **not used for tracking**.
- Guideline 5.1.4 applies because a name can be sent from a minor's device: a privacy policy is required (present,
  updated 2026-11-26) and children's privacy laws apply. That is a legal point for Derek, not something this file settles.
- Privacy Policy URL: as above.

## Other questions Apple asks

- **Content rights:** the app contains no third-party content that needs a licence (Derek confirmed on
  2026-11-12 that the rights to the song, cover art and images are covered).
- **Export compliance:** already answered inside the app (no encryption), so Apple should not ask.
- **Advertising identifier (IDFA):** No.
- **Sign-in required:** No. Leave the demo account fields empty.
- **Made for Kids / Kids category:** still Derek's call. Not selecting it keeps review simpler; selecting it
  puts the app in the Kids category, is permanent for the app, and has stricter rules (which the game
  already meets: no ads, no tracking, no outside links, no purchases).
- **EU Digital Services Act trader status:** Apple asks every developer once. A hobby developer giving away
  a free app can usually declare **not a trader**; a trader's address and phone number are shown publicly
  in the EU. This is a legal self-declaration, so read Apple's wording before choosing.

## Notes for the App Review team (App Review Information > Notes)

Rewritten 2026-11-15 to answer Apple's "Guideline 2.1 - Information Needed - New App Submission" message
(points 1 to 6). Entered by the Store listing job in `notes` mode.

```
Thank you for reviewing Exploding Volcanoes 2.0.

WHAT IS NEW IN 2.0
Version 1.0 had one game: play as Noah and throw bath toys into the volcano. 2.0 adds:
- Max: play as the brother who blocks the toys (10 rounds against the computer). From the start screen tap Max. The first time, a short tutorial called Max School runs; it can be skipped.
- Smart Max: tap Noah, then Push or Swipe, then Smart Max (beside Easy and Hard).
- Multiplayer: two devices, one player is Noah and the other is Max.
- My Toys now also holds outfits for Noah and items for Max, all bought with coins earned by playing.
There is still no login, no account, no purchase and no advertising.

HOW TO TEST MULTIPLAYER
Multiplayer needs two devices. The second device can be another iPhone with this build, or any web browser on a computer or phone using the free web version of the same game:
https://dnachimow-evitb.github.io/exploding-volcanos/
1. On the iPhone: tap Multiplayer, Play A Person, Start A Game, choose Max or Noah. A four-letter code appears.
2. On the second device: tap Multiplayer, Play A Person, Join A Game, enter the code.
3. Both screens show "Connected". The player who started taps Play. Each player taps through one or two short cards, then the match runs for under two minutes.
Quick Match (pairing with whoever else is waiting) works the same way: choose opposite sides on the two devices and tap Quick Match on both. With only one device waiting, it keeps looking and can be cancelled.
If the other player leaves, the computer takes over their side.

WHAT MULTIPLAYER SENDS
The two devices exchange messages through a relay we run on Cloudflare Workers. The relay only forwards messages between the two devices in a match and stores nothing. The messages contain the moves of the game, each player's chosen toy picture, the outfit on the character, and, in games joined with a code, each player's profile name (letters only, at most 10, typed by the user on their own device). In Quick Match, names are not sent or shown. There is no chat, no messaging, and no way to type or send anything to the other player. Profile names are not posted anywhere or shown to anyone except the one other player in a code game.

EXTERNAL SERVICES
Only the relay described above (Cloudflare Workers), used only while a Multiplayer game is open. No analytics, advertising, authentication, payment or AI services. The single-player games make no network requests and work offline. Progress is saved only on the device.

OTHER POINTS
The app has no account registration or deletion (there are no accounts) and no paid content. It works the same in every region and is in English only. It is not in a regulated industry. The game, artwork and the song are the developer's own original work.
```

Contact details for App Review (name, phone, email) are entered by Derek and are not shown publicly.
