// Offline cache. Files are served cache-first, so ANY change to the live game
// needs this name bumped (v5 -> v6 ...) or phones keep the old files.
const CACHE = 'exploding-volcanos-v15';
const ASSETS = ['./', 'index.html', 'game-fable-v7.js', 'manifest.webmanifest', 'icon.svg', 'song.mp3', 'assets/cover-volcanoes.webp'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
