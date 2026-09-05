/* 오프라인 지원 — 이 앱이 소유한 공개 정적 파일만 임시 저장한다. */
var CACHE_PREFIX = 'crh-readiness-hub-';
var V = CACHE_PREFIX + 'beta-1.1.0-content-stage-3-local';
var ASSETS = ['./','./index.html','./m/','./m/index.html','./dashboard.html',
  './terms/','./privacy/','./account/delete/','./help/','./help/account/','./help/states/','./glossary/','./samples/','./support/','./status/','./security/','./accessibility/','./feedback/','./workbench/','./advertising/','./learn/','./learn/evidence-first-launch/','./learn/mobile-pwa-release/','./learn/honest-benchmarking/','./robots.txt','./sitemap.xml','./ads.txt',
  './assets/qr.js','./assets/auth.js','./assets/shell.js','./assets/legal.css','./assets/content-guide.js','./assets/content-guide.css','./assets/mobile-accessibility.css','./assets/workbench.js','./assets/workbench.css','./assets/gap-lifecycle.js','./assets/release-passport.js','./assets/adsense-config.js','./assets/adsense.js','./assets/adsense.css','./assets/learn.css','./manifest.webmanifest',
  './assets/icon-192.png','./assets/icon-512.png','./progress.json','./persona-report.json','./en/','./assets/english-assessment.js','./assets/workbench-contracts.js','./assets/stage3-contracts.js','./assets/stage3-local.js','./assets/stage3-backup-bridge.js','./content/content-en-v1.json','./engine/benchmark-evidence.mjs','./engine/domain-classifier.mjs',
  './lens/lens-core-v2.1.json','./lens/lens-eu-v1.0.json','./lens/lens-us-v1.0.json',
  './content/content-guide-v2.json','./content/gate-guides.json','./content/glossary-v1.json','./content/help-faq-v1.json','./content/sample-cases-v1.json','./content/domain-lenses-v1.json','./content/domain-catalog-v1.json','./content/lens-education.json','./content/lens-commerce.json','./content/lens-saas.json','./content/locale-en-v1.json'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) {
    return c.addAll(ASSETS).catch(function (error) { return caches.delete(V).then(function () { throw error; }); });
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
  // One complete version is served together; installing a newer worker refreshes it.
  // Offline startup must not wait for network requests that can remain pending.
  e.respondWith(caches.open(V).then(function (cache) {
    return cache.match(e.request, {ignoreSearch:isKnownStatic}).then(function (cached) {
      if (cached && isKnownStatic) return cached;
      return fetch(e.request).then(function (response) { return response; }).catch(function () {
        if (cached) return cached;
        return e.request.mode === 'navigate' ? cache.match('./m/') : Response.error();
      });
    });
  }));
});
