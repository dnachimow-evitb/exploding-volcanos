// App Store screenshots: 6.9-inch iPhone size, 1320 x 2868 (440 x 956 points at 3x).
// Runs the packaged game (native/www, so run `npm run build` first) in a headless browser with the iPhone's
// notch and home-bar spacing, a demo player with some badges and coins, and saves PNGs to native/screenshots/.
// Usage (from native/):  npm run build && node scripts/screenshots.js
// Needs Playwright (preinstalled in Claude's cloud sessions). The iPhone draws text in SF Pro Rounded, which a
// Linux browser lacks; if @fontsource/nunito is installed (npm i --no-save @fontsource/nunito) it stands in.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const WWW = path.join(__dirname, '..', 'www'), OUT = path.join(__dirname, '..', 'screenshots');
const SAFE_TOP = 62, SAFE_BOTTOM = 34;   // iPhone 6.9-inch (Pro Max) insets in points
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
let fontDir = null;
try { fontDir = path.join(path.dirname(require.resolve('@fontsource/nunito/package.json')), 'files'); } catch (e) {}

const PLAYER = { cur: 0, list: [{ name: 'Noah', icon: '🦆', coins: 185, owned: ['crayon', 'whale', 'jelly', 'turtle', 'crab'],
  st: { games: 14, rounds: 62, toys: 312, misses: 40, hair: 23, blocks: 9, newFirst: 6, sneak: 5, perfect: 11, quick: 4,
        rebounds: 8, hardRounds: 6, wins: 2, bestScore: 3400, bestStreak: 22, bestRound: 10, bestCombo: 9 } }] };

function serve() {
  return http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    let file = u.startsWith('/fonts/') && fontDir ? path.join(fontDir, path.basename(u)) : path.join(WWW, u === '/' ? 'index.html' : u);
    if (!file.startsWith(WWW) && !(fontDir && file.startsWith(fontDir))) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      if (file.endsWith('index.html')) {
        let html = data.toString()
          .replace('height:env(safe-area-inset-top)', `height:${SAFE_TOP}px`)
          .replace('height:env(safe-area-inset-bottom)', `height:${SAFE_BOTTOM}px`);
        if (fontDir) html = html.replace('</style>', [700, 800, 900].map(w =>
          `@font-face{font-family:"SF Pro Rounded";font-weight:${w};src:url(/fonts/nunito-latin-${w}-normal.woff2)}`).join('') + '</style>');
        data = Buffer.from(html);
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  }).listen(0);
}

(async () => {
  if (!fs.existsSync(path.join(WWW, 'index.html'))) { console.error('Run `npm run build` first.'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  const server = serve(), port = server.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, hasTouch: false });
  await page.addInitScript(p => { localStorage.setItem('evitb-profiles-v1', JSON.stringify(p)); }, PLAYER);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://localhost:${port}/index.html`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2200);
  const shot = async name => { await page.screenshot({ path: path.join(OUT, name) }); console.log('saved', name); };

  // 1. start screen
  await shot('1-start.png');

  // 2. aiming: Push mode, round 6, hold a press on a toy so the aim guide shows
  await page.evaluate(() => {
    swipeMode = false; hardMode = false; startGame();
    round = 6; currentToys = PF.list[PF.cur].line.slice(0, 8); newToyEm = null; startRound(false);
    state = 'play'; tutOn = false; bannerT = 0; hintT = 0; score = scoreShown = 1260; lastNow = performance.now();
  });
  await page.waitForTimeout(1500);
  const toy = await page.evaluate(() => {
    const o = objs.filter(o => !o.hb && o.st === 'float').sort((a, b) => Math.abs(a.x - 120) - Math.abs(b.x - 120))[0];
    const r = cv.getBoundingClientRect(); return { x: r.left + o.x * KS, y: r.top + (o.y + OY) * KS };
  });
  await page.mouse.move(toy.x, toy.y); await page.mouse.down();
  // keep holding until the green "Let Go!" signal shows (the throw would land in the crater)
  // then pin the charge there each frame (in Push mode it keeps growing while held) so the shot catches it
  const green = await page.evaluate(() => new Promise(done => {
    const t0 = performance.now();
    (function poll() {
      if (wasOn && charging) {
        const c = charging.c, raf = window.requestAnimationFrame;
        window.__raf = raf;
        window.requestAnimationFrame = cb => raf(t => { if (charging) charging.c = c; cb(t); });
        return done(true);
      }
      if (performance.now() - t0 > 4000) return done(false);
      setTimeout(poll, 4);
    })();
  }));
  if (!green) console.log('no green signal; shot taken anyway');
  await page.waitForTimeout(250);
  await shot('2-aim.png');
  await page.evaluate(() => { if (window.__raf) window.requestAnimationFrame = window.__raf; });
  await page.mouse.up();

  // 3. the eruption at the end of a round
  await page.waitForTimeout(600);
  await page.evaluate(() => { collectedToys = currentToys.slice(0, 6); timeLeft = Math.max(timeLeft, 12); roundWin(); });
  await page.waitForTimeout(1300);
  await shot('3-eruption.png');

  // 4. badges, 5. my toys (back on the start screen)
  await page.evaluate(() => { state = 'play'; goMenu(); });
  await page.waitForTimeout(800);
  await page.evaluate(() => { bdgPg = 1; bdgT0 = uiT; });
  await page.waitForTimeout(1200);
  await shot('4-badges.png');
  await page.evaluate(() => { bdgPg = 0; openToys(); });
  await page.waitForTimeout(1200);
  await shot('5-my-toys.png');

  if (errors.length) console.log('page errors:', errors);
  await browser.close(); server.close();
})();
