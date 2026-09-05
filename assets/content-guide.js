(function () {
  'use strict';
  var mobile = /\/m\/?(?:index\.html)?$/.test(location.pathname);
  var base = mobile ? '../' : './';
  var contentById = new Map();
  var gateById = new Map();

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  function dateText(item) {
    return '내용 검토 ' + esc(item.reviewedAt || '미확인') + ' · 다음 검토 ' + esc(item.nextReviewAt || '미확인')
      + ' · 담당 ' + esc(item.ownerRole || '미정');
  }

  function decorate(root) {
    if (!contentById.size) return;
    (root || document).querySelectorAll('[data-item-id]').forEach(function (card) {
      if (card.querySelector('.crh-guide')) return;
      var item = contentById.get(card.dataset.itemId);
      if (!item) return;
      var gate = gateById.get(item.id);
      var details = document.createElement('details');
      details.className = 'crh-guide';
      details.innerHTML = '<summary>쉬운 설명·증거·해결 방법 보기</summary><div class="crh-guide-grid">'
        + '<div><b>왜 중요한가</b>' + esc(item.whyImportant) + '</div>'
        + '<div><b>가장 작은 행동</b>' + esc(item.smallestAction) + '</div>'
        + '<div><b>좋은 증거</b>' + esc(item.goodEvidence) + '</div>'
        + '<div><b>피해야 할 증거</b>' + esc(item.badEvidence) + '</div>'
        + '<div><b>완료 조건</b>' + esc(item.completionCondition) + '</div>'
        + '<div><b>재검증</b>' + esc(item.reverify) + '</div></div>'
        + (gate ? '<section class="crh-gate-help"><h4>필수 통과 조건 해결 순서</h4><p>' + esc(gate.failureImpact) + '</p><ol>'
          + gate.fixSteps.map(function (step) { return '<li>' + esc(step) + '</li>'; }).join('') + '</ol></section>' : '')
        + '<p class="crh-content-meta">' + dateText(item) + '</p>'
        + '<p class="crh-security"><b>증거 보안:</b> ' + esc(item.forbiddenSecrets) + '</p>';
      card.appendChild(details);
    });
  }

  function selectTab(name) {
    var button = mobile
      ? document.querySelector('#nav [data-p="' + name + '"]')
      : document.querySelector('.tabs .tab[data-t="' + name + '"]');
    if (!button) return;
    button.click();
    window.setTimeout(function () {
      var panel = document.getElementById('p-' + name);
      if (panel) { panel.scrollIntoView({behavior:'smooth', block:'start'}); panel.setAttribute('tabindex', '-1'); panel.focus({preventScroll:true}); }
    }, 40);
  }

  function importPrevious() {
    var button = document.getElementById(mobile ? 'bLoad' : 'btnImport');
    var file = document.getElementById(mobile ? 'fIn' : 'fileIn');
    if (button) button.click(); else if (file) file.click();
  }

  function savePreferences(box) {
    var data = {};
    box.querySelectorAll('input:checked').forEach(function (input) { data[input.name] = input.value; });
    try { localStorage.setItem('crh-onboarding-v1', JSON.stringify(data)); } catch (e) {}
    var role={solo:'핵심 사용자 여정과 가장 큰 위험 3개부터 확인하세요.',team:'역할별 증거 담당을 정하고 실행 보드에 기한을 기록하세요.',quality:'필수 통과 조건과 만료된 증거부터 재검증하세요.',partner:'자가 신고와 외부 검증을 분리한 결과를 JSON으로 공유하세요.'};
    var advice=box.querySelector('.crh-role-advice');
    if(advice)advice.textContent=(role[data['crh-role']]||'')+' 선택한 플랫폼: '+({web:'PC 웹',mobile:'모바일',all:'모바일과 PC 웹'}[data['crh-platform']]||'둘 다')+'. 점수는 플랫폼별 진단에서 따로 입력합니다.';
  }

  function restorePreferences(box) {
    try {
      var data = JSON.parse(localStorage.getItem('crh-onboarding-v1') || '{}');
      Object.keys(data).forEach(function (name) {
        var input = box.querySelector('input[name="' + name + '"][value="' + data[name] + '"]');
        if (input) input.checked = true;
      });
    } catch (e) {}
  }

  function addOnboarding() {
    if (document.querySelector('.crh-start')) return;
    var box = document.createElement('aside');
    box.className = 'crh-start';
    box.setAttribute('aria-labelledby', 'crh-start-title');
    box.innerHTML = '<div class="crh-start-copy"><p class="crh-eyebrow">처음 3분</p><h2 id="crh-start-title">내 서비스의 출시 위험부터 찾기</h2>'
      + '<p>역할과 현재 단계를 고르면 같은 197개 기준에서도 지금 볼 항목을 더 쉽게 이해할 수 있습니다. 선택 내용은 이 브라우저에만 저장됩니다.</p></div>'
      + '<div class="crh-start-fields">'
      + '<fieldset><legend>나는 누구인가요?</legend><label><input type="radio" name="crh-role" value="solo" checked> 1인 개발자</label><label><input type="radio" name="crh-role" value="team"> 스타트업 팀</label><label><input type="radio" name="crh-role" value="quality"> 품질·운영</label><label><input type="radio" name="crh-role" value="partner"> 투자·제휴</label></fieldset>'
      + '<fieldset><legend>현재 단계</legend><label><input type="radio" name="crh-stage" value="idea"> 아이디어</label><label><input type="radio" name="crh-stage" value="build" checked> 개발 중</label><label><input type="radio" name="crh-stage" value="beta"> 베타</label><label><input type="radio" name="crh-stage" value="launch"> 출시 전</label><label><input type="radio" name="crh-stage" value="operate"> 운영 중</label></fieldset>'
      + '<fieldset><legend>확인할 화면</legend><label><input type="radio" name="crh-platform" value="mobile"> 모바일</label><label><input type="radio" name="crh-platform" value="web"> PC 웹</label><label><input type="radio" name="crh-platform" value="all" checked> 둘 다</label></fieldset></div>'
      + '<div class="crh-start-actions"><button type="button" class="crh-primary" data-crh-action="start">3분 진단 시작</button>'
      + '<a href="' + base + 'samples/">완성 샘플 보기</a><button type="button" data-crh-action="load">이전 결과 불러오기</button>'
      + '<a href="' + base + 'help/">처음 사용법</a></div>'
      + '<p class="crh-role-advice" role="status"></p><a href="' + base + 'en/" lang="en">English assessment · 197 checkpoints</a>'
      + '<p class="crh-limit">점수는 법률 자문·준수 인증·앱마켓 승인 또는 출시 허가가 아닙니다.</p>';
    var target = document.querySelector('.wrap') || document.body.firstElementChild;
    target.parentNode.insertBefore(box, target);
    restorePreferences(box);
    savePreferences(box);
    box.addEventListener('change', function () { savePreferences(box); });
    box.querySelector('[data-crh-action="start"]').addEventListener('click', function () { savePreferences(box); selectTab('quick'); });
    box.querySelector('[data-crh-action="load"]').addEventListener('click', importPrevious);
  }

  function groupDesktopNavigation() {
    if (mobile) return;
    var tabs = document.querySelector('.tabs');
    if (!tabs || tabs.dataset.crhGrouped) return;
    var groups = [
      {label:'진단', items:['quick','dir','assess']},
      {label:'결과', items:['dash','bench']},
      {label:'실행', items:['gap']},
      {label:'도움말', items:['method','deploy']}
    ];
    groups.forEach(function (group) {
      var wrapper = document.createElement('div');
      wrapper.className = 'crh-nav-group'; wrapper.dataset.navGroup = group.label;
      var label = document.createElement('span'); label.className = 'crh-nav-label'; label.textContent = group.label; wrapper.appendChild(label);
      group.items.forEach(function (name) {
        var button = tabs.querySelector('.tab[data-t="' + name + '"]');
        if (button) wrapper.appendChild(button);
      });
      tabs.appendChild(wrapper);
    });
    tabs.dataset.crhGrouped = 'true';
  }

  function addServiceState() {
    if (document.querySelector('.crh-service-state')) return;
    var state = document.createElement('div'); state.className = 'crh-service-state'; state.setAttribute('role', 'status'); state.setAttribute('aria-live', 'polite');
    function render() {
      if (navigator.onLine) { state.hidden = true; state.textContent = ''; }
      else { state.hidden = false; state.innerHTML = '<b>오프라인입니다.</b> 현재 입력은 이 브라우저에 남습니다. 연결 후 다시 시도하고 중요한 결과는 JSON으로 백업하세요. <a href="' + base + 'help/states/">해결 방법</a>'; }
    }
    document.body.insertBefore(state, document.body.firstChild);
    window.addEventListener('online', render); window.addEventListener('offline', render); render();
  }

  function addEntryPoints() {
    if (!document.querySelector('.crh-workbench-link')) {
      var link = document.createElement('a'); link.className = 'crh-workbench-link'; link.href = base + 'workbench/'; link.textContent = '고급 작업대'; document.body.appendChild(link);
    }
    addOnboarding(); groupDesktopNavigation(); addServiceState();
    var results=document.getElementById('p-dash');
    if(results&&!results.querySelector('.crh-result-next')){var next=document.createElement('aside');next.className='crh-result-next crh-start';next.innerHTML='<h2>점수 다음은 출시 조건과 실행입니다</h2><p>PC·모바일·개발·운영의 미확인을 따로 확인하고, 상위 문제부터 재검증하세요. 아래 링크는 현재 진단을 이 브라우저의 작업대로 전달합니다.</p><a href="'+base+'workbench/">현재 진단으로 4축 출시 여권·실행 보드 열기</a>';results.insertBefore(next,results.firstChild);}
  }
  document.addEventListener('click',function(event){var link=event.target.closest('a');if(!link||!new URL(link.href,location.href).pathname.endsWith('/workbench/'))return;try{if(typeof S!=='undefined'&&S&&S.scores)localStorage.setItem('crh-active-assessment-v1',JSON.stringify(S));}catch(error){event.preventDefault();var status=document.querySelector('.crh-service-state');if(status){status.hidden=false;status.textContent='작업대로 전달할 저장 공간이 부족합니다. 먼저 JSON 백업을 내려받으세요.';}}},true);

  Promise.all([
    fetch(base + 'content/content-guide-v2.json').then(function (r) { if (!r.ok) throw new Error('content'); return r.json(); }),
    fetch(base + 'content/gate-guides.json').then(function (r) { if (!r.ok) throw new Error('gates'); return r.json(); })
  ]).then(function (values) {
    values[0].items.forEach(function (item) { contentById.set(item.id, item); });
    values[1].guides.forEach(function (guide) { gateById.set(guide.id, guide); });
    decorate(document);
    new MutationObserver(function (records) {
      records.forEach(function (record) { record.addedNodes.forEach(function (node) { if (node.nodeType === 1) decorate(node); }); });
    }).observe(document.body, {childList:true, subtree:true});
  }).catch(function () {
    var state = document.querySelector('.crh-service-state');
    if (state) { state.hidden = false; state.innerHTML = '<b>설명 자료를 불러오지 못했습니다.</b> 입력한 값은 지워지지 않습니다. 연결을 확인하고 새로고침하거나 <a href="' + base + 'help/states/">복구 방법</a>을 확인하세요.'; }
  });
  addEntryPoints();
})();
