(function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function getReturnUrl(fallback) {
    try {
      var p = new URLSearchParams(window.location.search).get('return');
      if (p && p.indexOf('/') === 0 && p.indexOf('//') !== 0) return p;
    } catch (e) {}
    return fallback;
  }

  function showError(form, name, message) {
    var span = form.querySelector('[data-error-for="' + name + '"]');
    if (span) span.textContent = message || '';
  }

  function clearAllErrors(form) {
    Array.prototype.forEach.call(
      form.querySelectorAll('[data-error-for]'),
      function (el) { el.textContent = ''; }
    );
  }

  var regForm = document.getElementById('registerForm');
  if (regForm) {
    var emailInput = regForm.querySelector('[name="email"]');
    emailInput.addEventListener('blur', function () {
      if (emailInput.value && !EMAIL_RE.test(emailInput.value)) {
        showError(regForm, 'email', 'Невалідний email');
      } else {
        showError(regForm, 'email', '');
      }
    });

    var passwordInput = regForm.querySelector('[name="password"]');
    passwordInput.addEventListener('blur', function () {
      if (passwordInput.value && passwordInput.value.length < 6) {
        showError(regForm, 'password', 'Пароль має бути ≥ 6 символів');
      } else {
        showError(regForm, 'password', '');
      }
    });

    regForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      clearAllErrors(regForm);

      var data = Object.fromEntries(new FormData(regForm).entries());
      var ok = true;

      if (!data.username || data.username.length < 3) {
        showError(regForm, 'username', 'Логін ≥ 3 символів'); ok = false;
      }
      if (!EMAIL_RE.test(data.email || '')) {
        showError(regForm, 'email', 'Невалідний email'); ok = false;
      }
      if (!data.password || data.password.length < 6) {
        showError(regForm, 'password', 'Пароль ≥ 6 символів'); ok = false;
      }
      if (data.password !== data.password2) {
        showError(regForm, 'password2', 'Паролі не співпадають'); ok = false;
      }
      if (!data.agree) {
        showError(regForm, 'agree', 'Погодьтесь з умовами'); ok = false;
      }

      if (!ok) return;

      var msg = document.getElementById('registerSuccess');

      if (window.GameShopAuth && typeof window.GameShopAuth.register === 'function') {
        window.GameShopAuth.register(data).then(function (res) {
          var success = res && res.ok;
          msg.hidden = false;
          msg.className = success ? 'success-text' : 'error-text';
          msg.textContent = success
            ? 'Реєстрація успішна! Зараз перенаправимо…'
            : ('Помилка: ' + (res && res.error || 'невідома'));
          if (success) setTimeout(function () { window.location.href = getReturnUrl('/profile'); }, 800);
        });
      } else {
        msg.hidden = false;
        msg.textContent = 'Реєстрація прийнята (демо без серверу).';
      }
    });
  }

  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      clearAllErrors(loginForm);
      document.getElementById('loginError').textContent = '';

      var data = Object.fromEntries(new FormData(loginForm).entries());
      if (!data.username) { showError(loginForm, 'username', 'Введіть логін'); return; }
      if (!data.password) { showError(loginForm, 'password', 'Введіть пароль'); return; }

      if (window.GameShopAuth && typeof window.GameShopAuth.login === 'function') {
        window.GameShopAuth.login(data).then(function (res) {
          if (res && res.ok) {
            window.location.href = getReturnUrl('/profile');
          } else {
            document.getElementById('loginError').textContent =
              (res && res.error) || 'Невірний логін або пароль';
          }
        });
      } else {
        document.getElementById('loginError').textContent =
          'Сервер недоступний — це лише фронтенд-демо.';
      }
    });
  }

  var coForm = document.getElementById('checkoutForm');
  if (coForm) {
    var emailCo = coForm.querySelector('[name="email"]');
    emailCo.addEventListener('blur', function () {
      if (emailCo.value && !EMAIL_RE.test(emailCo.value)) {
        showError(coForm, 'email', 'Невалідний email');
      } else {
        showError(coForm, 'email', '');
      }
    });

    coForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      clearAllErrors(coForm);
      var data = Object.fromEntries(new FormData(coForm).entries());
      var ok = true;
      if (!data.fullName || data.fullName.length < 2) {
        showError(coForm, 'fullName', "Введіть ім'я"); ok = false;
      }
      if (!EMAIL_RE.test(data.email || '')) {
        showError(coForm, 'email', 'Невалідний email'); ok = false;
      }
      if (!data.agree) { showError(coForm, 'agree', 'Погодьтесь з умовами'); ok = false; }
      if (!ok) return;

      var items = (window.GameShopCart && window.GameShopCart.getAll()) || [];
      var msg = document.getElementById('checkoutSuccess');
      if (items.length === 0) {
        msg.hidden = false;
        msg.className = 'error-text';
        msg.textContent = 'Кошик порожній';
        return;
      }

      var submitBtn = coForm.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Обробляємо…'; }
      var lastStatus = 0;
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ customer: data, items: items })
      })
        .then(function (r) {
          lastStatus = r.status;
          if (!r.ok) return r.json().then(function (body) {
            throw new Error(body.error || 'server_error');
          }).catch(function () {
            throw new Error('server_error');
          });
          return r.json();
        })
        .then(function (order) {
          msg.hidden = false;
          msg.className = 'success-text';
          msg.textContent = 'Замовлення №' + order.id + ' прийнято! Ключі вже на пошті.';
          window.GameShopCart.clear();
          setTimeout(function () { window.location.href = '/profile'; }, 1500);
        })
        .catch(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Підтвердити замовлення'; }
          msg.hidden = false;
          msg.className = 'error-text';
          msg.textContent = lastStatus === 401
            ? 'Увійдіть, щоб оформити замовлення.'
            : 'Не вдалося оформити замовлення. Спробуйте ще раз.';
        });
    });
  }

})();
