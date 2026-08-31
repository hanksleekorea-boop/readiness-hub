/* Readiness Hub AdSense runtime — content pages only, no ad clicks or diagnostic-data targeting. */
(function () {
  'use strict';
  var W = window;
  var C = W.CRH_ADSENSE_CONFIG || {};
  var PROVIDER_SELECTOR = 'script[data-crh-ad-provider="google-adsense"]';

  function startsWithAny(value, prefixes) {
    return (prefixes || []).some(function (prefix) { return value.indexOf(prefix) === 0; });
  }

  function validConfig() {
    return C.schema === 'crh-adsense-config/v1'
      && C.codeActivated === true
      && /^ca-pub-\d{16}$/.test(C.publisherId || '')
      && /^pub-\d{16}$/.test(C.sellerId || '')
      && /^\d{10}$/.test(C.verifiedResponsiveSlot || '')
      && C.publisherId.slice(3) === C.sellerId;
  }

  function isProduction() {
    return location.protocol === 'https:'
      && location.origin === C.productionOrigin
      && location.pathname.indexOf(C.productionPathPrefix) === 0;
  }

  function pageMode() {
    if (startsWithAny(location.pathname, C.excludedPathPrefixes)) return 'excluded';
    if (startsWithAny(location.pathname, C.eligiblePathPrefixes)) return 'content';
    if (startsWithAny(location.pathname, C.messagingOnlyPathPrefixes)) return 'messaging';
    return 'excluded';
  }

  function status(slot, text, state) {
    slot.dataset.adState = state;
    var old = slot.querySelector('.crh-ad-status');
    if (old) old.textContent = text;
  }

  function prepareSlots() {
    return Array.prototype.map.call(document.querySelectorAll('[data-crh-ad-slot-key]'), function (slot) {
      var key = slot.dataset.crhAdSlotKey;
      var definition = C.slots && C.slots[key];
      slot.replaceChildren();
      var label = document.createElement('span');
      label.className = 'crh-ad-label';
      label.textContent = '광고';
      slot.appendChild(label);
      var message = document.createElement('p');
      message.className = 'crh-ad-status';
      message.setAttribute('role', 'status');
      message.textContent = definition ? '광고 공급자를 연결하는 중입니다.' : '광고 설정을 확인할 수 없습니다.';
      slot.appendChild(message);
      if (!definition || !/^\d{10}$/.test(definition.id)) return { slot: slot, ready: false };
      var ad = document.createElement('ins');
      ad.className = 'adsbygoogle';
      ad.style.display = 'block';
      ad.dataset.adClient = C.publisherId;
      ad.dataset.adSlot = definition.id;
      ad.dataset.adFormat = definition.format || 'auto';
      ad.dataset.fullWidthResponsive = 'true';
      ad.hidden = true;
      slot.appendChild(ad);
      return { slot: slot, ad: ad, ready: true };
    });
  }

  function loadProvider(entries, messagingOnly) {
    if (document.querySelector(PROVIDER_SELECTOR)) return;
    W.googlefc = W.googlefc || {};
    W.googlefc.callbackQueue = W.googlefc.callbackQueue || [];
    W.adsbygoogle = W.adsbygoogle || [];
    W.adsbygoogle.requestNonPersonalizedAds = 1;
    var script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.crhAdProvider = 'google-adsense';
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(C.publisherId);
    script.addEventListener('load', function () {
      if (messagingOnly) return;
      entries.filter(function (entry) { return entry.ready; }).forEach(function (entry) {
        entry.ad.hidden = false;
        status(entry.slot, '광고 요청을 보냈습니다. 실제 노출은 Google 승인·재고·사용자 선택에 따라 달라집니다.', 'requested');
        try { W.adsbygoogle.push({}); }
        catch (error) { status(entry.slot, '광고를 불러오지 못했지만 학습 콘텐츠는 정상입니다.', 'error'); }
      });
    });
    script.addEventListener('error', function () {
      entries.forEach(function (entry) { status(entry.slot, '광고 공급자 연결에 실패했지만 학습 콘텐츠는 정상입니다.', 'error'); });
    });
    document.head.appendChild(script);
  }

  function openPrivacyChoices() {
    if (W.googlefc && typeof W.googlefc.showRevocationMessage === 'function') {
      W.googlefc.showRevocationMessage();
      return true;
    }
    var message = document.getElementById('crhPrivacyChoiceStatus');
    if (message) message.textContent = 'Google 개인정보 메시지가 아직 준비되지 않았습니다. AdSense의 개인정보 보호 및 메시지 설정을 확인해 주세요.';
    return false;
  }

  function init() {
    var mode = pageMode();
    var entries = prepareSlots();
    var reason = '';
    if (!validConfig()) reason = '광고 공개 설정이 유효하지 않아 외부 요청을 차단했습니다.';
    else if (!isProduction()) reason = '로컬·미리보기에서는 실제 광고 요청을 보내지 않습니다.';
    else if (navigator.globalPrivacyControl === true && C.privacy && C.privacy.respectGlobalPrivacyControl) reason = '브라우저의 개인정보 보호 신호를 존중해 광고 요청을 보내지 않습니다.';
    else if (mode === 'excluded') reason = '이 화면은 진단·계정·정책 또는 작업 화면이라 광고를 표시하지 않습니다.';
    if (reason) {
      entries.forEach(function (entry) { status(entry.slot, reason, 'blocked'); });
    } else {
      loadProvider(entries, mode === 'messaging');
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-crh-privacy-choices]'), function (button) {
      button.addEventListener('click', openPrivacyChoices);
    });
    W.CRHAds = Object.freeze({
      configValid: validConfig(),
      production: isProduction(),
      mode: mode,
      openPrivacyChoices: openPrivacyChoices
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
