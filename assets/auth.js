/* Readiness Hub 인증 경계와 내 계정 UI — 특정 제공자에 종속되지 않는다. */
(function (root) {
  'use strict';

  var SETTINGS_KEY = 'crh:account-settings:v1';
  var STATES = ['checking', 'signedOut', 'signingIn', 'signedIn', 'recoverableError', 'configurationError'];

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeError(error) {
    var code = error && (error.code || error.name) || 'AUTH_UNKNOWN_ERROR';
    var recoverable = /cancel|closed|popup|network|offline|timeout/i.test(code);
    return {
      code: code,
      recoverable: recoverable,
      message: recoverable
        ? '로그인이 취소되었거나 연결이 불안정합니다. 원할 때 다시 시도할 수 있습니다.'
        : '로그인 설정을 확인해야 합니다. 진단 기능은 로그인 없이 계속 이용할 수 있습니다.'
    };
  }

  function createController(provider) {
    var listeners = [];
    var unsubscribeProvider = null;
    var state = { status: 'checking', user: null, error: null, configured: !!provider };

    function emit(next) {
      state = Object.assign({}, state, next);
      listeners.slice().forEach(function (listener) { listener(copy(state)); });
      return copy(state);
    }

    function setUser(user) {
      return emit({ status: user ? 'signedIn' : 'signedOut', user: user || null, error: null });
    }

    async function initializeAuthState() {
      emit({ status: 'checking', error: null, configured: !!provider });
      if (!provider) return emit({ status: 'signedOut', user: null, error: null, configured: false });
      try {
        var user = provider.initializeAuthState ? await provider.initializeAuthState() : null;
        if (provider.subscribeAuthState && !unsubscribeProvider) {
          unsubscribeProvider = provider.subscribeAuthState(function (nextUser) { setUser(nextUser); });
        }
        return setUser(user);
      } catch (error) {
        var info = normalizeError(error);
        return emit({ status: info.recoverable ? 'recoverableError' : 'configurationError', user: null, error: info });
      }
    }

    async function signInWithGoogle() {
      if (!provider || !provider.signInWithGoogle) {
        return emit({
          status: 'configurationError', user: null, configured: false,
          error: { code: 'AUTH_BACKEND_MISSING', recoverable: false, message: '안전한 Google 인증 연결이 아직 설정되지 않았습니다. 진단 기능은 로그인 없이 계속 이용할 수 있습니다.' }
        });
      }
      if (state.status === 'signingIn') return copy(state);
      emit({ status: 'signingIn', error: null });
      try { return setUser(await provider.signInWithGoogle()); }
      catch (error) {
        var info = normalizeError(error);
        return emit({ status: info.recoverable ? 'recoverableError' : 'configurationError', user: null, error: info });
      }
    }

    async function refreshAuthState() {
      if (!provider || !provider.refreshAuthState) return copy(state);
      try { return setUser(await provider.refreshAuthState()); }
      catch (error) {
        var info = normalizeError(error);
        return emit({ status: info.recoverable ? 'recoverableError' : 'configurationError', error: info });
      }
    }

    async function updateDisplayName(displayName) {
      if (state.status !== 'signedIn' || !provider || !provider.updateDisplayName) throw new Error('AUTH_REQUIRED');
      var clean = String(displayName || '').trim().slice(0, 80);
      if (!clean) throw new Error('DISPLAY_NAME_REQUIRED');
      var updated = await provider.updateDisplayName(clean);
      return setUser(updated || Object.assign({}, state.user, { displayName: clean }));
    }

    async function signOut() {
      if (!provider || !provider.signOut) return setUser(null);
      await provider.signOut();
      return setUser(null);
    }

    function subscribeAuthState(listener) {
      listeners.push(listener);
      listener(copy(state));
      return function () { listeners = listeners.filter(function (item) { return item !== listener; }); };
    }

    function destroy() {
      if (typeof unsubscribeProvider === 'function') unsubscribeProvider();
      unsubscribeProvider = null;
      listeners = [];
    }

    return {
      initializeAuthState: initializeAuthState,
      signInWithGoogle: signInWithGoogle,
      subscribeAuthState: subscribeAuthState,
      refreshAuthState: refreshAuthState,
      updateDisplayName: updateDisplayName,
      signOut: signOut,
      getState: function () { return copy(state); },
      destroy: destroy
    };
  }

  function readSettings() {
    try {
      var parsed = JSON.parse(root.localStorage.getItem(SETTINGS_KEY) || '{}');
      return { language: parsed.language === 'ko' ? 'ko' : 'ko', dailyGoal: [5, 10, 15, 20, 30].indexOf(+parsed.dailyGoal) >= 0 ? +parsed.dailyGoal : 10 };
    } catch (_) { return { language: 'ko', dailyGoal: 10 }; }
  }

  function saveSettings(settings) {
    root.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ schema: 'crh-account-settings/v1', language: settings.language, dailyGoal: settings.dailyGoal }));
  }

  function maskEmail(email) {
    var value = String(email || '');
    var at = value.indexOf('@');
    if (at < 1) return '표시 안 함';
    var name = value.slice(0, at);
    return name.slice(0, 2) + '***@' + value.slice(at + 1);
  }

  function getBase() {
    var path = root.location.pathname;
    var marker = '/m/';
    if (path.indexOf(marker) >= 0) path = path.slice(0, path.indexOf(marker) + 1);
    else path = path.replace(/(?:dashboard|index)\.html$/, '').replace(/(?:help\/account\/)?$/, '');
    if (!path.endsWith('/')) path += '/';
    return root.location.origin + path;
  }

  function injectStyles() {
    if (document.getElementById('crh-auth-style')) return;
    var style = document.createElement('style');
    style.id = 'crh-auth-style';
    style.textContent = '.crh-account-bar{display:flex;justify-content:flex-end;align-items:center;gap:8px;padding:7px 14px;background:var(--panel,#fff);border-bottom:1px solid var(--bd,var(--border,#ddd));font:12px/1.4 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:var(--muted,#666)}'
      + '.crh-account-bar button,.crh-account-dialog button,.crh-account-dialog input,.crh-account-dialog select{font:inherit}'
      + '.crh-account-launch{min-height:44px;padding:9px 12px;border:1px solid var(--bd,var(--border,#ccc));border-radius:8px;background:var(--panel,#fff);color:var(--ink,#111);font-weight:650;cursor:pointer}'
      + '.crh-account-launch:focus-visible,.crh-account-dialog button:focus-visible,.crh-account-dialog input:focus-visible,.crh-account-dialog select:focus-visible{outline:3px solid #2a78d6;outline-offset:2px}'
      + '.crh-account-dialog{width:560px;max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);border:1px solid rgba(127,127,127,.35);border-radius:14px;padding:0;background:var(--panel,#fff);color:var(--ink,#111);box-shadow:0 20px 80px rgba(0,0,0,.28)}'
      + '.crh-account-dialog::backdrop{background:rgba(0,0,0,.48)}.crh-account-head{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid rgba(127,127,127,.24)}'
      + '.crh-account-head h2{font-size:18px;margin:0;flex:1}.crh-account-close{border:0;background:transparent;color:inherit;font-size:22px;min-width:38px;min-height:38px;cursor:pointer}'
      + '.crh-account-body{padding:18px;overflow:auto}.crh-account-body p{margin:0 0 12px}.crh-account-status{padding:10px 12px;border-left:3px solid #fab219;background:rgba(127,127,127,.08);border-radius:7px;margin-bottom:14px}'
      + '.crh-account-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.crh-account-grid label{display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--muted,#666)}'
      + '.crh-account-grid input,.crh-account-grid select{min-height:42px;padding:8px 10px;border:1px solid rgba(127,127,127,.35);border-radius:8px;background:var(--panel,#fff);color:var(--ink,#111)}'
      + '.crh-account-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.crh-account-actions button{min-height:42px;padding:8px 12px;border:1px solid rgba(127,127,127,.35);border-radius:8px;background:var(--panel,#fff);color:var(--ink,#111);font-weight:650;cursor:pointer}'
      + '.crh-account-actions .primary{background:var(--ink,#111);color:var(--plane,#fff)}.crh-account-links{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;font-size:12px}.crh-account-links a{color:inherit;text-decoration:underline}'
      + '@media(max-width:520px){.crh-account-grid{grid-template-columns:1fr}.crh-account-bar{justify-content:space-between}.crh-account-bar span{max-width:42%;font-size:11px}}';
    document.head.appendChild(style);
  }

  function makeUi(controller) {
    injectStyles();
    var bar = document.createElement('div');
    bar.className = 'crh-account-bar';
    bar.innerHTML = '<span>진단은 로그인 없이 이용할 수 있습니다.</span><button type="button" class="crh-account-launch" id="crhAccountLaunch">로그인 확인 중…</button>';
    document.body.insertBefore(bar, document.body.firstChild);

    var dialog = document.createElement('dialog');
    dialog.className = 'crh-account-dialog';
    dialog.id = 'crhAccountDialog';
    dialog.setAttribute('aria-labelledby', 'crhAccountTitle');
    dialog.innerHTML = '<div class="crh-account-head"><h2 id="crhAccountTitle">내 계정</h2><button type="button" class="crh-account-close" aria-label="닫기">×</button></div><div class="crh-account-body" id="crhAccountBody"></div>';
    document.body.appendChild(dialog);

    var launcher = document.getElementById('crhAccountLaunch');
    var body = document.getElementById('crhAccountBody');
    var settings = readSettings();
    var lastFocus = null;

    function openDialog() {
      lastFocus = document.activeElement;
      if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
    }
    function closeDialog() {
      if (dialog.close) dialog.close(); else dialog.removeAttribute('open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function render(state) {
      launcher.disabled = state.status === 'checking' || state.status === 'signingIn';
      launcher.textContent = state.status === 'signedIn' ? '내 계정'
        : state.status === 'checking' ? '로그인 확인 중…'
        : state.status === 'signingIn' ? '로그인 진행 중…'
        : state.status === 'configurationError' ? '로그인 설정 확인'
        : 'Google로 로그인·무료 가입';

      var status = state.error ? '<div class="crh-account-status" role="alert"><b>' + state.error.code + '</b><br>' + state.error.message + '</div>' : '';
      if (state.status !== 'signedIn') {
        body.innerHTML = status
          + '<p><b>Google 최초 로그인은 무료 가입과 같은 한 번의 흐름입니다.</b></p>'
          + '<p>로그인하지 않아도 퀵체크·진단·저장·공유 기능을 계속 사용할 수 있습니다. 로그인 상태와 로컬 진단 자료는 자동으로 합쳐지거나 업로드되지 않습니다.</p>'
          + '<div class="crh-account-actions"><button type="button" class="primary" data-auth-action="signin"' + (state.status === 'signingIn' ? ' disabled' : '') + '>Google로 로그인·무료 가입</button></div>'
          + legalLinks();
        return;
      }
      var user = state.user || {};
      body.innerHTML = status
        + '<div class="crh-account-status"><b>연결 제공자:</b> Google<br><b>계정:</b> ' + maskEmail(user.email) + '</div>'
        + '<div class="crh-account-grid"><label>표시 이름<input id="crhDisplayName" maxlength="80" value="' + escapeAttr(user.displayName || '') + '"></label>'
        + '<label>표시 언어<select id="crhLanguage"><option value="ko">한국어</option></select></label>'
        + '<label>하루 목표<select id="crhDailyGoal">' + [5,10,15,20,30].map(function (n) { return '<option value="' + n + '"' + (settings.dailyGoal === n ? ' selected' : '') + '>' + n + '분</option>'; }).join('') + '</select></label></div>'
        + '<p style="margin-top:14px">Google 비밀번호·2단계 인증·로그인 기기는 Google 계정에서 관리합니다. 로컬 진단 자료는 로그인·로그아웃 때 자동 업로드하거나 삭제하지 않습니다.</p>'
        + '<div class="crh-account-actions"><button type="button" class="primary" data-auth-action="save">이름·설정 저장</button><button type="button" data-auth-action="backup">백업 파일 만들기</button><button type="button" data-auth-action="restore">백업 불러오기</button><button type="button" data-auth-action="signout">로그아웃</button></div>'
        + legalLinks();
    }

    function legalLinks() {
      var base = root.CRH_URLS && root.CRH_URLS.base || getBase();
      return '<div class="crh-account-links"><a href="' + base + 'privacy/">개인정보 처리방침</a><a href="' + base + 'help/account/">계정 도움말</a><a href="' + base + 'account/delete/">로컬 데이터 삭제</a></div>';
    }

    function escapeAttr(value) {
      return String(value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
    }

    launcher.addEventListener('click', openDialog);
    dialog.querySelector('.crh-account-close').addEventListener('click', closeDialog);
    dialog.addEventListener('click', function (event) { if (event.target === dialog) closeDialog(); });
    body.addEventListener('click', async function (event) {
      var button = event.target.closest('[data-auth-action]');
      if (!button) return;
      var action = button.getAttribute('data-auth-action');
      if (action === 'signin') await controller.signInWithGoogle();
      if (action === 'signout') await controller.signOut();
      if (action === 'save') {
        settings.language = document.getElementById('crhLanguage').value;
        settings.dailyGoal = +document.getElementById('crhDailyGoal').value;
        saveSettings(settings);
        try { await controller.updateDisplayName(document.getElementById('crhDisplayName').value); }
        catch (_) { body.insertAdjacentHTML('afterbegin', '<div class="crh-account-status" role="alert">표시 이름을 저장하지 못했습니다. 로그인 상태를 확인해 주세요.</div>'); }
      }
      if (action === 'backup') {
        var exportButton = document.getElementById('btnExport') || document.getElementById('bSave');
        if (exportButton) exportButton.click(); else body.insertAdjacentHTML('afterbegin', '<div class="crh-account-status" role="status">이 화면에서는 진단 페이지의 JSON 저장을 이용해 주세요.</div>');
      }
      if (action === 'restore') {
        var importButton = document.getElementById('btnImport') || document.getElementById('bLoad');
        if (importButton) importButton.click(); else body.insertAdjacentHTML('afterbegin', '<div class="crh-account-status" role="status">이 화면에서는 진단 페이지의 불러오기를 이용해 주세요.</div>');
      }
    });
    root.addEventListener('focus', function () { controller.refreshAuthState(); });
    controller.subscribeAuthState(render);
    controller.initializeAuthState();
  }

  var controller = createController(root.CRH_AUTH_PROVIDER || null);
  root.CRHAuth = {
    states: STATES.slice(),
    createController: createController,
    controller: controller,
    settingsKey: SETTINGS_KEY,
    maskEmail: maskEmail
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { makeUi(controller); });
  else makeUi(controller);
})(window);
