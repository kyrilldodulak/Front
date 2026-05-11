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

  var NAV_ITEMS = [
    {
      href: '/',
      label: 'Головна',
      match: function (p) { return p === '/' || p === '/index.html'; },
      icon: '<path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/>'
    },
    {
      href: '/catalog',
      label: 'Каталог',
      match: function (p) { return p.indexOf('/catalog') === 0 || p.indexOf('/products') === 0; },
      icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'
    },
    {
      href: '/cart.html',
      label: 'Кошик',
      hasCounter: true,
      match: function (p) { return p === '/cart.html' || p === '/checkout.html'; },
      icon: '<path d="M3 3h2l2.4 12.3a2 2 0 002 1.7h7.7a2 2 0 002-1.6L21 8H6"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/>'
    },
    {
      href: '/profile',
      label: 'Профіль',
      match: function (p) { return p.indexOf('/profile') === 0 || p.indexOf('/admin') === 0; },
      icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>'
    }
  ];

  function renderNav() {
    var nav = document.querySelector('#siteHeader nav');
    if (!nav) return;
    var current = window.location.pathname;
    nav.innerHTML = '<ul>' + NAV_ITEMS.map(function (item) {
      var active = item.match(current);
      return '<li><a href="' + item.href + '"' + (active ? ' aria-current="page"' : '') + '>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        item.icon + '</svg>' +
        '<span>' + item.label + '</span>' +
        (item.hasCounter ? ' <span id="cartCount" aria-label="кількість у кошику">0</span>' : '') +
        '</a></li>';
    }).join('') + '</ul>';
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
    renderNav();
    if (window.GameShopCart) {
      var counter = document.getElementById('cartCount');
      if (counter) counter.textContent = String(window.GameShopCart.totalQty());
    }
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
