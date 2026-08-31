(function () {
  'use strict';
  var mobile = /\/m\/?(?:index\.html)?$/.test(location.pathname);
  var base = mobile ? '../' : './';
  var contentById = new Map();
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function decorate(root) {
    if (!contentById.size) return;
    (root || document).querySelectorAll('[data-item-id]').forEach(function (card) {
      if (card.querySelector('.crh-guide')) return;
      var item = contentById.get(card.dataset.itemId); if (!item) return;
      var details = document.createElement('details'); details.className = 'crh-guide';
      details.innerHTML = '<summary>쉬운 설명·증거·해결 방법 보기</summary><div class="crh-guide-grid">'
        + '<div><b>왜 중요한가</b>' + esc(item.whyImportant) + '</div>'
        + '<div><b>가장 작은 행동</b>' + esc(item.smallestAction) + '</div>'
        + '<div><b>좋은 증거</b>' + esc(item.goodEvidence) + '</div>'
        + '<div><b>피해야 할 증거</b>' + esc(item.badEvidence) + '</div>'
        + '<div><b>완료 조건</b>' + esc(item.completionCondition) + '</div>'
        + '<div><b>재검증</b>' + esc(item.reverify) + '</div></div>'
        + '<p class="crh-security"><b>증거 보안:</b> ' + esc(item.forbiddenSecrets) + '</p>';
      card.appendChild(details);
    });
  }
  function addEntryPoints() {
    if (!document.querySelector('.crh-workbench-link')) {
      var link = document.createElement('a'); link.className = 'crh-workbench-link'; link.href = base + 'workbench/'; link.textContent = '고급 작업대'; document.body.appendChild(link);
    }
    if (!document.querySelector('.crh-start')) {
      var box = document.createElement('aside'); box.className = 'crh-start';
      box.innerHTML = '<p><b>처음이신가요?</b> 퀵체크로 시작하고, 결과에서 가장 중요한 3개만 먼저 고치세요. 점수는 법률 자문이나 출시 승인이 아닙니다.</p><a href="' + base + 'help/">3분 사용법 보기</a>';
      var target = document.querySelector('.wrap') || document.body.firstElementChild; target.parentNode.insertBefore(box, target);
    }
  }
  fetch(base + 'content/content-guide-v2.json').then(function (response) { if (!response.ok) throw new Error('content'); return response.json(); }).then(function (data) {
    data.items.forEach(function (item) { contentById.set(item.id, item); }); decorate(document);
    new MutationObserver(function (records) { records.forEach(function (record) { record.addedNodes.forEach(function (node) { if (node.nodeType === 1) decorate(node); }); }); }).observe(document.body, { childList:true, subtree:true });
  }).catch(function () {});
  addEntryPoints();
})();
