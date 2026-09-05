(function () {
  'use strict';
  var STORE_KEY = 'crh-workbench-v1';
  var ACTIVE_KEY = 'crh-active-assessment-v1';
  var THEME_KEY = 'crh-theme-v1';
  var contract = window.CRH_WORKBENCH_CONTRACTS;
  var storeError = '';
  var selectedLens = null;
  var contentLimit = 40;
  var data = { content: null, gates: null, glossary: null, faq: null, cases: null, lenses: null, catalog: null, lens: null };
  var store = loadStore();

  function emptyStore() {
    return { schema: 'crh-workbench/v2', activeProjectId: '', projects: [], evidence: [], gaps: [], comparators: [], activities: [], snapshots: [], profile: { operatorConfirmed: false, androidConfirmed: false, recoveryConfirmed: false } };
  }
  function loadStore() {
    try {
      var raw=localStorage.getItem(STORE_KEY);
      var loaded = Object.assign(emptyStore(), raw ? contract.validateStore(JSON.parse(raw)) : {});
      var legacy = { todo:'new', doing:'in_progress', review:'ready_for_review', done:'done' };
      loaded.gaps = (loaded.gaps || []).map(function (gap) {
        if (legacy[gap.status]) gap.status = legacy[gap.status];
        gap.itemId = gap.itemId || gap.platform || 'general';
        gap.sourceEvidenceIds = gap.sourceEvidenceIds || (gap.evidenceId ? [gap.evidenceId] : []);
        gap.history = gap.history || [{ at:gap.createdAt || new Date().toISOString(), from:null, to:gap.status || 'new', by:'migration', reason:'v1 기록 호환' }];
        if (gap.status === 'done' && !gap.reverification && gap.verifiedAt) gap.status = 'ready_for_review';
        return gap;
      });
      loaded.schema = 'crh-workbench/v2';
      ['evidence','gaps','comparators'].forEach(function (key) {
        loaded[key].forEach(function (row) { if (!row.projectId) row.projectId = loaded.projects.length === 1 ? loaded.projects[0].id : loaded.projects.length ? 'legacy-unassigned' : 'local'; });
      });
      return loaded;
    }
    catch (_) { storeError = '저장 자료가 손상되어 읽기 전용으로 보호 중입니다. 원본을 백업하고 복원하세요.'; return emptyStore(); }
  }
  function saveStore(message) {
    if (storeError) throw new Error(storeError);
    ['evidence','gaps','comparators'].forEach(function (key) { store[key].forEach(function (row) { if (!row.projectId) row.projectId = store.activeProjectId || 'local'; }); });
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    if (message) {
      store.activities.unshift({ at: new Date().toISOString(), message: message });
      store.activities = store.activities.slice(0, 100);
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    }
  }
  function activeAssessment() {
    var project = store.projects.find(function (p) { return p.id === store.activeProjectId; });
    if (project) return project.assessment;
    try { return JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null'); }
    catch (_) { return null; }
  }
  function scoped(key) { return contract.scoped(store[key] || [], store.activeProjectId); }
  function verificationFor(axis){var project=store.projects.find(function(p){return p.id===store.activeProjectId;})||store,record=(project.releaseChecks||{})[axis],evidence=record&&scoped('evidence').find(function(e){return e.id===record.evidenceId;});var valid=Boolean(record&&contract.validDate(record.observedAt)&&evidence&&evidenceState(evidence)==='valid'&&record.method===({web:'browser',mobile:'physical-device',development:'automatic',operations:'operator',recovery:'restore'})[axis]);return {verified:valid,observedAt:valid?record.observedAt:null,evidenceCounts:{valid:valid?1:0}};}
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]; }); }
  function id(prefix) { return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); }
  function download(value, name) {
    var blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function fmtDate(value) {
    if (!value) return '미확인';
    var d = new Date(value); return isNaN(d) ? '미확인' : d.toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
  }

  Promise.all([
    'content-guide-v2.json','gate-guides.json','glossary-v1.json','help-faq-v1.json','sample-cases-v1.json','domain-lenses-v1.json','domain-catalog-v1.json'
  ].map(function (name) { return fetch('../content/' + name).then(function (r) { if (!r.ok) throw new Error(name); return r.json(); }); }))
    .then(function (values) {
      data.content = values[0]; data.gates = values[1]; data.glossary = values[2]; data.faq = values[3]; data.cases = values[4]; data.lenses = values[5]; data.catalog = values[6];
      return fetch('../lens/lens-core-v2.1.json').then(function (r) { return r.json(); });
    }).then(function (lens) {
      data.lens = lens;
      document.getElementById('notice').textContent = '197개 가이드, 필수 조건 40개, 500개 도메인 카탈로그를 이 기기에서 사용할 준비가 됐습니다.';
      if (!storeError) seedFromAssessment(); renderAll();
      if (storeError) document.getElementById('notice').textContent = storeError;
    }).catch(function (error) {
      document.getElementById('notice').textContent = '일부 자료를 불러오지 못했습니다. 인터넷 연결 후 새로고침해 주세요: ' + error.message;
      renderAll();
    });

  function seedFromAssessment() {
    var assessment = activeAssessment();
    if (!assessment || store.projects.length) return;
    var project = { id: id('project'), name: assessment.svc || '내 첫 프로젝트', updatedAt: new Date().toISOString(), assessment: assessment };
    store.projects.push(project); store.activeProjectId = project.id;
    saveStore('현재 진단을 첫 프로젝트로 가져왔습니다.');
  }

  function scoreStats(assessment, pf) {
    return contract.scoreStats(assessment, pf, data.lens);
  }

  function renderOverview() {
    var checks={web:verificationFor('web'),mobile:verificationFor('mobile'),development:verificationFor('development'),operations:verificationFor('operations'),recovery:verificationFor('recovery')};
    var profile={androidConfirmed:checks.mobile.verified,operatorConfirmed:checks.operations.verified,recoveryConfirmed:checks.recovery.verified};
    var assessment = activeAssessment();
    var mobile = scoreStats(assessment, 'mobile'), web = scoreStats(assessment, 'web');
    var validEvidence = scoped('evidence').filter(function (e) { return evidenceState(e) === 'valid'; }).length;
    var unverifiedGaps = scoped('gaps').filter(function (g) { return g.status !== 'done' || !g.reverification; }).length;
    var passport = window.CRH_RELEASE_PASSPORT.build({
      web: Object.assign({ missing:web.progress >= 95 ? [] : ['진단 진행률 95% 미만'], blockers:web.gateFail ? ['필수 조건 '+web.gateFail+'개 미통과'] : [] },checks.web),
      mobile: Object.assign({ missing:[mobile.progress >= 95 ? '' : '진단 진행률 95% 미만', profile.androidConfirmed ? '' : 'Android 실기기 미확인'], blockers:mobile.gateFail ? ['필수 조건 '+mobile.gateFail+'개 미통과'] : [] },checks.mobile),
      development: Object.assign({ missing:validEvidence ? [] : ['유효 증거 없음'], blockers:unverifiedGaps ? ['재검증 대기 '+unverifiedGaps+'건'] : [] },checks.development),
      operations: Object.assign({ missing:[profile.operatorConfirmed ? '' : '운영 주체·문의 미확인', profile.recoveryConfirmed ? '' : '복원 증거 미확인'] },checks.operations)
    });
    var values = {
      'PC 웹': web.score == null ? '미평가' : web.score + '점 · 자가 입력',
      '모바일/PWA': mobile.score == null ? '미평가' : mobile.score + '점 · 자가 입력',
      '개발·보안': validEvidence + '개 유효',
      '운영·상용화': profile.operatorConfirmed && profile.recoveryConfirmed ? '사용자 확인 기록' : '미확인'
    };
    var axes = passport.axes.map(function (x) {
      var css = x.state === '통과' ? 'good' : x.state === '조건부 통과' ? 'warn' : 'bad';
      var detail = x.blockers.concat(x.missing).join(' · ') || '필수 증거 확인';
      return { name:x.name, value:values[x.name], state:css, stateText:x.state, desc:detail };
    });
    var complete = passport.ready;
    var decision = document.getElementById('releaseDecision');
    decision.textContent = complete ? '입력한 증거 기준 통과 · 독립 인증 아님' : '판정 보류 · 미확인 존재';
    decision.className = 'decision ' + (complete ? 'good' : 'bad');
    document.getElementById('passportGrid').innerHTML = axes.map(function (x) {
      return '<article class="passport"><b>' + esc(x.name) + '</b><div class="state ' + x.state + '">' + esc(x.stateText) + ' · ' + esc(x.value) + '</div><p>' + esc(x.desc) + '</p></article>';
    }).join('');
    var actions = [];
    if (web.progress < 95) actions.push('PC 웹 진단 증거를 95% 이상 채우기');
    if (mobile.progress < 95) actions.push('모바일 진단 증거를 95% 이상 채우기');
    if (!profile.androidConfirmed) actions.push('유휴 Android 한 대에서 설치·터치·오프라인 시험하기');
    if (!profile.operatorConfirmed) actions.push('운영 주체·문의·무료 범위를 실제 사실로 확인하기');
    if (!profile.recoveryConfirmed) actions.push('백업을 새 환경에 복원하고 결과 기록하기');
    if (unverifiedGaps) actions.push('실행 보드 ' + unverifiedGaps + '건을 증거와 함께 재검증하기');
    document.getElementById('topActions').innerHTML = actions.length ? '<ol>' + actions.slice(0, 6).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' : '<p class="state good">현재 작업대에 기록된 출시 조건이 모두 확인됐습니다.</p>';
  }

  function renderProjects() {
    var host = document.getElementById('projectList');
    if (!store.projects.length) { host.innerHTML = '<div class="panel">저장된 프로젝트가 없습니다. PC 또는 모바일 진단을 시작한 뒤 현재 진단을 저장하세요.</div>'; }
    else host.innerHTML = store.projects.map(function (p) {
      var active = p.id === store.activeProjectId;
      return '<article class="project-card"><h2>' + esc(p.name) + (active ? ' <span class="pill valid">현재</span>' : '') + '</h2><div class="meta">마지막 변경 ' + esc(fmtDate(p.updatedAt)) + '</div><div class="card-actions"><button data-project-load="' + esc(p.id) + '">열기</button><button data-project-copy="' + esc(p.id) + '">복제</button><button data-project-export="' + esc(p.id) + '">내보내기</button><button data-project-delete="' + esc(p.id) + '">삭제</button></div></article>';
    }).join('');
    var act = document.getElementById('activityList');
    act.innerHTML = store.activities.length ? store.activities.slice(0, 30).map(function (a) { return '<li><time>' + esc(fmtDate(a.at)) + '</time> · ' + esc(a.message) + '</li>'; }).join('') : '<li>아직 작업 기록이 없습니다.</li>';
  }

  function evidenceState(item) {
    return contract.evidenceState(item);
  }
  function renderEvidence() {
    var term = document.getElementById('evidenceSearch').value.trim().toLowerCase();
    var state = document.getElementById('evidenceState').value;
    var list = scoped('evidence').filter(function (e) { return (state === 'all' || evidenceState(e) === state) && (!term || JSON.stringify(e).toLowerCase().includes(term)); });
    document.getElementById('evidenceList').innerHTML = list.length ? '<table><thead><tr><th>항목</th><th>근거</th><th>확인일</th><th>상태</th><th>담당</th><th></th></tr></thead><tbody>' + list.map(function (e) {
      var st = evidenceState(e); var source = /^https?:\/\//.test(e.source || '') ? '<a href="' + esc(e.source) + '" target="_blank" rel="noopener">원본 열기</a>' : esc(e.source || '로컬 기록');
      return '<tr><td><b>' + esc(e.itemId || '일반') + '</b><br>' + esc(e.title) + '<br><small>ID: ' + esc(e.id) + '</small></td><td>' + source + '<br><small>' + esc(e.note) + '</small></td><td>' + esc(e.observedAt || '미확인') + '</td><td><span class="pill ' + st + '">' + ({valid:'유효',soon:'만료 임박',expired:'만료',unavailable:'원본 접근 실패'})[st] + '</span></td><td>' + esc(e.owner || '미지정') + '</td><td><button data-evidence-renew="' + esc(e.id) + '">재확인</button><button data-evidence-unavailable="' + esc(e.id) + '">접근 실패 기록</button><button data-evidence-delete="' + esc(e.id) + '">삭제</button></td></tr>';
    }).join('') + '</tbody></table>' : '<div class="panel">조건에 맞는 증거가 없습니다.</div>';
  }

  var columns = [['new','미시작'],['in_progress','진행'],['ready_for_review','검토 준비'],['reverifying','재검증 중'],['done','재검증 완료'],['blocked','차단']];
  function renderGaps() {
    document.getElementById('gapBoard').innerHTML = columns.map(function (col) {
      var cards = scoped('gaps').filter(function (g) { return g.status === col[0]; });
      return '<section class="column"><h2>' + col[1] + ' · ' + cards.length + '</h2>' + (cards.length ? cards.map(function (g) {
        var paths = window.CRH_GAP_LIFECYCLE && window.CRH_GAP_LIFECYCLE.PATHS[g.status] || [];
        var sourceIds = g.sourceEvidenceIds || [];
        return '<article class="gap-card"><h3>' + esc(g.title) + '</h3><p>' + esc(g.why || '완료 조건과 검증 방법을 기록하세요.') + '</p><p><b>항목</b> ' + esc(g.itemId) + ' · <b>담당</b> ' + esc(g.assignee || g.owner || '미지정') + ' · <b>기한</b> ' + esc(g.dueDate || g.due || '없음') + '</p><p><b>완료 조건</b> ' + esc(g.acceptanceCheck || '재검증 전후 점수와 남은 위험 기록') + '</p><select data-gap-status="' + esc(g.id) + '">' + columns.map(function (x) { var allowed=x[0]===g.status||paths.includes(x[0])&&x[0]!=="done"&&x[0]!=="blocked"; return '<option value="' + x[0] + '" ' + (g.status === x[0] ? 'selected' : '') + (!allowed ? ' disabled' : '') + '>' + x[1] + '</option>'; }).join('') + '</select><input data-gap-verify="' + esc(g.id) + '" placeholder="근거 ID" value="' + esc(sourceIds[0] || '') + '"><div class="card-actions"><button data-gap-reverify="' + esc(g.id) + '">재검증 완료 기록</button><button data-gap-block="' + esc(g.id) + '">차단 사유 기록</button><button data-gap-delete="' + esc(g.id) + '">삭제</button></div>' + (g.reverification ? '<p class="state good">재검증 ' + esc(fmtDate(g.reverification.observedAt)) + ' · ' + esc(g.reverification.beforeScore) + '→' + esc(g.reverification.afterScore) + '</p>' : '') + (g.blockerReason ? '<p class="state bad">차단: ' + esc(g.blockerReason) + '</p>' : '') + '</article>';
      }).join('') : '<p class="lead">항목 없음</p>') + '</section>';
    }).join('');
  }

  var benchmarkDimensions = ['features','ux','performance','trust','reach','price','monetization','localization'];
  function calculateBenchmark(ours, rows) {
    return import('../engine/benchmark-evidence.mjs').then(function (engine) { return engine.compareEvidence(ours, rows); });
  }
  function renderBenchmark() {
    var rows=scoped('comparators'),host=document.getElementById('benchmarkList'); if(!host)return;
    host.innerHTML=rows.length?'<table><thead><tr><th>서비스</th><th>유형</th><th>관찰 근거</th><th>확인일</th><th>신뢰도</th><th></th></tr></thead><tbody>'+rows.map(function(row){return'<tr><td>'+esc(row.name)+'</td><td>'+esc(row.type)+'</td><td><a href="'+esc(row.observedUrl)+'" target="_blank" rel="noopener">원본 열기</a></td><td>'+esc(row.observedAt)+'</td><td>'+esc(row.confidence)+'</td><td><button data-comparator-delete="'+esc(row.id)+'">삭제</button></td></tr>'}).join('')+'</tbody></table>':'<div class="panel">비교 서비스가 없습니다. 3개 미만에서는 상대 위치를 계산하지 않습니다.</div>';
    document.getElementById('benchmarkStatus').textContent='비교 근거 '+rows.length+'/3 · '+(rows.length<3?'계산 불가':'최소 개수 충족 · 날짜·중복·공통 축 추가 검사 필요');
  }

  async function classify() {
    var text = document.getElementById('serviceDescription').value.toLowerCase().trim();
    if (!text || !data.catalog) { document.getElementById('domainResults').innerHTML = '<div class="notice">서비스 설명을 두 문장 이상 입력해 주세요.</div>'; return; }
    try {
      var engine=await import('../engine/domain-classifier.mjs'),result=engine.classifyDomain({description:text},data.catalog);
      var ranked=result.primary?[result.primary].concat(result.secondary):[];
      document.getElementById('domainResults').innerHTML = ranked.length ? ranked.map(function (x, i) { return '<article class="domain-result"><small>' + (i ? '보조 후보' : '주 후보') + ' · 카탈로그 ID ' + x.rank + '</small><b>' + esc(x.name) + '</b><span>문구 일치 지표 ' + x.confidence + '/100 · 검색어 ' + esc(x.searchTerm) + '</span><p>일치 단서: ' + esc(x.matchedTerms.join(', ')) + '</p><p>시장 순위·확률이 아닙니다. 공식 자료를 확인해 비교 작업대에 입력하세요.</p></article>'; }).join('') : '<div class="notice">직접 일치하는 후보가 없습니다. 문제·사용자·핵심 행동을 더 구체적으로 적어 주세요.</div>';
    } catch(error) { document.getElementById('domainResults').textContent='분류 실패: '+error.message; }
  }
  function renderLenses() {
    var host = document.getElementById('lensCards');
    if (!data.lenses) return;
    host.innerHTML = data.lenses.lenses.map(function (l) { return '<article class="lens-card"><h2>' + esc(l.name) + '</h2><p>' + esc(l.description) + '</p><p><b>우선 항목</b> ' + esc(l.priorityItems.join(', ')) + '</p><details><summary>업종별 보충 질문 · '+(l.checks||[]).length+'개</summary>'+(l.checks||[]).map(function(c){return '<h3>'+esc(c.question)+'</h3><p>증거: '+esc(c.evidence)+'</p><p>첫 행동: '+esc(c.action)+'</p><small>공통 기준 '+esc(c.itemId)+'</small>';}).join('')+'<p>'+esc(l.benchmarkStatus)+'</p><p>검토 '+esc(l.reviewedAt)+' · 다음 '+esc(l.nextReviewAt)+'</p></details><button data-lens="' + esc(l.id) + '">이 기준으로 가이드 보기</button></article>'; }).join('');
  }

  function recommendations() {
    var focus = document.getElementById('advisorFocus').value;
    var assessment = activeAssessment() || {};
    var candidates = [];
    if (data.content) data.content.items.forEach(function (item) {
      ['mobile','web'].forEach(function (pf) {
        if (focus === 'mobile' && pf !== 'mobile' || focus === 'web' && pf !== 'web') return;
        if (focus === 'gates' && !item.gate) return;
        if (item.platform !== 'C' && item.platform !== (pf === 'mobile' ? 'M' : 'W')) return;
        var v = assessment.scores && assessment.scores[pf] && assessment.scores[pf][item.id];
        if (v === 'na' || v === 4) return;
        var priority = item.gate ? 100 : 40;
        if (typeof v === 'number') priority += (4 - v) * 15; else priority += 45;
        candidates.push({ item:item, pf:pf, value:v, priority:priority });
      });
    });
    candidates.sort(function (a,b) { return b.priority - a.priority; });
    document.getElementById('advisorOutput').innerHTML = candidates.slice(0, 12).map(function (x, i) {
      return '<article class="advisor-card"><span class="rank">' + (i + 1) + '</span><h2>' + esc(x.item.easyQuestion) + '</h2><p>' + (x.pf === 'mobile' ? '모바일' : 'PC 웹') + ' · 현재 ' + (typeof x.value === 'number' ? x.value + '점' : '미평가') + (x.item.gate ? ' · 필수 조건' : '') + '</p><div class="guide-grid"><div><b>지금 할 일</b>' + esc(x.item.smallestAction) + '</div><div><b>검증</b>' + esc(x.item.reverify) + '</div></div><div class="card-actions"><button data-advisor-gap="' + esc(x.item.id) + '" data-advisor-pf="' + x.pf + '">실행 보드에 추가</button></div></article>';
    }).join('') || '<div class="panel">진단 자료를 먼저 입력해 주세요.</div>';
  }

  function renderContent() {
    if (!data.content) return;
    var term = document.getElementById('contentSearch').value.toLowerCase().trim();
    var domain = document.getElementById('contentDomain').value;
    var gatesOnly = document.getElementById('gateOnly').checked;
    var matches = data.content.items.filter(function (x) { return (!selectedLens || selectedLens.priorityItems.includes(x.id)) && (domain === 'all' || x.domainId === domain) && (!gatesOnly || x.gate) && (!term || JSON.stringify(x).toLowerCase().includes(term)); });
    var rows = matches.slice(0, contentLimit);
    document.getElementById('contentCount').textContent = (selectedLens ? selectedLens.name + ' 우선 기준 · ' : '') + matches.length + '개 중 ' + rows.length + '개 표시';
    document.getElementById('contentMore').hidden = rows.length >= matches.length;
    document.getElementById('contentResults').innerHTML = rows.map(function (x) {
      var gate = data.gates && data.gates.guides.find(function (g) { return g.id === x.id; });
      return '<article class="content-card"><h2>' + (x.gate ? '<span class="pill expired">필수</span> ' : '') + esc(x.easyQuestion) + '</h2><p>' + esc(x.domain) + ' · ' + esc(x.applicability) + '</p><details><summary>증거와 해결 방법 보기</summary><div class="guide-grid"><div><b>왜 중요한가</b>' + esc(x.whyImportant) + '</div><div><b>가장 작은 행동</b>' + esc(x.smallestAction) + '</div><div><b>좋은 증거</b>' + esc(x.goodEvidence) + '</div><div><b>피해야 할 증거</b>' + esc(x.badEvidence) + '</div><div><b>완료 조건</b>' + esc(x.completionCondition) + '</div><div><b>재검증</b>' + esc(x.reverify) + '</div></div>' + (gate ? '<h3>필수 통과 조건 해결 순서</h3><p>' + esc(gate.failureImpact) + '</p><ol>' + gate.fixSteps.map(function (step) { return '<li>' + esc(step) + '</li>'; }).join('') + '</ol>' : '') + '<p><b>보안:</b> ' + esc(x.forbiddenSecrets) + '</p><p class="muted">검토 ' + esc(x.reviewedAt) + ' · 다음 검토 ' + esc(x.nextReviewAt) + ' · 담당 ' + esc(x.ownerRole) + '</p></details></article>';
    }).join('') || '<div class="panel">검색 결과가 없습니다.</div>';
  }

  function renderAll() {
    renderOverview(); renderProjects(); renderEvidence(); renderGaps(); renderLenses(); renderBenchmark(); recommendations(); renderContent();
    renderTrends();
    document.querySelectorAll('[data-gap-reverify]').forEach(function(button){var gap=scoped('gaps').find(function(g){return g.id===button.dataset.gapReverify;});if(!gap)return;var card=button.closest('.gap-card'),detail=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('p');summary.textContent='상태 변경 이력 · '+(gap.history||[]).length+'건';body.textContent=(gap.history||[]).map(function(h){return h.at+' '+(h.from||'시작')+' → '+h.to+' · '+(h.reason||'');}).join('\n');detail.append(summary,body);card.appendChild(detail);card.querySelector('select').setAttribute('aria-label',gap.title+' 상태');card.querySelector('input').setAttribute('aria-label',gap.title+' 근거 ID');});
    [['contentSearch','진단 가이드 검색'],['contentDomain','진단 영역'],['advisorFocus','개선 우선순위']].forEach(function(pair){document.getElementById(pair[0]).setAttribute('aria-label',pair[1]);});
    if (data.content) {
      var select = document.getElementById('contentDomain');
      if (select.options.length === 1) {
        Array.from(new Map(data.content.items.map(function (x) { return [x.domainId, x.domain]; })).entries()).forEach(function (x) { var o=document.createElement('option'); o.value=x[0]; o.textContent=x[1]; select.appendChild(o); });
      }
    }
  }

  function renderTrends() {
    var rows=(store.snapshots||[]).filter(function(s){return s.projectId===(store.activeProjectId||'local');}).slice(-20).reverse();
    document.getElementById('trendHistory').innerHTML=rows.length?rows.map(function(s,index){var before=rows[index+1],changes=[];if(before)['web','mobile'].forEach(function(pf){var old=before.assessment.scores[pf]||{},current=s.assessment.scores[pf]||{};Array.from(new Set(Object.keys(old).concat(Object.keys(current)))).forEach(function(key){if(old[key]!==current[key])changes.push(pf+' '+key+': '+(old[key]==null?'미확인':old[key])+' → '+(current[key]==null?'미확인':current[key]));});});return '<details><summary>'+esc(fmtDate(s.at))+' · PC '+esc(s.web.score==null?'미확인':s.web.score)+' · 모바일 '+esc(s.mobile.score==null?'미확인':s.mobile.score)+'</summary><p>'+esc(s.reason)+'</p><p>계산: 영역 가중 평균 · 필수 항목 가중치 2 · 미확인과 적용 제외는 점수 분모에서 제외. 증거 충족률은 별도입니다.</p><ul>'+changes.slice(0,100).map(function(c){return'<li>'+esc(c)+'</li>';}).join('')+'</ul><p>'+(before?changes.length+'개 항목 변화. 미확인→입력은 품질 향상과 동일하지 않습니다.':'첫 기록 — 비교할 이전 기록이 없습니다.')+'</p></details>';}).join(''):'<p>아직 변화 기록이 없습니다. 현재 진단을 저장한 뒤 개선하고 다시 기록하세요.</p>';
  }

  function openDialog(title, fields, onSave) {
    var dialog = document.getElementById('editDialog'); document.getElementById('dialogTitle').textContent = title;
    var host = document.getElementById('dialogFields');
    host.innerHTML = fields.map(function (f) {
      var control = f.type === 'select' ? '<select name="' + esc(f.name) + '">' + f.options.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('') + '</select>' : f.type === 'textarea'
        ? '<textarea name="' + esc(f.name) + '" rows="3">' + esc(f.value || '') + '</textarea>'
        : '<input name="' + esc(f.name) + '" type="' + esc(f.type || 'text') + '" value="' + esc(f.value || '') + '" ' + (f.required ? 'required' : '') + '>';
      return '<label class="field"><span>' + esc(f.label) + '</span>' + control + '</label>';
    }).join('');
    var save = document.getElementById('dialogSave');
    save.onclick = function (event) { event.preventDefault(); var values={}; fields.forEach(function (f) { values[f.name]=host.querySelector('[name="'+f.name+'"]').value.trim(); }); if (fields.some(function (f) { return f.required && !values[f.name]; })) return; try { onSave(values); dialog.close(); renderAll(); } catch (error) { var warning=host.querySelector('[role="alert"]'); if(!warning){warning=document.createElement('p');warning.setAttribute('role','alert');host.appendChild(warning);} warning.textContent=error.message; } };
    dialog.showModal();
  }

  document.querySelector('.wb-tabs').addEventListener('click', function (event) {
    var button=event.target.closest('button[data-view]'); if(!button)return;
    document.querySelectorAll('.wb-tabs button').forEach(function(b){b.removeAttribute('aria-current');}); button.setAttribute('aria-current','page');
    document.querySelectorAll('.view').forEach(function(v){v.classList.remove('on');}); document.getElementById('view-'+button.dataset.view).classList.add('on'); document.getElementById('main').focus();
  });
  document.getElementById('themeBtn').onclick=function(){var html=document.documentElement;var next=html.dataset.theme==='dark'?'light':'dark';html.dataset.theme=next;localStorage.setItem(THEME_KEY,next);};
  document.documentElement.dataset.theme=localStorage.getItem(THEME_KEY)||'light';
  document.getElementById('exportBtn').onclick=function(){download({schema:'crh-complete-backup/v1',exportedAt:new Date().toISOString(),workbench:store,assessment:activeAssessment()},'readiness-hub-complete-backup.json');};
  document.getElementById('importFile').onchange=function(event){var file=event.target.files[0];if(!file)return;event.target.value='';if(file.size>5*1024*1024){document.getElementById('notice').textContent='복원 실패: 5MB 이하 파일만 사용할 수 있습니다. 기존 자료는 보존됩니다.';return;}file.text().then(function(text){var parsed=JSON.parse(text);if(parsed.schema!=='crh-complete-backup/v1')throw new Error('지원하지 않는 백업 형식');var checked=contract.validateStore(parsed.workbench);if(parsed.assessment)contract.validateAssessment(parsed.assessment);if(!checked.projects.length&&parsed.assessment){var restored={id:id('project'),name:parsed.assessment.svc||'복원된 진단',assessment:parsed.assessment,updatedAt:new Date().toISOString()};checked.projects.push(restored);checked.activeProjectId=restored.id;['evidence','gaps','comparators'].forEach(function(key){checked[key].forEach(function(row){if(!row.projectId||row.projectId==='local')row.projectId=restored.id;});});}if(!confirm('검사한 백업으로 작업대를 복원할까요? 현재 자료는 별도 복원 전 백업으로 보존합니다.'))return;var previous=localStorage.getItem(STORE_KEY);if(previous)localStorage.setItem('crh-workbench-before-restore',previous);localStorage.setItem(STORE_KEY,JSON.stringify(checked));storeError='';store=loadStore();saveStore('전체 백업을 복원했습니다.');renderAll();document.getElementById('notice').textContent='복원 성공 · 현재 프로젝트와 기록을 확인하세요.';}).catch(function(e){document.getElementById('notice').textContent='복원 실패: '+e.message+' · 기존 자료는 보존됩니다.';});};
  document.getElementById('newProjectBtn').onclick=function(){var incoming;try{incoming=JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null');}catch(_){document.getElementById('notice').textContent='전달된 진단이 손상되었습니다. 원본을 보존하고 다시 내보내세요.';return;}openDialog('전달받은 진단을 새 프로젝트로 저장',[{name:'name',label:'프로젝트 이름',required:true,value:(incoming||{}).svc||''}],function(v){if(incoming)contract.validateAssessment(incoming);var p={id:id('project'),name:v.name,updatedAt:new Date().toISOString(),assessment:incoming||{scores:{mobile:{},web:{}}}};store.projects.push(p);store.activeProjectId=p.id;saveStore(v.name+' 프로젝트를 저장했습니다.');});};
  document.getElementById('projectList').onclick=function(event){var b=event.target.closest('button');if(!b)return;var pid=b.dataset.projectLoad||b.dataset.projectCopy||b.dataset.projectExport||b.dataset.projectDelete;var p=store.projects.find(function(x){return x.id===pid;});if(!p)return;if(b.dataset.projectLoad){localStorage.setItem(ACTIVE_KEY,JSON.stringify(p.assessment));store.activeProjectId=p.id;saveStore(p.name+' 프로젝트를 열었습니다.');}else if(b.dataset.projectCopy){var copy=JSON.parse(JSON.stringify(p));copy.id=id('project');copy.name=p.name+' 복사본';copy.updatedAt=new Date().toISOString();store.projects.push(copy);saveStore(copy.name+'을 만들었습니다.');}else if(b.dataset.projectExport){download(p,p.name.replace(/[^\w가-힣-]+/g,'-')+'.json');}else if(b.dataset.projectDelete&&confirm('이 기기에서 '+p.name+' 프로젝트를 삭제할까요? 내보낸 백업은 영향을 받지 않습니다.')){store.projects=store.projects.filter(function(x){return x.id!==p.id;});if(store.activeProjectId===p.id)store.activeProjectId='';saveStore(p.name+' 프로젝트를 삭제했습니다.');}renderAll();};
  document.getElementById('addEvidenceBtn').onclick=function(){openDialog('증거 추가',[{name:'itemId',label:'항목 ID 또는 범주',required:true},{name:'title',label:'증거 이름',required:true},{name:'source',label:'공개 주소 또는 로컬 설명'},{name:'observedAt',label:'확인일',type:'date',required:true,value:new Date().toISOString().slice(0,10)},{name:'expiresInDays',label:'유효기간(일)',type:'number',value:'90'},{name:'owner',label:'담당 역할'},{name:'note',label:'비밀값을 제외한 메모',type:'textarea'}],function(v){if(!contract.validDate(v.observedAt)||!Number.isInteger(Number(v.expiresInDays))||Number(v.expiresInDays)<1||Number(v.expiresInDays)>365)throw Error('실제 확인일과 1~365일의 유효기간을 입력하세요.');store.evidence.push(Object.assign({id:id('evidence'),createdAt:new Date().toISOString()},v));saveStore(v.title+' 증거를 추가했습니다.');});};
  document.getElementById('evidenceSearch').oninput=renderEvidence; document.getElementById('evidenceState').onchange=renderEvidence;
  document.getElementById('evidenceList').onclick=function(event){var b=event.target.closest('button');if(!b)return;var eid=b.dataset.evidenceRenew||b.dataset.evidenceUnavailable||b.dataset.evidenceDelete,e=scoped('evidence').find(function(row){return row.id===eid;});if(!e)return;if(b.dataset.evidenceRenew){openDialog('원본 재확인 기록',[{name:'observedAt',label:'실제로 재확인한 날짜',type:'date',required:true},{name:'note',label:'재확인 방법·결과 (실행하지 않았다면 기록하지 마세요)',type:'textarea',required:true}],function(v){if(!contract.validDate(v.observedAt))throw Error('오늘 또는 과거의 유효한 날짜가 필요합니다.');e.history=e.history||[];e.history.push({at:new Date().toISOString(),previousObservedAt:e.observedAt,note:e.note});e.observedAt=v.observedAt;e.note=v.note;e.sourceStatus='available';saveStore('증거 재확인 기록');});}else if(b.dataset.evidenceUnavailable){e.sourceStatus='unavailable';saveStore('원본 접근 실패 기록');renderAll();}else if(b.dataset.evidenceDelete&&confirm('이 증거 기록을 삭제할까요?')){store.evidence=store.evidence.filter(function(row){return row.id!==eid;});saveStore('증거 기록을 삭제했습니다.');renderAll();}};
  document.getElementById('addGapBtn').onclick=function(){openDialog('할 일 추가',[{name:'itemId',label:'기준 항목 ID',required:true},{name:'title',label:'할 일',required:true},{name:'why',label:'필요한 이유',type:'textarea'},{name:'acceptanceCheck',label:'완료 검사',required:true,type:'textarea'},{name:'assignee',label:'담당 역할'},{name:'dueDate',label:'기한',type:'date'}],function(v){store.gaps.push(window.CRH_GAP_LIFECYCLE.create(Object.assign({id:id('gap'),at:new Date().toISOString()},v)));saveStore(v.title+'을 실행 보드에 추가했습니다.');});};
  document.getElementById('gapBoard').onchange=function(event){var gid=event.target.dataset.gapStatus||event.target.dataset.gapVerify,g=store.gaps.find(function(x){return x.id===gid});if(!g)return;if(event.target.dataset.gapVerify){g.sourceEvidenceIds=event.target.value.trim()?[event.target.value.trim()]:[];saveStore('갭 근거를 변경했습니다.');renderAll();return;}try{var changed=window.CRH_GAP_LIFECYCLE.transition(g,event.target.value,{reason:'사용자 상태 변경'});store.gaps=store.gaps.map(function(x){return x.id===g.id?changed:x});saveStore('실행 보드 상태를 변경했습니다.');}catch(error){document.getElementById('notice').textContent=error.message;}renderAll();};
  document.getElementById('gapBoard').onclick=function(event){var b=event.target.closest('button');if(!b)return;var gid=b.dataset.gapReverify||b.dataset.gapBlock||b.dataset.gapDelete,g=store.gaps.find(function(x){return x.id===gid});if(!g)return;if(b.dataset.gapReverify){if(g.status!=='reverifying'){document.getElementById('notice').textContent='상태를 재검증 중으로 옮긴 뒤 완료 기록을 입력하세요.';return;}openDialog('재검증 완료 기록',[{name:'runId',label:'재검증 실행 ID',required:true},{name:'observedAt',label:'재검증일',type:'date',required:true,value:new Date().toISOString().slice(0,10)},{name:'beforeScore',label:'이전 점수(0~4)',type:'number',required:true},{name:'afterScore',label:'현재 점수(0~4)',type:'number',required:true},{name:'residualRisk',label:'남은 위험',required:true,type:'textarea'}],function(v){var changed=window.CRH_GAP_LIFECYCLE.transition(g,'done',{reason:'재검증 완료',reverification:{runId:v.runId,observedAt:v.observedAt,beforeScore:Number(v.beforeScore),afterScore:Number(v.afterScore),residualRisk:v.residualRisk}});store.gaps=store.gaps.map(function(x){return x.id===g.id?changed:x});saveStore(g.title+'을 완전한 재검증 기록과 함께 완료했습니다.');});}else if(b.dataset.gapBlock){openDialog('차단 사유 기록',[{name:'blockerReason',label:'차단 사유',required:true,type:'textarea'}],function(v){var changed=window.CRH_GAP_LIFECYCLE.transition(g,'blocked',{blockerReason:v.blockerReason,reason:v.blockerReason});store.gaps=store.gaps.map(function(x){return x.id===g.id?changed:x});saveStore(g.title+'의 차단 사유를 기록했습니다.');});}else if(b.dataset.gapDelete&&confirm('이 할 일을 삭제할까요?')){store.gaps=store.gaps.filter(function(x){return x.id!==g.id});saveStore(g.title+'을 실행 보드에서 삭제했습니다.');}renderAll();};
  var dimensionLabels={features:'기능',ux:'사용 편의',performance:'속도',trust:'신뢰',reach:'도달',price:'가격 경쟁력',monetization:'수익화',localization:'현지화'};
  document.getElementById('ourScoreFields').innerHTML=benchmarkDimensions.map(function(key){return '<label class="field"><span>'+dimensionLabels[key]+'</span><input data-own-score="'+key+'" type="number" min="0" max="5" step="0.1" placeholder="미확인"></label>';}).join('');
  document.getElementById('ourScoreFields').oninput=function(){var scores={};document.querySelectorAll('[data-own-score]').forEach(function(input){if(input.value!=='')scores[input.dataset.ownScore]=Number(input.value);});document.getElementById('ourBenchmarkScores').value=JSON.stringify(scores);};
  document.getElementById('addComparatorBtn').onclick=function(){openDialog('관찰한 비교 서비스 추가',[{name:'name',label:'서비스 이름',required:true},{name:'type',label:'비교 유형',type:'select',options:[['direct','직접 경쟁'],['adjacent','유사 서비스'],['reference','참고 사례']]},{name:'observedUrl',label:'관찰한 HTTPS 주소',required:true},{name:'observedAt',label:'관찰일',type:'date',required:true,value:new Date().toISOString().slice(0,10)},{name:'confidence',label:'근거 신뢰도',type:'select',options:[['low','낮음'],['medium','보통'],['high','높음']]},{name:'note',label:'관찰한 사실과 점수 이유 (비밀값 금지)',type:'textarea',required:true}].concat(benchmarkDimensions.map(function(key){return{name:key,label:dimensionLabels[key]+' (0~5, 미확인은 빈칸)',type:'number'};})),function(v){var url;try{url=new URL(v.observedUrl);}catch(e){throw new Error('유효한 HTTPS 주소가 필요합니다.');}if(url.protocol!=='https:'||url.username||url.password||!contract.validDate(v.observedAt))throw new Error('HTTPS 주소와 과거 또는 오늘의 실제 관찰일이 필요합니다.');var scores={};benchmarkDimensions.forEach(function(key){if(v[key]==='')return;var value=Number(v[key]);if(!Number.isFinite(value)||value<0||value>5)throw new Error('점수는 0~5 사이입니다.');scores[key]=value;});if(!Object.keys(scores).length)throw new Error('관찰한 평가 축을 하나 이상 입력하세요.');store.comparators.push({id:id('comparator'),name:v.name,type:v.type,observedUrl:v.observedUrl,observedAt:v.observedAt,confidence:v.confidence,note:v.note,scores:scores});saveStore(v.name+' 비교 근거를 추가했습니다.');});};
  document.getElementById('benchmarkList').onclick=function(event){var b=event.target.closest('[data-comparator-delete]');if(b&&confirm('이 비교 근거를 삭제할까요?')){store.comparators=store.comparators.filter(function(row){return row.id!==b.dataset.comparatorDelete});saveStore('비교 근거를 삭제했습니다.');renderBenchmark();}};
  document.getElementById('calculateBenchmarkBtn').onclick=async function(){try{var ours=JSON.parse(document.getElementById('ourBenchmarkScores').value),result=await calculateBenchmark(ours,scoped('comparators')),host=document.getElementById('benchmarkResult');if(result.status!=='calculated'){host.innerHTML='<h2>계산 불가</h2><p>'+esc(result.reason)+'</p><ul>'+(result.researchGaps||[]).map(function(g){return'<li>'+esc(g)+'</li>';}).join('')+'</ul>';return;}host.innerHTML='<h2>비교 집단 안의 상대 위치 '+esc(result.overallPercentile)+'%</h2><p>시장 전체 순위가 아닙니다. 낮은 축부터 원본 근거와 개선 행동을 확인하세요.</p><div class="table-wrap"><table><thead><tr><th>축</th><th>우리</th><th>비교 평균</th><th>백분위</th><th>차이</th></tr></thead><tbody>'+result.dimensions.map(function(row){return'<tr><td>'+esc(dimensionLabels[row.key])+'</td><td>'+row.ours+'</td><td>'+row.average+'</td><td>'+row.percentile+'%</td><td>'+(row.ours-row.average).toFixed(2)+'</td></tr>';}).join('')+'</tbody></table></div>';}catch(error){document.getElementById('benchmarkResult').textContent='계산 실패: '+error.message;}};
  document.getElementById('classifyBtn').onclick=classify;
  document.getElementById('lensCards').onclick=function(event){var b=event.target.closest('[data-lens]');if(!b||!data.lenses)return;selectedLens=data.lenses.lenses.find(function(x){return x.id===b.dataset.lens;});document.getElementById('contentSearch').value='';document.getElementById('contentDomain').value='all';document.getElementById('gateOnly').checked=false;contentLimit=40;document.querySelector('[data-view="content"]').click();renderContent();};
  document.getElementById('advisorBtn').onclick=recommendations;document.getElementById('advisorFocus').onchange=recommendations;
  document.getElementById('advisorOutput').onclick=function(event){var b=event.target.closest('[data-advisor-gap]');if(!b||!data.content)return;var item=data.content.items.find(function(x){return x.id===b.dataset.advisorGap});if(!item)return;store.gaps.push(window.CRH_GAP_LIFECYCLE.create({id:id('gap'),itemId:item.id,title:item.easyQuestion,why:item.whyImportant,assignee:item.ownerRole,dueDate:'',acceptanceCheck:item.completionCondition,status:'new',at:new Date().toISOString()}));saveStore(item.id+' 개선을 실행 보드에 추가했습니다.');renderAll();};
  document.getElementById('contentSearch').oninput=function(){selectedLens=null;contentLimit=40;renderContent();};document.getElementById('contentDomain').onchange=function(){selectedLens=null;contentLimit=40;renderContent();};document.getElementById('gateOnly').onchange=renderContent;
  document.getElementById('contentMore').onclick=function(){contentLimit+=40;renderContent();};
  document.getElementById('snapshotBtn').onclick=function(){if(!activeAssessment()){document.getElementById('notice').textContent='먼저 진단을 작성하거나 프로젝트를 여세요.';return;}openDialog('변화 기록 저장',[{name:'reason',label:'변경 이유와 확인한 근거',required:true,type:'textarea'}],function(v){var assessment=JSON.parse(JSON.stringify(activeAssessment()));store.snapshots=store.snapshots||[];store.snapshots.push({id:id('snapshot'),projectId:store.activeProjectId||'local',at:new Date().toISOString(),reason:v.reason,assessment:assessment,web:scoreStats(assessment,'web'),mobile:scoreStats(assessment,'mobile')});saveStore('현재 진단의 변화 기록을 저장했습니다.');});};
  document.getElementById('updateProjectBtn').onclick=function(){try{var p=store.projects.find(function(row){return row.id===store.activeProjectId;}),latest=JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null');if(!p||!latest||!latest.scores)throw Error('현재 프로젝트와 전달받은 진단이 모두 필요합니다.');if(!confirm('현재 프로젝트 진단을 전달된 자료로 갱신할까요? 이전 진단은 변화 기록으로 보존됩니다.'))return;store.snapshots=store.snapshots||[];store.snapshots.push({id:id('snapshot'),projectId:p.id,at:new Date().toISOString(),reason:'진단 갱신 전 자동 보존',assessment:p.assessment,web:scoreStats(p.assessment,'web'),mobile:scoreStats(p.assessment,'mobile')});contract.validateAssessment(latest);p.assessment=latest;p.updatedAt=new Date().toISOString();p.releaseChecks={};saveStore('진단 갱신 · 이전 판의 출시 확인 기록은 다시 확인 필요');renderAll();}catch(e){document.getElementById('notice').textContent=e.message;}};
  document.getElementById('verifyAxisBtn').onclick=function(){openDialog('실제로 수행한 축별 확인 기록',[{name:'axis',label:'확인 범위',type:'select',options:[['web','PC 웹'],['mobile','Android 실기기'],['development','개발·보안'],['operations','운영 주체·문의'],['recovery','백업 복원']]},{name:'method',label:'실제 검증 방법',type:'select',options:[['browser','브라우저'],['physical-device','실제 Android 기기'],['automatic','자동검사'],['operator','운영자 사실 확인'],['restore','새 환경 복원 시험']]},{name:'evidenceId',label:'현재 프로젝트의 유효 증거',type:'select',required:true,options:[['','증거를 선택하세요']].concat(scoped('evidence').filter(function(e){return evidenceState(e)==='valid';}).map(function(e){return [e.id,e.title+' · '+e.id];}))},{name:'observedAt',label:'실제 검증일',type:'date',required:true},{name:'note',label:'실제 확인 절차·결과·남은 위험 (미실시 상태를 완료로 입력하지 마세요)',type:'textarea',required:true}],function(v){if(!contract.validDate(v.observedAt))throw Error('유효한 확인일이 필요합니다.');var e=scoped('evidence').find(function(row){return row.id===v.evidenceId;});if(!e||evidenceState(e)!=='valid')throw Error('현재 프로젝트의 유효 증거 ID가 필요합니다.');var expected={web:'browser',mobile:'physical-device',development:'automatic',operations:'operator',recovery:'restore'};if(v.method!==expected[v.axis])throw Error('선택한 범위와 실제 검증 방법이 일치해야 합니다.');var p=store.projects.find(function(row){return row.id===store.activeProjectId;})||store;p.releaseChecks=p.releaseChecks||{};p.releaseChecks[v.axis]=Object.assign({declaration:'user-recorded-not-independent',at:new Date().toISOString()},v);saveStore('축별 실제 확인 내용을 사용자 기록으로 저장했습니다.');});};
})();
