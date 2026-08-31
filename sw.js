/* 오프라인 지원 — 이 앱이 소유한 공개 정적 파일만 임시 저장한다. */
var CACHE_PREFIX = 'crh-readiness-hub-';
var V = CACHE_PREFIX + 'beta-0.9.0-stage-1-2';
var ASSETS = ['./','./index.html','./m/','./m/index.html','./dashboard.html',
  './terms/','./privacy/','./account/delete/','./help/','./help/account/','./support/','./status/','./security/','./accessibility/','./feedback/','./workbench/','./advertising/','./learn/','./learn/evidence-first-launch/','./learn/mobile-pwa-release/','./learn/honest-benchmarking/','./robots.txt','./sitemap.xml','./ads.txt',
  './assets/qr.js','./assets/auth.js','./assets/shell.js','./assets/legal.css','./assets/content-guide.js','./assets/content-guide.css','./assets/workbench.js','./assets/workbench.css','./assets/gap-lifecycle.js','./assets/release-passport.js','./assets/adsense-config.js','./assets/adsense.js','./assets/adsense.css','./assets/learn.css','./manifest.webmanifest',
  './assets/icon-192.png','./assets/icon-512.png','./progress.json','./persona-report.json',
  './lens/lens-core-v2.1.json','./lens/lens-eu-v1.0.json','./lens/lens-us-v1.0.json',
  './content/content-guide-v2.json','./content/gate-guides.json','./content/glossary-v1.json','./content/help-faq-v1.json','./content/sample-cases-v1.json','./content/domain-lenses-v1.json','./content/domain-catalog-v1.json','./content/lens-education.json','./content/lens-commerce.json','./content/lens-saas.json','./content/locale-en-v1.json'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) {
    return Promise.all(ASSETS.map(function (u) { return c.add(u).catch(function () {}); }));
  }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf(CACHE_PREFIX) === 0 && k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'CRH_SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin || /(?:\/auth\/|\/oauth\/|\/api\/)/i.test(url.pathname)) return;
  var scopePath = new URL('./', self.registration.scope).pathname;
  var relative = './' + url.pathname.slice(scopePath.length);
  var isKnownStatic = ASSETS.some(function (asset) {
    var normalized = asset === './' ? './' : asset.replace(/index\.html$/, '');
    return relative === asset || relative === normalized || (relative + '/') === normalized;
  });
  if (!isKnownStatic && e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).then(function (response) {
    if (response.ok && isKnownStatic) caches.open(V).then(function (cache) { cache.put(e.request, response.clone()).catch(function () {}); });
    return response;
  }).catch(function () {
    return caches.match(e.request).then(function (match) {
      if (match) return match;
      return e.request.mode === 'navigate' ? caches.match('./m/') : Response.error();
    });
  }));
});
