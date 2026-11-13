# Getting Exploding Volcanoes Into The App Store

The roadmap and checklist for the iPhone App Store version. Started 2026-11-12 at live version v7.35.
Keep this file current: tick items off and add decisions as they are made.

## How the app works

- The app is the live web game wrapped in a thin iPhone shell made with **Capacitor** (version 8).
  Everything lives in this `native/` folder; the game files one folder up are not changed by it.
- `npm run build` copies the **live** game (`index.html` + `game-fable-v7.js`, `song.mp3`, the cover art)
  into `native/www`. `npm run sync` does that and copies it into the Xcode project (`native/ios`).
  So the app always packages whatever is published at the live link.
- **Publishing a change to the website does not change the App Store app.** Each app update is a new build,
  uploaded and reviewed by Apple again (usually a day or two).
- No Mac is needed. GitHub's Macs build the app (`.github/workflows/ios.yml`, free because the repo is public).
  If a Mac is ever available, `native/ios/App/App.xcodeproj` opens in Xcode directly.
- Players, badges and coins are saved inside the app, separately from the website and home-screen app.
  Progress does not carry over between them.

### Native settings already made
- iPhone only (it still runs on iPads, in iPhone size), portrait only, status bar hidden, game-blue launch screen.
- A swipe from the very top or bottom edge goes to the game first (a second swipe still leaves), so a quick
  upward flick in Swipe mode does not throw the player out to the Home Screen. Code: `GameViewController`
  in `ios/App/App/AppDelegate.swift`.
- Declared as using no encryption (`ITSAppUsesNonExemptEncryption = false`), so Apple does not ask the
  export-compliance question on every upload.
- The offline cache (`sw.js`) is left out of the app: every file is already on the phone.
- Inside the app the home-screen-app workaround in `resize()` switches itself off (it only runs in
  home-screen mode); the app's web view reports the real screen size and notch.

## Checklist

### 1. Accounts (Derek)
- [x] **Enrolled in the Apple Developer Program** as an Individual (Derek, 2026-11-12).
- [x] **Apple approved the enrollment** 2026-11-13 (membership valid through 2027-11-13).
- [x] **Register the bundle ID**: developer.apple.com/account/resources/identifiers/add/bundleId >
      App IDs > App > Description "Exploding Volcanoes", Bundle ID *Explicit* `com.explodingvolcanoes.app`,
      no capabilities > Continue > Register.
- [x] **Create the app record**: appstoreconnect.apple.com/apps > "+" > New App > iOS, Name
      "Exploding Volcanoes", Primary Language English (U.S.), Bundle ID (the one above), SKU
      `exploding-volcanoes`, User Access Full Access. Uploads are refused until this exists.
- [x] **Create an App Store Connect API key**: appstoreconnect.apple.com/access/integrations/api
      (the first time, Request Access and accept) > Team Keys > "+" > Name "GitHub builds", Access **Admin**
      (Apple's cloud signing needs Admin) > Generate. Download the `.p8` file (it can be downloaded only
      once; keep it safe). Note the **Key ID** (in the table) and **Issuer ID** (above the table).
- [x] **Find the Team ID**: developer.apple.com/account > Membership details.
- [x] **Add four GitHub secrets**: github.com/dnachimow-evitb/exploding-volcanos/settings/secrets/actions >
      New repository secret, one each: `ASC_KEY_ID`, `ASC_ISSUER_ID`, `APPLE_TEAM_ID`, and `ASC_KEY_P8` (open the
      .p8 file in a text editor such as Notepad and paste all of it, including the BEGIN and END lines).
      Never paste these into a chat; GitHub keeps them hidden, even from Claude.
- [ ] Agreements, Tax, and Banking in App Store Connect shows the free-apps agreement as active
      (the app is free, so no tax or bank forms).

### 2. The app (Claude)
- [x] Capacitor wrapper in `native/`, packaging the live game.
- [x] Portrait, iPhone only, no status bar, edge-swipe protection, launch screen, encryption flag.
- [x] Simulator build check on GitHub's Macs (no Apple account needed). First run passed 2026-11-12
      (Xcode 26, iOS 26.5 SDK, which meets Apple's current upload requirement).
- [x] **App icon: the painted cover crop stays** (Derek, 2026-11-13). He was shown two flat icons drawn from the
      game's own volcano art and prefers the current one. It is the 512 home-screen icon enlarged to 1024, so it
      is a little soft; a sharper copy needs a larger original of the cover art (the cover file in the repo is
      1254 px, and the volcano is only about 500 px of it). Do not replace it without asking him.
- [x] Signed build + upload to TestFlight from GitHub: the `testflight` job in `.github/workflows/ios.yml`.
      **First upload succeeded 2026-11-13: build 11, packaging live v7.45.** It archives unsigned, then signs with
      Apple's cloud-managed distribution certificate through the API key and uploads; no Mac and no certificate
      files. Start one from Actions > iPhone app > Run workflow > tick "Upload to TestFlight" (Claude can start
      it too). The job rebuilds the key file from the `ASC_KEY_P8` secret however it was pasted.
- [x] Tried on Derek's iPhone through TestFlight, 2026-11-13 (build 11, v7.45): "looks great". He did not
      report on each check separately (screen fit, audio start, bottom-edge flick in Swipe, saving).
- [ ] Optional: real haptics in Swipe mode (iPhone web pages cannot vibrate; the app can).

### 3. Store listing (together)
- [x] **App name "Exploding Volcanoes", subtitle "In The Bathtub"** (Derek, 2026-11-12). Apple allows 30
      characters for each; the full title "Exploding Volcanoes in the Bathtub" is 34.
- [ ] Description, keywords (100 characters), category (Games > Family or Casual).
- [x] Screenshots, 6.9-inch iPhone size (1320 x 2868): `native/screenshots/` (start screen, aiming, eruption,
      Badges, My Toys), made from v7.35. Remake after visible game changes: `npm run build && node scripts/screenshots.js`.
- [ ] **Privacy policy page** (required for every app) and a **support page**. Both can be simple pages on the
      game's website. The app collects nothing, so the App Privacy answer is "Data Not Collected".
- [ ] Age rating questionnaire (expected: the lowest rating).
- [x] Rights: Derek confirmed on 2026-11-12 that the rights to the song, cover art and images are covered.
- [x] Price: **free** (Derek, 2026-11-12).
- [ ] Optional: Kids category (stricter review; the game already has no ads, tracking or outside links).
- [ ] EU trader status (Apple asks every developer; "trader" means your contact details are shown in the EU).

### 4. Submit
- [ ] Submit for review (usually 24 to 48 hours). Apple rejects apps that are "just a website"; a game whose
      files are all inside the app, with native touches like the above, is the accepted kind.

## Decisions
Made by Derek on 2026-11-12:
- **Individual** developer account (the store shows his legal name as the seller).
- **Bundle ID `com.explodingvolcanoes.app`** (permanent once registered). Set in `capacitor.config.json` and
  `ios/App/App.xcodeproj/project.pbxproj`.
- **Free.** No Paid Apps agreement, tax or banking forms needed.
- **Name "Exploding Volcanoes", subtitle "In The Bathtub".**

Still open:
- Contact email to show on the support page (Apple requires a way to reach the developer).
- Kids category or not.

## Commands
```
cd native
npm install          # once
npm run sync         # package the live game into the Xcode project
```
