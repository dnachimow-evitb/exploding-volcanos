// Builds native/www: the files the App Store app ships with.
// It copies the LIVE game from the folder above (index.html + game-fable-v7.js + song + cover art),
// so the app always packages whatever is published at the live link. Run with: npm run build
// The offline cache (sw.js) is left out: inside the app every file is already on the phone.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const game = join(here, '..', '..');   // the game folder (repository root)
const www = join(here, '..', 'www');

function fail(msg) { console.error('build-www: ' + msg); process.exit(1); }

rmSync(www, { recursive: true, force: true });
mkdirSync(join(www, 'assets', 'toys'), { recursive: true });

// index.html without the service-worker registration and the web manifest
let html = readFileSync(join(game, 'index.html'), 'utf8');
const gameScript = html.match(/<script src="(game-[^"?]+\.js)[^"]*"><\/script>/);
if (!gameScript) fail('could not find the game <script> tag in index.html');
const swBlock = /<script>\s*if \('serviceWorker' in navigator\)[\s\S]*?<\/script>\s*/;
if (!swBlock.test(html)) fail('could not find the service-worker block in index.html (did its wording change?)');
html = html.replace(swBlock, '').replace(/<link rel="manifest"[^>]*>\s*/, '');
writeFileSync(join(www, 'index.html'), html);

// the files the game loads while it runs
const files = [gameScript[1], 'song.mp3', 'assets/cover-volcanoes.webp', 'icon.svg'];
for (const f of files) {
  if (!existsSync(join(game, f))) fail('missing ' + f);
  cpSync(join(game, f), join(www, f));
}
// optional toy art (assets/toys/<name>.png replaces a drawn toy)
for (const f of readdirSync(join(game, 'assets', 'toys')).filter(n => n.endsWith('.png'))) {
  cpSync(join(game, 'assets', 'toys', f), join(www, 'assets', 'toys', f));
}

const version = (readFileSync(join(game, gameScript[1]), 'utf8').match(/const VERSION='([^']+)'/) || [])[1] || '?';
console.log(`build-www: packaged ${gameScript[1]} (${version}) into native/www`);
