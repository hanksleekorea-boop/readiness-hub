/* Readiness Hub release passport contract. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CRH_RELEASE_PASSPORT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var STATES = ['통과', '조건부 통과', '미확인', '차단', '계산 불가'];
  function axis(name, input) {
    input = input || {};
    var missing = Array.isArray(input.missing) ? input.missing.filter(Boolean) : [];
    var date = String(input.observedAt || ''), parsed = new Date(date + 'T00:00:00Z');
    var validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === date && date <= new Date().toISOString().slice(0,10);
    if (input.verified !== true || !validDate || !(input.evidenceCounts && Number.isInteger(input.evidenceCounts.valid) && input.evidenceCounts.valid > 0)) missing.push('축별 확인일·유효 근거·검증 완료 기록 필요');
    var blockers = Array.isArray(input.blockers) ? input.blockers.filter(Boolean) : [];
    var state = blockers.length ? '차단' : missing.length ? '미확인' : input.calculable === false ? '계산 불가' : input.conditional ? '조건부 통과' : '통과';
    return { name: name, state: state, evidenceCounts: input.evidenceCounts || {}, observedAt: input.observedAt || null, blockers: blockers, missing: missing, topGaps: (input.topGaps || []).slice(0, 3) };
  }
  function build(input) {
    input = input || {};
    var axes = [axis('PC 웹', input.web), axis('모바일/PWA', input.mobile), axis('개발·보안', input.development), axis('운영·상용화', input.operations)];
    var ready = axes.every(function (entry) { return entry.state === '통과'; });
    return { schema: 'crh-release-passport/v1', generatedAt: input.generatedAt || new Date().toISOString(), axes: axes, decision: ready ? '입력한 증거 기준 통과 · 독립 인증 아님' : '판정 보류', ready: ready };
  }
  return Object.freeze({ STATES: STATES.slice(), build: build });
});
