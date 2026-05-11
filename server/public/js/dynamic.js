(function () {
  'use strict';

  var grid = document.getElementById('popularGrid');
  if (!grid) return;

  function ensureModal() {
    var existing = document.getElementById('quickPreviewModal');
    if (existing) return existing;

    var overlay = document.createElement('div');
    overlay.id = 'quickPreviewModal';
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div class="modal-card" role="document">' +
      '  <button class="modal-close" type="button" aria-label="Закрити">×</button>' +
      '  <img class="modal-cover" alt="">' +
      '  <div class="modal-body">' +
      '    <h3 class="modal-title"></h3>' +
      '    <ul class="tag-list modal-tags" aria-label="жанри"></ul>' +
      '    <div class="modal-row">' +
      '      <span class="price modal-price"></span>' +
      '      <button class="btn btn-primary modal-add" type="button">Додати до кошика</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(overlay);

    function close() {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', onKey);
    }
    function onKey(ev) {
      if (ev.key === 'Escape') close();
    }
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) close();
    });
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay._close = close;
    overlay._onKey = onKey;
    return overlay;
  }

  function openPreview(card) {
    var modal = ensureModal();
    var img = card.querySelector('.cover');
    var title = card.querySelector('.game-title');
    var price = card.querySelector('.price');
    var tags = card.querySelectorAll('.tag-list li');
    var addBtn = card.querySelector('[data-add-to-cart]');

    var coverEl = modal.querySelector('.modal-cover');
    coverEl.src = img ? img.src : '';
    coverEl.alt = img ? img.alt : '';
    modal.querySelector('.modal-title').textContent = title ? title.textContent : 'Гра';
    modal.querySelector('.modal-price').textContent = price ? price.textContent : '';

    var tagsHost = modal.querySelector('.modal-tags');
    tagsHost.innerHTML = '';
    Array.prototype.forEach.call(tags, function (t) {
      var li = document.createElement('li');
      li.textContent = t.textContent;
      tagsHost.appendChild(li);
    });

    var addClone = modal.querySelector('.modal-add');
    addClone.onclick = function () {
      if (addBtn && window.GameShopCart) {
        window.GameShopCart.add({
          id: addBtn.dataset.id,
          title: addBtn.dataset.title,
          price: addBtn.dataset.price,
          image: addBtn.dataset.image
        });
      }
      modal._close();
    };

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.addEventListener('keydown', modal._onKey);
  }

  var modes = {
    quickbuy: function (card) {
      var btn = card.querySelector('[data-add-to-cart]');
      if (btn && window.GameShopCart) {
        window.GameShopCart.add({
          id: btn.dataset.id,
          title: btn.dataset.title,
          price: btn.dataset.price,
          image: btn.dataset.image
        });
      }
    },
    preview: openPreview
  };

  var currentHandler = null;

  function clickHandlerFactory(modeFn) {
    return function (ev) {
      if (ev.target.closest('[data-add-to-cart]')) return;
      var card = ev.target.closest('.game-card');
      if (!card) return;
      ev.preventDefault();
      modeFn(card);
    };
  }

  function setMode(mode) {
    if (currentHandler) {
      grid.removeEventListener('click', currentHandler);
      currentHandler = null;
    }
    if (mode && modes[mode]) {
      currentHandler = clickHandlerFactory(modes[mode]);
      grid.addEventListener('click', currentHandler);
    }
  }

  var bar = document.createElement('div');
  bar.className = 'mode-bar';
  bar.innerHTML =
    '<span class="muted">Поведінка кліку по картці:</span>' +
    '<div class="mode-bar-group" role="tablist">' +
    '  <button class="mode-btn is-active" data-mode="" role="tab" aria-selected="true">за замовчуванням</button>' +
    '  <button class="mode-btn" data-mode="quickbuy" role="tab" aria-selected="false">швидко в кошик</button>' +
    '  <button class="mode-btn" data-mode="preview" role="tab" aria-selected="false">перегляд</button>' +
    '</div>';
  grid.parentNode.insertBefore(bar, grid);

  bar.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-mode]');
    if (!btn) return;
    setMode(btn.dataset.mode || null);
    Array.prototype.forEach.call(bar.querySelectorAll('[data-mode]'), function (b) {
      var isActive = b === btn;
      b.classList.toggle('is-active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  });

})();
