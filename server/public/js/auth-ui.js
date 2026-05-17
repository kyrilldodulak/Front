(function () {
  'use strict';

  document.querySelectorAll('[data-toggle-password]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.parentElement.querySelector('input');
      if (!input) return;
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'Сховати пароль' : 'Показати пароль');
    });
  });

  document.querySelectorAll('[data-fill]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var form = btn.closest('form') || document;
      var u = form.querySelector('[name="username"]');
      var p = form.querySelector('[name="password"]');
      if (u) u.value = btn.dataset.username || '';
      if (p) p.value = btn.dataset.password || '';
      if (u) u.focus();
    });
  });
})();
