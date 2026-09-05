/* 확보 콘텐츠를 진단 화면의 입구로 묶는 공통 UI */
(function(){
  'use strict';
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
  function card(icon,kicker,title,body,metric,small,href,accent){
    return '<article class="crh-hub-card'+(accent?' accent':'')+'">'
      +'<div class="kicker"><span class="icon" aria-hidden="true">'+icon+'</span>'+esc(kicker)+'</div>'
      +'<h3>'+esc(title)+'</h3><p>'+esc(body)+'</p>'
      +(metric?'<div class="metric">'+esc(metric)+'<small>'+esc(small||'')+'</small></div>':'')
      +(href?'<a href="'+href+'">자세히 보기 →</a>':'')+'</article>';
  }
  function render(){
    var host=document.getElementById('crh-content-hub'); if(!host)return;
    var mobile=host.getAttribute('data-mobile')==='true';
    host.className='crh-content-hub'; host.setAttribute('aria-labelledby','crh-hub-title');
    host.innerHTML='<div class="crh-hub-hero">'
      +'<div class="crh-hub-eyebrow">Continuous Readiness Index · beta 1.1.0</div>'
      +'<h2 id="crh-hub-title">서비스의 다음 결정을 한 화면에서</h2>'
      +'<p>확보한 197개 기준, 40개 필수 게이트, 500개 도메인 카탈로그, 3개 관할 렌즈와 학습 콘텐츠를 진단 흐름에 맞춰 연결했습니다.</p>'
      +'<div class="crh-hub-actions">'
      +(mobile?'<button type="button" class="primary" data-crh-mobile-tab="quick">12문항으로 시작</button>':'<button type="button" class="primary" data-crh-tab="quick">12문항으로 시작</button>')
      +'<a class="secondary" href="'+(mobile?'../dashboard.html':'dashboard.html')+'">전체 대시보드 보기</a>'
      +'</div></div>'
      +'<div class="crh-hub-grid">'
      +card('◎','진단','197개 기준 · 40개 게이트','핵심 기능부터 법적 표면까지 모바일과 PC웹을 따로 점수화합니다.','15','영역',null,true)
      +card('↗','시장 비교','500개 도메인 카탈로그','교육·커머스·SaaS를 포함한 도메인 후보와 상위 서비스 비교 근거를 연결합니다.','500','도메인',mobile?'../content/domain-catalog-v1.json':'content/domain-catalog-v1.json',false)
      +card('◒','학습','쉽게 읽는 운영 콘텐츠','120개 용어, 30개 FAQ, 12개 사례와 증거 중심 출시 가이드를 단계별로 제공합니다.','162','콘텐츠',mobile?'../learn/':'learn/',false)
      +card('◇','증거','신선도·검증 등급','자가 신고와 외부 검증을 나누고 확인일·갭·다음 행동을 한 흐름으로 남깁니다.','4','증거 등급',mobile?'../glossary/':'glossary/',false)
      +card('▦','협업','3단계 로컬 작업대','팀 기록·역할·결정 메모·제안 승인과 감사 이력을 로컬에서 안전하게 관리합니다.','3','단계',mobile?'../workbench/':'workbench/',false)
      +card('↥','공개·저장','JSON · CSV · PDF · PWA','공유 링크, 내보내기, 인쇄/PDF, 오프라인 임시 저장과 모바일 설치 안내를 제공합니다.','6','출력·배포 경로',null,false)
      +'</div>'
      +'<div class="crh-hub-rail"><strong>콘텐츠 지도</strong>'
      +'<a href="'+(mobile?'../content/content-guide-v2.json':'content/content-guide-v2.json')+'">콘텐츠 가이드</a>'
      +'<a href="'+(mobile?'../content/gate-guides.json':'content/gate-guides.json')+'">필수 게이트 해설</a>'
      +'<a href="'+(mobile?'../content/lens-education.json':'content/lens-education.json')+'">교육 렌즈</a>'
      +'<a href="'+(mobile?'../content/lens-commerce.json':'content/lens-commerce.json')+'">커머스 렌즈</a>'
      +'<a href="'+(mobile?'../content/lens-saas.json':'content/lens-saas.json')+'">SaaS 렌즈</a>'
      +'<a href="'+(mobile?'../help/':'help/')+'">도움말</a></div>';
    var q=host.querySelector('[data-crh-tab]');
    if(q)q.addEventListener('click',function(){var t=document.querySelector('.tab[data-t="quick"]');if(t)t.click();host.scrollIntoView({behavior:'smooth',block:'start'});});
    var mq=host.querySelector('[data-crh-mobile-tab]');
    if(mq)mq.addEventListener('click',function(){var b=document.querySelector('.nav button[data-p="quick"]');if(b)b.click();host.scrollIntoView({behavior:'smooth',block:'start'});});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();
