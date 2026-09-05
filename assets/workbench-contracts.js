/* Shared, side-effect-free validation used by the workbench and regression tests. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CRH_WORKBENCH_CONTRACTS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function validDate(value, now) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
    var date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value && value <= (now || new Date().toISOString().slice(0,10));
  }
  function evidenceState(item, now) {
    if (item.sourceStatus === 'unavailable') return 'unavailable';
    if (!validDate(item.observedAt, now)) return 'expired';
    var days = Math.floor((new Date((now || new Date().toISOString().slice(0,10)) + 'T00:00:00Z') - new Date(item.observedAt + 'T00:00:00Z')) / 86400000);
    var expires = Number(item.expiresInDays);
    if (!Number.isFinite(expires) || expires < 1 || expires > 365) return 'expired';
    return days > expires ? 'expired' : expires - days <= 14 ? 'soon' : 'valid';
  }
  function scoreStats(assessment, pf, lens) {
    var scores = assessment && assessment.scores && assessment.scores[pf] || {};
    var total = 0, rated = 0, unknown = 0, gateFail = 0, numerator = 0, denominator = 0;
    (lens && lens.domains || []).forEach(function (domain) {
      var num = 0, den = 0;
      domain.items.forEach(function (item) {
        if (item.p !== 'C' && item.p !== (pf === 'mobile' ? 'M' : 'W')) return;
        var value = scores[item.id];
        if (value === 'na') return;
        total++;
        var valid = Number.isInteger(value) && value >= 0 && value <= 4;
        if (item.g && (!valid || value < 3)) gateFail++;
        if (!valid) { unknown++; return; }
        rated++;
        var weight = item.g ? 2 : 1;
        num += value * weight; den += 4 * weight;
      });
      if (den) { var dw = assessment && assessment.weights && assessment.weights[domain.id]; if (!(Number.isFinite(dw) && dw > 0)) dw = domain.weight; numerator += num / den * dw; denominator += dw; }
    });
    return {score:denominator ? Math.round(numerator / denominator * 1000) / 10 : null,progress:total ? Math.round(rated / total * 100) : 0,gateFail:gateFail,unknown:unknown,total:total,rated:rated,scoreKind:'자가 입력 가중 점수 · 외부 검증·신선도 별도'};
  }
  function validateAssessment(raw) {
    if (!raw || typeof raw!=='object' || Array.isArray(raw) || !raw.scores || typeof raw.scores!=='object' || Array.isArray(raw.scores)) throw new Error('진단 점수 구조 오류');
    ['web','mobile'].forEach(function(pf){var values=raw.scores[pf];if(values===undefined)return;if(!values||typeof values!=='object'||Array.isArray(values))throw new Error('플랫폼 점수 구조 오류');if(Object.values(values).some(function(v){return !(v===null||['unk','unknown','na','fail'].includes(v)||Number.isInteger(v)&&v>=0&&v<=4);}))throw new Error('허용되지 않은 진단 점수');});
    return raw;
  }
  function validateStore(raw) {
    if (!raw || typeof raw !== 'object' || !['crh-workbench/v1','crh-workbench/v2'].includes(raw.schema)) throw new Error('지원하지 않는 작업대 형식');
    ['projects','evidence','gaps','comparators','activities'].forEach(function (key) {
      if (!Array.isArray(raw[key]) || raw[key].length > 10000) throw new Error(key + ': 목록 형식 또는 크기 오류');
      if (raw[key].some(function (row) { return !row || typeof row !== 'object' || Array.isArray(row); })) throw new Error(key + ': 기록 형식 오류');
    });
    if (raw.projects.some(function (p) { return typeof p.id !== 'string' || !p.id || typeof p.name !== 'string' || !p.assessment || !p.assessment.scores; })) throw new Error('프로젝트 구조 오류');
    raw.projects.forEach(function(p){validateAssessment(p.assessment);});
    if (new Set(raw.projects.map(function (p) { return p.id; })).size !== raw.projects.length) throw new Error('프로젝트 ID 중복');
    if (raw.activeProjectId && !raw.projects.some(function (p) { return p.id === raw.activeProjectId; })) throw new Error('현재 프로젝트 참조 오류');
    if (raw.snapshots && (!Array.isArray(raw.snapshots) || raw.snapshots.length > 10000 || raw.snapshots.some(function(s){return !s || !s.assessment || !s.assessment.scores || !s.web || !s.mobile;}))) throw new Error('변화 기록 구조 오류');
    if (raw.gaps.some(function(g){return !['todo','doing','review','new','in_progress','ready_for_review','reverifying','done','blocked'].includes(g.status);})) throw new Error('갭 상태 오류');
    if (raw.comparators.some(function(c){try{return new URL(c.observedUrl).protocol!=='https:';}catch(e){return true;}})) throw new Error('비교 주소 오류');
    return JSON.parse(JSON.stringify(raw));
  }
  function scoped(rows, projectId) { return rows.filter(function (row) { return row.projectId === (projectId || 'local'); }); }
  return {validDate:validDate,evidenceState:evidenceState,scoreStats:scoreStats,validateAssessment:validateAssessment,validateStore:validateStore,scoped:scoped};
});
