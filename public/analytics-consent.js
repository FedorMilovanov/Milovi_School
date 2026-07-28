/* Patisserie Russe / Milovi School — privacy-first analytics loader. */
(function () {
  'use strict';

  var config = window.__MILOVI_SCHOOL_ANALYTICS__ || {};
  var gaId = typeof config.gaId === 'string' ? config.gaId.trim() : '';
  var yandexId = Number.isFinite(Number(config.yandexId)) ? Number(config.yandexId) : null;
  if (!gaId && !yandexId) return;

  var STORAGE_KEY = 'milovi_school_analytics_consent_v1';
  var choice = readChoice();
  var loaded = false;
  var dialog = null;
  var settingsButton = null;

  function readChoice() {
    try {
      var value = localStorage.getItem(STORAGE_KEY);
      return value === 'granted' || value === 'denied' ? value : null;
    } catch (_) {
      return null;
    }
  }

  function saveChoice(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (_) {}
    choice = value;
  }

  function ensureStyles() {
    if (document.getElementById('prs-consent-style')) return;
    var style = document.createElement('style');
    style.id = 'prs-consent-style';
    style.textContent = [
      '.prs-consent{position:fixed;z-index:2147483000;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(760px,calc(100% - 28px));padding:20px;border:1px solid rgba(180,125,45,.42);border-radius:20px;background:rgba(16,16,15,.97);color:#f5efe5;box-shadow:0 24px 72px rgba(0,0,0,.45);font:400 15px/1.55 system-ui,sans-serif;backdrop-filter:blur(16px)}',
      '.prs-consent[hidden]{display:none!important}.prs-consent h2{margin:0 0 8px;font:600 24px/1.18 Georgia,serif}.prs-consent p{margin:0;color:#d6cec2}.prs-consent a{color:#e5b85f}.prs-consent__actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px;margin-top:16px}',
      '.prs-consent button{min-height:44px;padding:10px 18px;border-radius:999px;border:1px solid rgba(229,184,95,.45);font:600 14px/1 system-ui,sans-serif;cursor:pointer}.prs-consent__deny{background:transparent;color:#f5efe5}.prs-consent__allow{background:#e5b85f;color:#17130d;border-color:#e5b85f}',
      '.prs-consent-settings{position:fixed;z-index:2147482000;right:14px;bottom:max(14px,env(safe-area-inset-bottom));min-height:38px;padding:8px 13px;border-radius:999px;border:1px solid rgba(180,125,45,.42);background:rgba(16,16,15,.92);color:#f5efe5;font:500 12px/1.2 system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.25)}',
      '@media(max-width:560px){.prs-consent{padding:17px}.prs-consent__actions{display:grid;grid-template-columns:1fr 1fr}.prs-consent button{width:100%}.prs-consent-settings{right:10px;bottom:10px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function loadGoogle() {
    if (!gaId || document.querySelector('script[data-prs-ga]')) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', gaId, {
      transport_type: 'beacon',
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    var script = document.createElement('script');
    script.async = true;
    script.dataset.prsGa = '1';
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
    document.head.appendChild(script);
  }

  function loadYandex() {
    if (!yandexId || document.querySelector('script[data-prs-ym]')) return;
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    window.ym(yandexId, 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true
    });
    var script = document.createElement('script');
    script.async = true;
    script.dataset.prsYm = '1';
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.appendChild(script);
  }

  function loadAnalytics() {
    if (loaded || choice !== 'granted') return;
    loaded = true;
    loadGoogle();
    loadYandex();
  }

  function setChoice(value) {
    saveChoice(value);
    if (dialog) dialog.hidden = true;
    renderSettingsButton();
    if (value === 'granted') {
      loadAnalytics();
      return;
    }
    if (gaId) window['ga-disable-' + gaId] = true;
    if (loaded) location.reload();
  }

  function open() {
    ensureStyles();
    if (!dialog) {
      dialog = document.createElement('section');
      dialog.className = 'prs-consent';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'false');
      dialog.setAttribute('aria-labelledby', 'prs-consent-title');
      dialog.innerHTML = '' +
        '<h2 id="prs-consent-title">Помочь улучшать библиотеку?</h2>' +
        '<p>Необязательная аналитика Google и Яндекса загружается только после согласия. Отказ не ограничивает чтение, поиск и сохранение материалов. Подробнее — в <a href="/privacy/">политике конфиденциальности</a>.</p>' +
        '<div class="prs-consent__actions">' +
          '<button class="prs-consent__deny" type="button" data-choice="denied">Без аналитики</button>' +
          '<button class="prs-consent__allow" type="button" data-choice="granted">Разрешить</button>' +
        '</div>';
      dialog.addEventListener('click', function (event) {
        var target = event.target.closest('[data-choice]');
        if (target) setChoice(target.getAttribute('data-choice'));
      });
      document.body.appendChild(dialog);
    }
    dialog.hidden = false;
    var first = dialog.querySelector('[data-choice="denied"]');
    if (first) first.focus({ preventScroll: true });
  }

  function renderSettingsButton() {
    ensureStyles();
    if (settingsButton) return;
    settingsButton = document.createElement('button');
    settingsButton.type = 'button';
    settingsButton.className = 'prs-consent-settings';
    settingsButton.textContent = 'Конфиденциальность';
    settingsButton.setAttribute('aria-label', 'Изменить настройки аналитики');
    settingsButton.addEventListener('click', open);
    document.body.appendChild(settingsButton);
  }

  function init() {
    ensureStyles();
    if (choice === 'granted') loadAnalytics();
    if (choice) renderSettingsButton();
    else open();
  }

  window.MiloviSchoolConsent = {
    open: open,
    getChoice: function () { return choice; },
    grant: function () { setChoice('granted'); },
    deny: function () { setChoice('denied'); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
