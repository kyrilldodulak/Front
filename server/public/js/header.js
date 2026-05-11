(function () {
  'use strict';

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    }
    if (text) n.textContent = text;
    return n;
  }

  function renderAuthBlock(user) {
    var block = document.getElementById('authBlock');
    if (!block) return;
    block.innerHTML = '';
    if (user) {
      if (user.role === 'admin') {
        block.appendChild(el('a', { class: 'btn btn-ghost', href: '/admin' }, 'Адмін'));
      }
      block.appendChild(el('span', { class: 'muted' }, 'Привіт, ' + user.username));
      block.appendChild(el('a', { class: 'btn btn-ghost', href: '/profile' }, 'Профіль'));
      var logout = el('button', { class: 'btn btn-primary', type: 'button' }, 'Вийти');
      logout.addEventListener('click', function () {
        api.logout().then(function () { window.location.href = '/'; });
      });
      block.appendChild(logout);
    } else {
      block.appendChild(el('a', { class: 'btn btn-ghost', href: '/login.html' }, 'Увійти'));
      block.appendChild(el('a', { class: 'btn btn-primary', href: '/register.html' }, 'Реєстрація'));
    }
  }

  function jsonRequest(url, options) {
    options = options || {};
    options.credentials = 'include';
    return fetch(url, options)
      .then(function (r) {
        return r.json().then(function (body) {
          return { ok: r.ok, status: r.status, body: body };
        });
      })
      .catch(function () { return { ok: false, status: 0, body: { error: 'Сервер недоступний' } }; });
  }

  var api = {
    me: function () {
      return jsonRequest('/api/auth/me').then(function (res) {
        return res.ok ? res.body : { user: null };
      });
    },
    register: function (data) {
      return jsonRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        return { ok: res.ok, error: res.body.error, user: res.body.user };
      });
    },
    login: function (data) {
      return jsonRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        return { ok: res.ok, error: res.body.error, user: res.body.user };
      });
    },
    logout: function () {
      return jsonRequest('/api/auth/logout', { method: 'POST' });
    }
  };

  window.GameShopAuth = api;

  document.addEventListener('DOMContentLoaded', function () {
    api.me().then(function (res) { renderAuthBlock(res && res.user); });
  });

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('backToTop');
    if (!btn) return;
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', function () {
      btn.hidden = window.scrollY < 600;
    }, { passive: true });
  });

})();
