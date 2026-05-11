(function () {
  'use strict';

  function buildModal(title, message, locked) {
    var existing = document.getElementById('authGuardModal');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'authGuardModal';
    overlay.className = 'modal-overlay open';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    var returnUrl = encodeURIComponent(window.location.pathname + window.location.search);

    overlay.innerHTML =
      '<div class="modal-card auth-modal" role="document">' +
      (locked ? '' : '<button class="modal-close" type="button" aria-label="Закрити">×</button>') +
      '  <div class="auth-modal-icon" aria-hidden="true">' +
      '    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
      '      <rect x="4" y="11" width="16" height="10" rx="2"/>' +
      '      <path d="M8 11V7a4 4 0 018 0v4"/>' +
      '    </svg>' +
      '  </div>' +
      '  <div class="modal-body" style="text-align:center;gap:8px;">' +
      '    <h3 class="modal-title">' + title + '</h3>' +
      '    <p class="muted">' + message + '</p>' +
      '    <div class="auth-modal-actions">' +
      '      <a class="btn btn-primary" href="/login.html?return=' + returnUrl + '">Увійти</a>' +
      '      <a class="btn btn-ghost" href="/register.html?return=' + returnUrl + '">Реєстрація</a>' +
      '    </div>' +
      (locked
        ? '    <a class="btn btn-ghost btn-sm" style="margin-top:6px;" href="/cart.html">← Повернутись до кошика</a>'
        : '    <button class="btn btn-ghost btn-sm" data-cancel type="button" style="margin-top:6px;">Продовжити перегляд</button>') +
      '  </div>' +
      '</div>';

    document.body.appendChild(overlay);

    function close() { overlay.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(ev) { if (!locked && ev.key === 'Escape') close(); }

    if (!locked) {
      overlay.addEventListener('click', function (ev) { if (ev.target === overlay) close(); });
      var closeBtn = overlay.querySelector('.modal-close');
      if (closeBtn) closeBtn.addEventListener('click', close);
      var cancelBtn = overlay.querySelector('[data-cancel]');
      if (cancelBtn) cancelBtn.addEventListener('click', close);
    }
    document.addEventListener('keydown', onKey);
    return overlay;
  }

  function ensureAuthCheck(callback) {
    if (!window.GameShopAuth) { callback(null); return; }
    window.GameShopAuth.me().then(function (res) {
      callback(res && res.user ? res.user : null);
    });
  }

  function setupCartGuard() {
    var btn = document.getElementById('checkoutBtn');
    if (!btn) return;
    var cachedUser = null;
    var checked = false;

    ensureAuthCheck(function (user) { cachedUser = user; checked = true; });

    btn.addEventListener('click', function (ev) {
      if (btn.getAttribute('aria-disabled') === 'true') {
        ev.preventDefault();
        return;
      }
      if (!checked) {
        ev.preventDefault();
        ensureAuthCheck(function (user) {
          cachedUser = user;
          checked = true;
          if (user) window.location.href = btn.getAttribute('href') || '/checkout.html';
          else buildModal(
            'Потрібен обліковий запис',
            'Для оформлення замовлення увійдіть або зареєструйтесь — це займе 30 секунд.',
            false
          );
        });
        return;
      }
      if (!cachedUser) {
        ev.preventDefault();
        buildModal(
          'Потрібен обліковий запис',
          'Для оформлення замовлення увійдіть або зареєструйтесь — це займе 30 секунд.',
          false
        );
      }
    });
  }

  function setupCheckoutGuard() {
    var form = document.getElementById('checkoutForm');
    if (!form) return;
    ensureAuthCheck(function (user) {
      if (user) return;
      Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea, button'), function (el) {
        el.disabled = true;
      });
      form.style.opacity = '0.5';
      form.style.pointerEvents = 'none';
      buildModal(
        'Увійдіть для оформлення',
        'Щоб ми могли зберегти замовлення у вашому профілі та надсилати оновлення про доставку — потрібен обліковий запис.',
        true
      );
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupCartGuard();
    setupCheckoutGuard();
  });
})();
