(function () {
  'use strict';
  /* 3단계 상용화 후보: local-only team, paid/account/AI safety boundary */
  function init() {
    var contract = window.CRH_STAGE3_CONTRACTS;
    if (!contract || !document.getElementById('stage3Panel')) return;
    var KEY = 'crh-stage3-local-v1';
    var state = load();
    var guideItems = [];
    function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]; }); }
    function date(value) { try { return new Date(value).toLocaleString('ko-KR', { dateStyle:'medium', timeStyle:'short' }); } catch (_) { return value || ''; } }
    function load() {
      try {
        var raw = localStorage.getItem(KEY);
        return raw ? contract.validateStore(JSON.parse(raw)) : contract.emptyStore(activeProjectId());
      } catch (error) {
        var fallback = contract.emptyStore(activeProjectId());
        fallback.loadWarning = '이전 Stage 3 자료가 손상되어 새 로컬 작업공간을 열었습니다. 원본 바이트는 삭제하지 않았습니다.';
        return fallback;
      }
    }
    function activeProjectId() {
      try { var wb = JSON.parse(localStorage.getItem('crh-workbench-v1') || 'null'); return wb && wb.activeProjectId || 'local'; } catch (_) { return 'local'; }
    }
    function save(message) {
      state.projectId = activeProjectId(); state.updatedAt = new Date().toISOString();
      state = contract.validateStore(state); localStorage.setItem(KEY, JSON.stringify(state));
      var notice = document.getElementById('notice'); if (notice && message) notice.textContent = message;
      render();
    }
    function readAssessment() {
      var candidates = [];
      try { candidates.push(JSON.parse(localStorage.getItem('crh-active-assessment-v1') || 'null')); } catch (_) {}
      try { var wb = JSON.parse(localStorage.getItem('crh-workbench-v1') || 'null'); var p = wb && (wb.projects || []).find(function (x) { return x.id === wb.activeProjectId; }); if (p) candidates.push(p.assessment); } catch (_) {}
      return candidates.find(function (x) { return x && x.scores; }) || null;
    }
    function currentItems() {
      var assessment = readAssessment(), scores = assessment && assessment.scores || {}, all = {};
      ['web','mobile'].forEach(function (pf) { Object.keys(scores[pf] || {}).forEach(function (id) { var val = scores[pf][id]; if (typeof val === 'number' && val >= 0 && val <= 4) all[id] = Math.min(all[id] == null ? 4 : all[id], val); }); });
      return all;
    }
    function proposalCandidates() {
      var scores = currentItems(), rows = guideItems.map(function (item) { return { item:item, score:scores[item.id] == null ? -1 : scores[item.id] }; });
      rows.sort(function (a,b) { return (a.score < 0 ? -1 : a.score) - (b.score < 0 ? -1 : b.score); });
      var selected = rows.filter(function (x) { return x.score < 3; }).slice(0, 5);
      if (!selected.length) selected = guideItems.slice(0, 5).map(function (item) { return { item:item, score:-1 }; });
      return selected;
    }
    async function loadGuides() {
      if (guideItems.length) return;
      try { var response = await fetch('../content/content-guide-v2.json', { cache:'no-store' }); if (!response.ok) throw Error('guide'); var json = await response.json(); guideItems = (json.items || []).map(function (item) { return { id:item.id, title:item.easyQuestion || item.question || item.id, action:item.smallestAction || '원본 근거를 확인하고 가장 작은 개선 행동을 실행하세요.', why:item.whyImportant || '출시 위험을 줄이기 위한 기준입니다.', condition:item.completionCondition || '완료 후 동일 기준을 다시 확인하세요.' }; }); }
      catch (_) { guideItems = [{ id:'unknown', title:'현재 점수가 낮거나 미확인인 기준 확인', action:'실제 근거를 추가하고 다시 측정하세요.', why:'미확인 값은 출시 판단을 막습니다.', condition:'원본·확인일·담당자를 기록합니다.' }]; }
    }
    function render() {
      var host = document.getElementById('stage3Panel');
      if (!host) return;
      var flags = Object.keys(contract.FLAGS).map(function (key) { var on = state.flags[key]; return '<span class="stage3-flag ' + (on ? 'on' : 'off') + '">' + esc(key) + ': ' + (on ? '로컬 후보 켜짐' : '운영 조건 대기') + '</span>'; }).join('');
      var members = state.members.length ? '<ul class="stage3-list">' + state.members.map(function (m) { return '<li><b>' + esc(m.displayName) + '</b> · ' + esc(m.role) + ' <small>로컬 기록 · 초대/메일 전송 없음</small></li>'; }).join('') + '</ul>' : '<p class="muted">아직 로컬 멤버가 없습니다.</p>';
      var comments = state.comments.length ? '<ul class="stage3-list">' + state.comments.slice().reverse().slice(0, 8).map(function (c) { return '<li><b>' + esc(c.authorName) + '</b> · ' + esc(c.targetType) + ':' + esc(c.targetId) + '<br>' + esc(c.text) + ' <small>' + esc(date(c.createdAt)) + '</small></li>'; }).join('') + '</ul>' : '<p class="muted">아직 댓글·결정 메모가 없습니다.</p>';
      var proposals = state.proposals.length ? state.proposals.slice().reverse().map(function (p) { return '<article class="stage3-proposal"><h3>' + esc(p.title) + ' <span class="pill ' + (p.status === 'approved' ? 'valid' : p.status === 'rejected' ? 'unavailable' : 'soon') + '">' + esc(p.status) + '</span></h3><p>' + esc(p.action) + '</p><p><b>이유:</b> ' + esc(p.rationale) + '</p><p><b>출처:</b> ' + esc(p.source) + ' · <b>불확실성:</b> ' + esc(p.uncertainty) + '</p>' + (p.status === 'preview' ? '<div class="card-actions"><button data-stage3-approve="' + esc(p.id) + '" class="primary">미리보기 승인</button><button data-stage3-reject="' + esc(p.id) + '">보류</button></div>' : '<small>처리일: ' + esc(date(p.approvedAt || p.createdAt)) + ' · 점수·증거 자동 변경 없음</small>') + '</article>'; }).join('') : '<p class="muted">아직 제안이 없습니다. 현재 진단에서 제안 만들기를 누르세요.</p>';
      host.innerHTML = '<div class="stage3-summary"><p class="eyebrow">3단계 로컬 상용화 후보</p><h2>팀·유료·AI 경계가 분리된 작업공간</h2><p>이 화면은 같은 브라우저에서만 기록합니다. 계정 동기화, 초대 메일, 결제, 외부 AI 호출은 운영자·법무·보안 조건이 확인될 때까지 꺼져 있습니다.</p><div class="stage3-flags">' + flags + '</div></div>' +
        '<div class="stage3-grid"><section class="panel"><h2>로컬 팀 기록</h2><form id="stage3MemberForm" class="stage3-form"><label class="field"><span>표시 이름</span><input name="displayName" required maxlength="80" placeholder="예: 품질 담당"></label><label class="field"><span>역할</span><select name="role"><option value="owner">owner · 소유자</option><option value="editor">editor · 편집자</option><option value="reviewer">reviewer · 검토자</option><option value="viewer">viewer · 보기</option></select></label><button class="primary" type="submit">로컬 멤버 추가</button></form>' + members + '</section>' +
        '<section class="panel"><h2>결정 메모·댓글</h2><form id="stage3CommentForm" class="stage3-form"><label class="field"><span>대상</span><select name="targetType"><option value="project">프로젝트</option><option value="assessment">진단</option><option value="gap">갭</option><option value="evidence">증거</option></select></label><label class="field"><span>대상 ID(선택)</span><input name="targetId" maxlength="160" placeholder="project 또는 항목 ID"></label><label class="field"><span>메모</span><textarea name="text" required maxlength="2000" rows="3" placeholder="결정 이유와 다음 확인 방법"></textarea></label><button class="primary" type="submit">메모 저장</button></form>' + comments + '</section></div>' +
        '<section class="panel"><div class="section-head"><div><h2>근거 기반 AI 보조 제안</h2><p class="muted">AI라는 이름의 자동화라도 점수·증거를 대신 만들지 않습니다. 기존 진단과 197개 가이드에서 제안만 만들고, 미리보기 승인 뒤 감사 기록을 남깁니다.</p></div><button id="stage3GenerateBtn" class="primary" type="button">현재 진단에서 제안 만들기</button></div><div id="stage3Proposals">' + proposals + '</div></section>' +
        '<section class="panel stage3-paid"><h2>유료 기능·계정 상태</h2><p><b>현재:</b> 무료 로컬 모드. 가격·세금·환불·갱신·지원 SLA·운영자 신원이 확인되기 전에는 결제나 계정 동기화를 제공하지 않습니다.</p><p class="muted">상용화 전 체크: 사업자 정보, 약관/개인정보, 결제사업자 계약, 환불·영수증, 삭제·복구, 보안 사고 대응.</p></section>';
      var backup = document.createElement('section'); backup.className = 'panel stage3-backup'; backup.innerHTML = '<h2>3단계 로컬 백업</h2><p class="muted">팀·댓글·제안 감사 기록만 저장하거나 복원합니다. 서버로 전송하지 않습니다.</p><div class="card-actions"><button id="stage3ExportBtn" type="button">3단계 JSON 저장</button><label class="file-btn">3단계 JSON 복원<input id="stage3ImportInput" type="file" accept="application/json" hidden></label></div>'; host.insertBefore(backup, host.firstChild);
      bind();
    }
    function download(value, name) { var blob = new Blob([JSON.stringify(value, null, 2)], { type:'application/json' }); var link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = name; document.body.appendChild(link); link.click(); link.remove(); setTimeout(function () { URL.revokeObjectURL(link.href); }, 500); }
    function bind() {
      var memberForm = document.getElementById('stage3MemberForm');
      if (memberForm) memberForm.onsubmit = function (event) { event.preventDefault(); var form = new FormData(memberForm); try { state = contract.addMember(state, { displayName:form.get('displayName'), role:form.get('role') }); save('로컬 멤버 기록을 추가했습니다. 실제 초대나 계정 생성은 하지 않았습니다.'); } catch (e) { document.getElementById('notice').textContent = e.message; } };
      var commentForm = document.getElementById('stage3CommentForm');
      if (commentForm) commentForm.onsubmit = function (event) { event.preventDefault(); var form = new FormData(commentForm); try { state = contract.addComment(state, { targetType:form.get('targetType'), targetId:form.get('targetId') || 'project', text:form.get('text'), authorName:'로컬 운영자' }); save('결정 메모를 로컬 감사 기록에 추가했습니다.'); } catch (e) { document.getElementById('notice').textContent = e.message; } };
      var generate = document.getElementById('stage3GenerateBtn');
      if (generate) generate.onclick = async function () { generate.disabled = true; await loadGuides(); try { proposalCandidates().forEach(function (x) { var item=x.item; state = contract.createProposal(state, { title:item.title, action:item.action, rationale:item.why, sourceItemId:item.id, source:'content-guide-v2.json#' + item.id, uncertainty:x.score < 0 ? '현재 점수 미확인 · 원본 근거를 사람이 확인해야 함' : '자가 입력 점수 ' + x.score + '/4 · 독립 인증 아님', confidence:'heuristic' }); }); save('현재 진단을 바탕으로 미리보기 제안을 만들었습니다. 승인 전에는 아무 점수도 바뀌지 않습니다.'); } catch (e) { document.getElementById('notice').textContent = e.message; } generate.disabled = false; };
      document.querySelectorAll('[data-stage3-approve]').forEach(function (button) { button.onclick = function () { try { state = contract.approveProposal(state, button.dataset.stage3Approve, '로컬 운영자'); save('제안을 승인했지만 진단·증거에는 자동 반영하지 않았습니다.'); } catch (e) { document.getElementById('notice').textContent = e.message; } }; });
      document.querySelectorAll('[data-stage3-reject]').forEach(function (button) { button.onclick = function () { try { state = contract.rejectProposal(state, button.dataset.stage3Reject); save('제안을 보류했습니다.'); } catch (e) { document.getElementById('notice').textContent = e.message; } }; });
      var exportButton = document.getElementById('stage3ExportBtn');
      if (exportButton) exportButton.onclick = function () { download(contract.validateStore(state), 'readiness-hub-stage3-local.json'); };
      var importInput = document.getElementById('stage3ImportInput');
      if (importInput) importInput.onchange = function (event) { var file = event.target.files[0]; event.target.value = ''; if (!file || file.size > 2 * 1024 * 1024) { document.getElementById('notice').textContent = '3단계 복원 실패: 2MB 이하 JSON만 사용할 수 있습니다.'; return; } file.text().then(function (raw) { var parsed = contract.validateStore(JSON.parse(raw)); if (!confirm('3단계 로컬 기록을 이 파일로 바꿀까요? 현재 기록은 전체 백업으로 먼저 보존하세요.')) return; window.CRH_STAGE3_LOCAL_IMPORT(parsed); document.getElementById('notice').textContent = '3단계 로컬 기록을 복원했습니다.'; }).catch(function (error) { document.getElementById('notice').textContent = '3단계 복원 실패: ' + error.message + ' · 기존 자료는 보존됩니다.'; }); };
    }
    render();
    if (state.loadWarning) { var notice = document.getElementById('notice'); if (notice) notice.textContent = state.loadWarning; }
    window.CRH_STAGE3_LOCAL = { getStore:function () { return contract.validateStore(state); }, generate:function () { return loadGuides().then(function () { return proposalCandidates(); }); } };
    window.CRH_STAGE3_LOCAL_EXPORT = function () { return contract.validateStore(state); };
    window.CRH_STAGE3_LOCAL_VALIDATE = function (value) { return contract.validateStore(value); };
    window.CRH_STAGE3_LOCAL_IMPORT = function (value) { state = contract.validateStore(value); localStorage.setItem(KEY, JSON.stringify(state)); render(); return state; };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
