(function () {
  'use strict';
  var button = document.getElementById('exportBtn');
  if (button && !button.dataset.stage3Backup) {
    button.dataset.stage3Backup = 'true';
    button.onclick = function () {
      var workbench = null, assessment = null;
      try { workbench = JSON.parse(localStorage.getItem('crh-workbench-v1') || 'null'); } catch (_) {}
      try { assessment = JSON.parse(localStorage.getItem('crh-active-assessment-v1') || 'null'); } catch (_) {}
      if (!workbench) workbench = { schema:'crh-workbench/v2', activeProjectId:'', projects:[], evidence:[], gaps:[], comparators:[], activities:[], snapshots:[], profile:{ operatorConfirmed:false, androidConfirmed:false, recoveryConfirmed:false } };
      var stage3 = null;
      try { stage3 = window.CRH_STAGE3_LOCAL_EXPORT ? window.CRH_STAGE3_LOCAL_EXPORT() : null; } catch (_) { stage3 = null; }
      var payload = { schema:'crh-complete-backup/v1', exportedAt:new Date().toISOString(), workbench:workbench, assessment:assessment, stage3:stage3 };
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
      var link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'readiness-hub-complete-backup.json'; document.body.appendChild(link); link.click(); link.remove(); setTimeout(function () { URL.revokeObjectURL(link.href); }, 500);
      var notice = document.getElementById('notice'); if (notice) notice.textContent = '전체 백업에 3단계 로컬 기록을 포함했습니다.';
    };
  }
  var input = document.getElementById('importFile');
  if (input && !input.dataset.stage3RestoreBridge) {
    input.dataset.stage3RestoreBridge = 'true';
    input.onchange = function (event) {
      var file = event.target.files && event.target.files[0]; event.target.value = '';
      if (!file || file.size > 5 * 1024 * 1024) { var tooBig = document.getElementById('notice'); if (tooBig) tooBig.textContent = '복원 실패: 5MB 이하 파일만 사용할 수 있습니다.'; return; }
      file.text().then(function (raw) {
        var parsed;
        try { parsed = JSON.parse(raw); } catch (_) { throw new Error('JSON 형식이 아닙니다.'); }
        if (!parsed || parsed.schema !== 'crh-complete-backup/v1') throw new Error('지원하지 않는 백업 형식입니다.');
        var checked = window.CRH_WORKBENCH_CONTRACTS && window.CRH_WORKBENCH_CONTRACTS.validateStore ? window.CRH_WORKBENCH_CONTRACTS.validateStore(parsed.workbench) : null;
        if (!checked) throw new Error('작업대 계약을 확인할 수 없습니다.');
        if (parsed.assessment && window.CRH_WORKBENCH_CONTRACTS.validateAssessment) window.CRH_WORKBENCH_CONTRACTS.validateAssessment(parsed.assessment);
        var stage3 = parsed.stage3 && window.CRH_STAGE3_LOCAL_VALIDATE ? window.CRH_STAGE3_LOCAL_VALIDATE(parsed.stage3) : null;
        if (!confirm('검사한 전체 백업을 복원할까요? 현재 작업대는 별도 복원 전 백업으로 보존합니다.')) return;
        var previous = localStorage.getItem('crh-workbench-v1'); if (previous) localStorage.setItem('crh-workbench-before-restore', previous);
        localStorage.setItem('crh-workbench-v1', JSON.stringify(checked));
        if (stage3 && window.CRH_STAGE3_LOCAL_IMPORT) window.CRH_STAGE3_LOCAL_IMPORT(stage3);
        var notice = document.getElementById('notice'); if (notice) notice.textContent = '전체 백업과 3단계 로컬 기록을 복원했습니다.';
      }).catch(function (error) { var notice = document.getElementById('notice'); if (notice) notice.textContent = '복원 실패: ' + error.message + ' · 기존 자료는 보존됩니다.'; });
    };
  }
})();
