/* 오프라인 지원 — 앱 껍데기를 임시 저장(캐시)해 두고 네트워크 실패 시 되돌려준다 */
var V = 'crh-beta-v4';
var ASSETS = ['./','./index.html','./m/','./m/index.html','./dashboard.html',
  './terms/','./privacy/','./account/delete/','./robots.txt','./sitemap.xml',
  './assets/qr.js','./assets/shell.js','./assets/legal.css','./manifest.webmanifest',
  './assets/icon-192.png','./assets/icon-512.png','./progress.json','./persona-report.json',
  './lens/lens-core-v2.1.json','./lens/lens-eu-v1.0.json','./lens/lens-us-v1.0.json'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) {
    return Promise.all(ASSETS.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (r) {
      var cp = r.clone();
      caches.open(V).then(function (c) { c.put(e.request, cp).catch(function () {}); });
      return r;
    }).catch(function () { return caches.match(e.request).then(function (m) { return m || caches.match('./m/'); }); })
  );
});
