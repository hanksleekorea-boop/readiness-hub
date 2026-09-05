(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CRH_STAGE3_CONTRACTS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var SCHEMA = 'crh-stage3-local/v1';
  var VERSION = '1.0.0';
  var ROLES = ['owner', 'editor', 'reviewer', 'viewer'];
  var TARGETS = ['project', 'gap', 'evidence', 'assessment'];
  var STATUS = ['preview', 'approved', 'rejected'];
  var FLAGS = {
    localCollaboration: true,
    accountSync: false,
    paidFeatures: false,
    externalAi: false,
    externalInvites: false
  };
  function now() { return new Date().toISOString(); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function id(prefix) { return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); }
  function emptyStore(projectId) {
    return { schema: SCHEMA, version: VERSION, projectId: projectId || 'local', updatedAt: now(), flags: clone(FLAGS), members: [], comments: [], proposals: [], audit: [] };
  }
  function text(value, label, max) {
    if (typeof value !== 'string' || !value.trim()) throw new Error(label + '을 입력하세요.');
    if (max && value.trim().length > max) throw new Error(label + '은 ' + max + '자 이내여야 합니다.');
    return value.trim();
  }
  function validDate(value) { return typeof value === 'string' && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value; }
  function validateStore(input) {
    if (!input || input.schema !== SCHEMA) throw new Error('Stage 3 로컬 자료 형식이 아닙니다.');
    var out = clone(input);
    if (out.version !== VERSION) throw new Error('지원하지 않는 Stage 3 자료 버전입니다.');
    out.projectId = text(out.projectId || 'local', '프로젝트 ID', 160);
    out.flags = Object.assign({}, FLAGS, out.flags || {});
    Object.keys(FLAGS).forEach(function (key) { if (typeof out.flags[key] !== 'boolean') throw new Error('기능 플래그가 올바르지 않습니다: ' + key); });
    ['members', 'comments', 'proposals', 'audit'].forEach(function (key) { if (!Array.isArray(out[key])) throw new Error(key + ' 목록이 올바르지 않습니다.'); });
    out.members.forEach(function (m) {
      text(m.id, '멤버 ID', 160); text(m.displayName, '멤버 이름', 80);
      if (!ROLES.includes(m.role)) throw new Error('허용되지 않은 멤버 역할입니다.');
      if (m.email || m.contact) throw new Error('외부 연락처는 로컬 Stage 3 자료에 저장하지 않습니다.');
    });
    out.comments.forEach(function (c) {
      text(c.id, '댓글 ID', 160); text(c.text, '댓글', 2000); text(c.authorName, '작성자', 80);
      if (!TARGETS.includes(c.targetType)) throw new Error('댓글 대상이 올바르지 않습니다.');
      text(c.targetId || 'project', '댓글 대상 ID', 160);
    });
    out.proposals.forEach(function (p) {
      text(p.id, '제안 ID', 160); text(p.title, '제안 제목', 200);
      text(p.sourceItemId, '출처 항목 ID', 80); text(p.source, '출처', 300);
      text(p.uncertainty, '불확실성', 500);
      if (!STATUS.includes(p.status)) throw new Error('제안 상태가 올바르지 않습니다.');
      if (p.approvedAt && !validDate(p.approvedAt)) throw new Error('제안 승인일이 올바르지 않습니다.');
      if (p.status === 'approved' && (!p.approvedBy || !p.approvedAt)) throw new Error('승인된 제안에는 승인자와 승인일이 필요합니다.');
    });
    out.updatedAt = validDate(out.updatedAt) ? out.updatedAt : now();
    return out;
  }
  function audit(store, action, detail) {
    store.audit.push({ id: id('audit'), at: now(), action: action, detail: text(detail, '감사 내용', 500) });
    store.updatedAt = now();
  }
  function addMember(store, input) {
    var checked = validateStore(store);
    if (input && (input.email || input.contact)) throw new Error('외부 연락처는 로컬 Stage 3 자료에 저장하지 않습니다.');
    var member = { id: id('member'), displayName: text(input.displayName, '표시 이름', 80), role: input.role || 'viewer', joinedAt: now(), localOnly: true };
    if (!ROLES.includes(member.role)) throw new Error('역할은 owner/editor/reviewer/viewer 중 하나여야 합니다.');
    checked.members.push(member); audit(checked, 'member.add', member.displayName + ' · ' + member.role);
    return checked;
  }
  function addComment(store, input) {
    var checked = validateStore(store);
    var comment = { id: id('comment'), targetType: input.targetType || 'project', targetId: input.targetId || 'project', authorName: text(input.authorName || '로컬 운영자', '작성자', 80), text: text(input.text, '댓글', 2000), createdAt: now(), localOnly: true };
    if (!TARGETS.includes(comment.targetType)) throw new Error('댓글 대상은 project/gap/evidence/assessment 중 하나입니다.');
    checked.comments.push(comment); audit(checked, 'comment.add', comment.targetType + ':' + comment.targetId);
    return checked;
  }
  function createProposal(store, input) {
    var checked = validateStore(store);
    var proposal = { id: id('proposal'), title: text(input.title, '제안 제목', 200), action: text(input.action, '제안 행동', 1000), rationale: text(input.rationale, '제안 이유', 1000), sourceItemId: text(input.sourceItemId, '출처 항목 ID', 80), source: text(input.source, '출처', 300), confidence: input.confidence || 'heuristic', uncertainty: text(input.uncertainty, '불확실성', 500), status: 'preview', createdAt: now(), localOnly: true };
    checked.proposals.push(proposal); audit(checked, 'proposal.preview', proposal.sourceItemId);
    return checked;
  }
  function approveProposal(store, proposalId, approvedBy) {
    var checked = validateStore(store);
    var proposal = checked.proposals.find(function (p) { return p.id === proposalId; });
    if (!proposal) throw new Error('제안을 찾을 수 없습니다.');
    if (proposal.status !== 'preview') throw new Error('미리보기 상태의 제안만 승인할 수 있습니다.');
    proposal.status = 'approved'; proposal.approvedBy = text(approvedBy || '로컬 운영자', '승인자', 80); proposal.approvedAt = now();
    audit(checked, 'proposal.approve', proposal.id + ' · assessment/evidence 자동 변경 없음');
    return checked;
  }
  function rejectProposal(store, proposalId) {
    var checked = validateStore(store);
    var proposal = checked.proposals.find(function (p) { return p.id === proposalId; });
    if (!proposal) throw new Error('제안을 찾을 수 없습니다.');
    if (proposal.status !== 'preview') throw new Error('미리보기 상태의 제안만 보류할 수 있습니다.');
    proposal.status = 'rejected'; audit(checked, 'proposal.reject', proposal.id);
    return checked;
  }
  return { SCHEMA: SCHEMA, VERSION: VERSION, ROLES: ROLES.slice(), TARGETS: TARGETS.slice(), FLAGS: clone(FLAGS), emptyStore: emptyStore, validateStore: validateStore, addMember: addMember, addComment: addComment, createProposal: createProposal, approveProposal: approveProposal, rejectProposal: rejectProposal };
});
