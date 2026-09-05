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
    var items = [['pc', 'PC 웹', URLS.pc], ['mobile', '모바일', URLS.mobile], ['workbench', '고급 작업대', URLS.base + 'workbench/'], ['dash', '진척 대시보드', URLS.dash], ['spec', '기획서', URLS.spec]];
    var rel = { pc: (active === 'mobile' ? '../' : './'), mobile: (active === 'mobile' ? './' : 'm/'),
                workbench: (active === 'mobile' ? '../workbench/' : 'workbench/'),
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

  /* 모든 화면에서 정책·삭제 경로를 같은 위치에 노출한다. */
  function injectLegalFooter() {
    if (document.querySelector('.crh-legal-footer')) return;
    var css = '.crh-legal-footer{display:flex;gap:12px;justify-content:center;align-items:center;flex-wrap:wrap;padding:18px 16px 22px;border-top:1px solid rgba(127,127,127,.24);font:12px/1.5 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:var(--ink-2,var(--ink2,#555));background:rgba(127,127,127,.04)}'
      + '.crh-legal-footer a{color:inherit;text-decoration:underline;text-underline-offset:2px}';
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    var f = document.createElement('footer'); f.className = 'crh-legal-footer';
    f.innerHTML = '<span>beta 1.0.0 콘텐츠·UX/UI 1단계 후보</span><a href="' + URLS.base + 'workbench/">고급 작업대</a><a href="' + URLS.base + 'samples/">완성 샘플</a><a href="' + URLS.base + 'glossary/">용어집</a><a href="' + URLS.base + 'learn/">학습 자료실</a><a href="' + URLS.base + 'feedback/">사용성 의견</a><a href="' + URLS.base + 'status/">운영 상태</a><a href="' + URLS.base + 'support/">지원</a><a href="' + URLS.base + 'advertising/">광고 운영 원칙</a><a href="' + URLS.base + 'help/">도움말</a><a href="' + URLS.base + 'terms/">이용약관</a>'
      + '<a href="' + URLS.base + 'privacy/">개인정보 처리방침</a>'
      + '<a href="' + URLS.base + 'help/account/">계정 도움말</a>'
      + '<a href="' + URLS.base + 'account/delete/">계정·데이터 삭제</a>';
    document.body.appendChild(f);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectLegalFooter);
  else injectLegalFooter();

  /* QR 그리기 */
  W.CRH_qr = function (text, opt) {
    if (!W.QRLite) return '<span style="font-size:11px;color:#888">QR 생성기 미로드</span>';
    try { return W.QRLite.svg(text, opt || { scale: 3, ecl: 'M' }); }
    catch (e) { return '<span style="font-size:11px;color:#c00">QR 실패: ' + e.message + '</span>'; }
  };

  /* 새 서비스 작업자 판은 사용자가 눌렀을 때만 전환한다. */
  function showUpdate(registration) {
    if (!registration || !registration.waiting || document.getElementById('crhUpdateReady')) return;
    var box = document.createElement('div'); box.id = 'crhUpdateReady'; box.setAttribute('role', 'status');
    box.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:120;max-width:680px;margin:auto;padding:12px 14px;border:1px solid rgba(127,127,127,.4);border-radius:10px;background:var(--panel,#fff);color:var(--ink,#111);box-shadow:0 8px 30px rgba(0,0,0,.22);font:13px/1.45 system-ui';
    box.innerHTML = '<b>업데이트가 준비되었습니다.</b> 현재 입력을 JSON으로 저장한 뒤 새 판을 열 수 있습니다. <button type="button" style="margin-left:8px;padding:6px 10px">새 판 열기</button>';
    box.querySelector('button').addEventListener('click', function () { registration.waiting.postMessage({ type: 'CRH_SKIP_WAITING' }); });
    document.body.appendChild(box);
  }
  if ('serviceWorker' in navigator && D.live) {
    navigator.serviceWorker.addEventListener('controllerchange', function () { location.reload(); });
    navigator.serviceWorker.ready.then(function (registration) {
      showUpdate(registration);
      registration.addEventListener('updatefound', function () {
        var worker = registration.installing; if (!worker) return;
        worker.addEventListener('statechange', function () { if (worker.state === 'installed') showUpdate(registration); });
      });
    }).catch(function () {});
  }
})();
