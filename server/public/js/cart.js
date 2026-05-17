(function () {
  'use strict';

  var COUNT_CACHE_KEY = 'gameshop.cart.count';
  function makeKey(username) {
    return 'gameshop.cart.v1:' + (username || 'guest');
  }
  var STORAGE_KEY = makeKey(null);
  var sessionReady = false;

  function totalQty(items) {
    return items.reduce(function (s, it) { return s + it.qty; }, 0);
  }
  function writeCountCache(items) {
    try { localStorage.setItem(COUNT_CACHE_KEY, String(totalQty(items))); } catch (e) {}
  }
  function readCountCache() {
    try {
      var v = localStorage.getItem(COUNT_CACHE_KEY);
      var n = v ? Number(v) : 0;
      return isFinite(n) && n >= 0 ? n : 0;
    } catch (e) { return 0; }
  }

  function read() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    writeCountCache(items);
    document.dispatchEvent(new CustomEvent('cart:changed', { detail: items }));
  }

  function totalSum(items) {
    return items.reduce(function (s, it) { return s + it.qty * it.price; }, 0);
  }

  function flash(message) {
    var el = document.createElement('div');
    el.textContent = message;
    el.setAttribute('role', 'status');
    el.style.cssText =
      'position:fixed;top:80px;right:24px;background:#51cf66;color:#0f1420;' +
      'padding:10px 16px;border-radius:8px;font-weight:600;box-shadow:0 8px 20px rgba(0,0,0,0.3);' +
      'z-index:1000;opacity:0;transition:opacity 0.25s,transform 0.25s;transform:translateY(-8px);';
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(function () { el.remove(); }, 300);
    }, 1800);
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  var api = {
    getAll: read,

    add: function (product, qty) {
      qty = qty || 1;
      var items = read();
      var existing = items.find(function (it) { return it.id === product.id; });
      if (existing) {
        existing.qty += qty;
      } else {
        items.push({
          id: product.id,
          title: product.title,
          price: Number(product.price) || 0,
          image: product.image || null,
          qty: qty
        });
      }
      write(items);
      flash(product.title + ' додано до кошика');
    },

    setQty: function (id, qty) {
      var items = read();
      var item = items.find(function (it) { return it.id === id; });
      if (!item) return;
      item.qty = Math.max(1, Math.min(99, Number(qty) || 1));
      write(items);
    },

    remove: function (id) {
      var items = read().filter(function (it) { return it.id !== id; });
      write(items);
    },

    clear: function () { write([]); },

    totalQty: function () { return totalQty(read()); },
    totalSum: function () { return totalSum(read()); },

    switchUser: function (username) {
      sessionReady = true;
      var oldKey = STORAGE_KEY;
      var newKey = makeKey(username);
      if (oldKey === newKey) {
        document.dispatchEvent(new CustomEvent('cart:changed', { detail: read() }));
        return;
      }
      var prevItems = read();
      STORAGE_KEY = newKey;
      if (prevItems.length > 0 && oldKey === makeKey(null)) {
        var nextItems = read();
        prevItems.forEach(function (item) {
          var existing = nextItems.find(function (i) { return i.id === item.id; });
          if (existing) { existing.qty += item.qty; }
          else { nextItems.push(item); }
        });
        localStorage.removeItem(oldKey);
        write(nextItems);
      } else {
        var current = read();
        writeCountCache(current);
        document.dispatchEvent(new CustomEvent('cart:changed', { detail: current }));
      }
    },

    cachedCount: readCountCache
  };

  window.GameShopCart = api;

  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-add-to-cart]');
    if (!btn) return;
    ev.preventDefault();
    api.add({
      id: btn.dataset.id,
      title: btn.dataset.title,
      price: btn.dataset.price,
      image: btn.dataset.image
    });
  });

  window.addEventListener('storage', function (ev) {
    if (ev.key === STORAGE_KEY) {
      document.dispatchEvent(new CustomEvent('cart:changed', { detail: read() }));
    }
  });

  function renderCartPage() {
    var items = read();
    var listEl = document.getElementById('cartItems');
    var emptyEl = document.getElementById('cartEmpty');

    var pendingFetch = !sessionReady && readCountCache() > 0 && items.length === 0;

    var checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      if (items.length === 0) checkoutBtn.setAttribute('aria-disabled', 'true');
      else checkoutBtn.removeAttribute('aria-disabled');
    }

    if (listEl) {
      if (pendingFetch) {
        listEl.innerHTML = '<div class="card" style="text-align:center;padding:32px;color:var(--muted);">Завантаження кошика…</div>';
        if (emptyEl) emptyEl.hidden = true;
      } else if (items.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.hidden = false;
      } else {
        if (emptyEl) emptyEl.hidden = true;
        listEl.innerHTML = items.map(function (it) {
          var safeTitle = escapeHtml(it.title);
          var img = it.image ? it.image : '/images/cover-1.svg';
          return (
            '<article class="cart-item" data-id="' + it.id + '">' +
              '<img src="' + img + '" alt="' + safeTitle + '">' +
              '<div class="info">' +
                '<h3 class="game-title">' + safeTitle + '</h3>' +
                '<span class="muted">' + it.price + ' ₴ × ' + it.qty + '</span>' +
              '</div>' +
              '<div class="qty">' +
                '<button class="btn btn-ghost" data-qty-action="dec" aria-label="зменшити">−</button>' +
                '<input type="number" min="1" max="99" value="' + it.qty + '" data-qty-input>' +
                '<button class="btn btn-ghost" data-qty-action="inc" aria-label="збільшити">+</button>' +
              '</div>' +
              '<button class="btn btn-danger remove" data-remove>×</button>' +
            '</article>'
          );
        }).join('');
      }
    }

    var sub = totalSum(items);
    var qty = totalQty(items);
    var discount = Math.round(sub * 0.05);
    var total = sub - discount;
    setText('sumQty', String(qty));
    setText('sumSubtotal', sub + ' ₴');
    setText('sumDiscount', '−' + discount + ' ₴');
    setText('sumTotal', total + ' ₴');

    var checkoutSummary = document.getElementById('checkoutSummaryItems');
    if (checkoutSummary) {
      if (items.length === 0) {
        checkoutSummary.innerHTML =
          '<p class="muted" style="padding:8px 0;">Кошик порожній. <a href="/cart.html">Перейти в кошик</a></p>';
      } else {
        checkoutSummary.innerHTML = items.map(function (it) {
          return '<div class="row">' +
            '<span class="row-title" title="' + escapeHtml(it.title) + '">' + escapeHtml(it.title) + ' × ' + it.qty + '</span>' +
            '<span class="row-price">' + (it.price * it.qty) + ' ₴</span>' +
            '</div>';
        }).join('');
      }
    }
  }

  document.addEventListener('click', function (ev) {
    var item = ev.target.closest('.cart-item');
    if (!item) return;
    var id = item.dataset.id;
    var rm = ev.target.closest('[data-remove]');
    if (rm) { api.remove(id); return; }
    var act = ev.target.closest('[data-qty-action]');
    if (act) {
      var input = item.querySelector('[data-qty-input]');
      var current = Number(input.value) || 1;
      api.setQty(id, act.dataset.qtyAction === 'inc' ? current + 1 : current - 1);
    }
  });

  document.addEventListener('change', function (ev) {
    var input = ev.target.closest('.cart-item [data-qty-input]');
    if (!input) return;
    var id = input.closest('.cart-item').dataset.id;
    api.setQty(id, input.value);
  });

  document.addEventListener('cart:changed', renderCartPage);
  document.addEventListener('DOMContentLoaded', renderCartPage);

  document.addEventListener('DOMContentLoaded', function () {
    var clearBtn = document.getElementById('clearCart');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (confirm('Очистити кошик?')) api.clear();
      });
    }
  });

})();
