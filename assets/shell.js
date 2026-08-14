/* 공통 셸 — 배포 주소 자동 인식, 상단 이동줄, QR 그리기 */
(function () {
  'use strict';
  var W = window;

  /* 배포 주소 자동 인식: 인터넷에 공개된 상태면 실제 주소를, 파일로 열었으면 예약 주소를 쓴다 */
  function detectBase() {
    var live = location.protocol === 'http:' || location.protocol === 'https:';
    if (live) {
      var p = location.pathname.replace(/\/(index\.html|dashboard\.html|m\/?(index\.html)?)?$/, '/');
      if (!p.endsWith('/')) p += '/';
      if (p.endsWith('/m/')) p = p.slice(0, -2);
      return { base: location.origin + p, live: true };
    }
    var acct = (W.CRH_ACCOUNT || 'YOUR-GITHUB-ID');
    var repo = (W.CRH_REPO || 'readiness-hub');
    return { base: 'https://' + acct + '.github.io/' + repo + '/', live: false };
  }
  var D = detectBase();
  var URLS = {
    live: D.live,
    base: D.base,
    pc: D.base,
    mobile: D.base + 'm/',
    dash: D.base + 'dashboard.html',
    lens: D.base + 'lens/lens-core-v2.1.json',
    spec: D.base + 'spec.html'
  };
  W.CRH_URLS = URLS;

  /* 상단 이동줄 */
  function navBar(active) {
    var items = [['pc', 'PC 웹', URLS.pc], ['mobile', '모바일', URLS.mobile], ['dash', '진척 대시보드', URLS.dash], ['spec', '기획서', URLS.spec]];
    var rel = { pc: (active === 'mobile' ? '../' : './'), mobile: (active === 'mobile' ? './' : 'm/'),
                dash: (active === 'mobile' ? '../dashboard.html' : 'dashboard.html'),
                spec: (active === 'mobile' ? '../spec.html' : 'spec.html') };
    return '<nav class="crh-nav"><span class="crh-brand">상업화 준비도 허브 <b>β</b></span>'
      + items.map(function (it) {
        return '<a href="' + rel[it[0]] + '"' + (active === it[0] ? ' aria-current="page"' : '') + '>' + it[1] + '</a>';
      }).join('')
      + '<span class="crh-live">' + (URLS.live ? '● 공개 주소로 실행 중' : '○ 파일로 실행 중 — 공개 전') + '</span></nav>';
  }
  function injectNav(active) {
    var css = '.crh-nav{display:flex;gap:2px;align-items:center;padding:7px 16px;background:var(--ink,#0b0b0b);color:#fff;font-size:12.5px;flex-wrap:wrap}'
      + '.crh-nav .crh-brand{font-weight:700;margin-right:12px;letter-spacing:-.01em}'
      + '.crh-nav .crh-brand b{color:#7fb3f0}'
      + '.crh-nav a{color:#c9c8c2;text-decoration:none;padding:4px 11px;border-radius:6px}'
      + '.crh-nav a:hover{background:rgba(255,255,255,.12);color:#fff}'
      + '.crh-nav a[aria-current]{background:#fff;color:#0b0b0b;font-weight:650}'
      + '.crh-nav .crh-live{margin-left:auto;opacity:.7;font-size:11.5px}';
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    var d = document.createElement('div'); d.innerHTML = navBar(active);
    document.body.insertBefore(d.firstChild, document.body.firstChild);
  }
  W.CRH_injectNav = injectNav;

  /* QR 그리기 */
  W.CRH_qr = function (text, opt) {
    if (!W.QRLite) return '<span style="font-size:11px;color:#888">QR 생성기 미로드</span>';
    try { return W.QRLite.svg(text, opt || { scale: 3, ecl: 'M' }); }
    catch (e) { return '<span style="font-size:11px;color:#c00">QR 실패: ' + e.message + '</span>'; }
  };
})();
