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
- [ ] **Join the Apple Developer Program** (99 US dollars a year): developer.apple.com/programs/enroll,
      or the Apple Developer app on the iPhone. Needs an Apple Account with two-factor authentication.
      Enrol as an **Individual** (decided): quick, often a day or two; the store shows your legal name.
- [ ] After approval, in App Store Connect: check **Agreements, Tax, and Banking** shows the free-apps
      agreement as active (the app is free, so no tax or bank forms).
- [ ] Create an **App Store Connect API key** (Users and Access > Integrations > App Store Connect API,
      role Admin) so GitHub's Mac can sign and upload builds. Download the `.p8` file (it can be downloaded
      only once). Put it and its Key ID, Issuer ID and the Team ID into the repository's GitHub secrets
      (Settings > Secrets and variables > Actions). Never paste them into a chat.

### 2. The app (Claude)
- [x] Capacitor wrapper in `native/`, packaging the live game.
- [x] Portrait, iPhone only, no status bar, edge-swipe protection, launch screen, encryption flag.
- [x] Simulator build check on GitHub's Macs (no Apple account needed). First run passed 2026-11-12
      (Xcode 26, iOS 26.5 SDK, which meets Apple's current upload requirement).
- [ ] **App icon, 1024 x 1024.** The current one is the 512 home-screen icon enlarged, so it is soft, and
      the busy cover crop reads poorly at small sizes. Needs a crisp, simpler version. Blocked 2026-11-12:
      the Google AI Studio project behind Claude's Gemini access is on the free tier, which allows no image
      requests; Derek can turn on billing there (roughly 10-25 cents an image) or supply an icon.
- [ ] Signed build + upload to TestFlight from GitHub (needs step 1).
- [ ] Try it on Derek's iPhone through TestFlight (audio start, haptics, safe areas, saving).
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
- [ ] Rights: confirm we own or have commercial rights to the song, the cover art and all images. If any were
      made with an AI tool, check that the plan used allows commercial use.
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
