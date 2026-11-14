/* Service Worker — يخلي اللعبة تشتغل بلا إنترنت ويحمّلها بسرعة.
   السياسة: الشبكة أولًا (عشان التحديثات توصل فورًا)، والكاش بديل فقط عند انقطاع الشبكة. */
const CACHE = 'koa-v1.78';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './style.css?v=1.78',
  './util.js?v=1.78',
  './audio.js?v=1.78',
  './art-sprites.js?v=1.78',
  './art-scenes.js?v=1.78',
  './data.js?v=1.78',
  './gender.js?v=1.78',
  './battle.js?v=1.78',
  './story.js?v=1.78',
  './game.js?v=1.78',
  './mountain.js?v=1.78',
  './roam.js?v=1.78',
  './village.js?v=1.78',
  './mainquests.js?v=1.78',
  './cinema.js?v=1.78',
  './i18n-en.js?v=1.78',
  './i18n.js?v=1.78',
  './main.js?v=1.78',
  './favicon.svg',
  './favicon-32.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(async (c) => {
      // ملف واحد ناقص ما يفشّل التثبيت كله
      await Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
      await self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then(
          (hit) => hit || caches.match('./index.html').then((idx) => idx || Response.error())
        )
      )
  );
});
