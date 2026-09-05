/* Readiness Hub gap lifecycle contract. Works in browsers and Node tests. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CRH_GAP_LIFECYCLE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var STATUSES = ['new', 'in_progress', 'ready_for_review', 'reverifying', 'done', 'blocked'];
  var PATHS = {
    new: ['in_progress', 'blocked'],
    in_progress: ['ready_for_review', 'blocked'],
    ready_for_review: ['reverifying', 'in_progress', 'blocked'],
    reverifying: ['done', 'in_progress', 'blocked'],
    done: ['in_progress'],
    blocked: ['in_progress']
  };
  function text(value) { return String(value == null ? '' : value).trim(); }
  function requiredReverification(value) {
    if (!value) return false;
    var date = text(value.observedAt), parsed = new Date(date+'T00:00:00Z');
    var validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10)===date && date<=new Date().toISOString().slice(0,10);
    return Boolean(text(value.runId) && validDate && [value.beforeScore,value.afterScore].every(function(n){return typeof n==='number' && Number.isInteger(n) && n>=0 && n<=4;}) && text(value.residualRisk));
  }
  function validate(gap) {
    var errors = [];
    if (!gap || typeof gap !== 'object') return ['갭 객체가 필요합니다.'];
    if (!text(gap.id)) errors.push('id가 필요합니다.');
    if (!text(gap.itemId)) errors.push('itemId가 필요합니다.');
    if (!STATUSES.includes(gap.status)) errors.push('허용되지 않은 상태입니다.');
    if (gap.status === 'blocked' && !text(gap.blockerReason)) errors.push('blocked에는 blockerReason이 필요합니다.');
    if (gap.status === 'done' && !requiredReverification(gap.reverification)) errors.push('done에는 완전한 재검증 기록이 필요합니다.');
    return errors;
  }
  function create(input) {
    input = input || {};
    var now = input.at || new Date().toISOString();
    var gap = {
      id: text(input.id), itemId: text(input.itemId), title: text(input.title), why: text(input.why),
      status: input.status || 'new', impact: input.impact || 'medium', effort: input.effort || 'medium',
      blocker: Boolean(input.blocker), blockerReason: text(input.blockerReason) || null,
      assignee: text(input.assignee) || null, dueDate: text(input.dueDate) || null,
      sourceEvidenceIds: Array.isArray(input.sourceEvidenceIds) ? input.sourceEvidenceIds.slice() : [],
      acceptanceCheck: text(input.acceptanceCheck) || null, reverification: input.reverification || null,
      history: Array.isArray(input.history) ? input.history.slice() : [{ at: now, from: null, to: input.status || 'new', by: text(input.by) || 'local', reason: text(input.reason) || '생성' }]
    };
    var errors = validate(gap); if (errors.length) throw new Error(errors.join(' '));
    return gap;
  }
  function transition(gap, next, details) {
    details = details || {};
    if (!STATUSES.includes(next)) throw new Error('허용되지 않은 상태입니다.');
    if (!(PATHS[gap.status] || []).includes(next)) throw new Error(gap.status + '에서 ' + next + '로 바로 이동할 수 없습니다.');
    var changed = Object.assign({}, gap, { status: next, history: (gap.history || []).slice() });
    if (gap.status === 'done') { changed.previousReverification=gap.reverification; changed.reverification=null; }
    if (next === 'blocked') { changed.blocker = true; changed.blockerReason = text(details.blockerReason); }
    if (next !== 'blocked') { changed.blocker = false; changed.blockerReason = null; }
    if (details.reverification) changed.reverification = Object.assign({}, details.reverification);
    changed.history.push({ at: details.at || new Date().toISOString(), from: gap.status, to: next, by: text(details.by) || 'local', reason: text(details.reason) || null });
    var errors = validate(changed); if (errors.length) throw new Error(errors.join(' '));
    return changed;
  }
  return Object.freeze({ STATUSES: STATUSES.slice(), PATHS: PATHS, create: create, transition: transition, validate: validate, hasCompleteReverification: requiredReverification });
});
