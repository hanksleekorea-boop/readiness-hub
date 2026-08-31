/* 오프라인 지원 — 같은 출처의 명시된 공개 정적 파일만 임시 저장한다. */
var CACHE_PREFIX = 'crh-readiness-hub-';
var V = CACHE_PREFIX + 'beta-0.6.5-ads';
var ASSETS = ['./','./index.html','./m/','./m/index.html','./dashboard.html',
  './terms/','./privacy/','./account/delete/','./advertising/','./learn/','./learn/evidence-first-launch/','./learn/mobile-pwa-release/','./learn/honest-benchmarking/','./robots.txt','./sitemap.xml','./ads.txt',
  './assets/qr.js','./assets/shell.js','./assets/legal.css','./assets/adsense-config.js','./assets/adsense.js','./assets/adsense.css','./assets/learn.css','./manifest.webmanifest',
  './assets/icon-192.png','./assets/icon-512.png','./progress.json','./persona-report.json',
  './lens/lens-core-v2.1.json','./lens/lens-eu-v1.0.json','./lens/lens-us-v1.0.json'];
self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(V).then(function (cache) {
    return Promise.all(ASSETS.map(function (url) { return cache.add(url).catch(function () {}); }));
  }));
});
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key.indexOf(CACHE_PREFIX) === 0 && key !== V; }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'CRH_SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin || /(?:\/auth\/|\/oauth\/|\/api\/)/i.test(url.pathname)) return;
  var scopePath = new URL('./', self.registration.scope).pathname;
  var relative = './' + url.pathname.slice(scopePath.length);
  var isKnownStatic = ASSETS.some(function (asset) {
    var normalized = asset === './' ? './' : asset.replace(/index\.html$/, '');
    return relative === asset || relative === normalized || (relative + '/') === normalized;
  });
  if (!isKnownStatic && event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request).then(function (response) {
    if (response.ok && isKnownStatic) caches.open(V).then(function (cache) { cache.put(event.request, response.clone()).catch(function () {}); });
    return response;
  }).catch(function () {
    return caches.match(event.request).then(function (match) {
      if (match) return match;
      return event.request.mode === 'navigate' ? caches.match('./m/') : Response.error();
    });
  }));
});
