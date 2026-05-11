(function () {
  'use strict';

  var grid = document.getElementById('popularGrid');
  if (!grid) return;

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
    preview: function (card) {
      var title = card.querySelector('.game-title');
      alert('Швидкий перегляд: ' + (title ? title.textContent : 'гра'));
    }
  };

  var currentHandler = null;

  function clickHandlerFactory(modeFn) {
    return function (ev) {
      if (ev.target.closest('button, a')) return;
      var card = ev.target.closest('.game-card');
      if (!card) return;
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
  bar.className = 'flex gap-12 mt-16';
  bar.style.cssText = 'flex-wrap:wrap;';
  bar.innerHTML =
    '<span class="muted">Поведінка кліку по картці:</span>' +
    '<button class="btn btn-ghost" data-mode="">за замовчуванням</button>' +
    '<button class="btn btn-ghost" data-mode="quickbuy">швидко в кошик</button>' +
    '<button class="btn btn-ghost" data-mode="preview">перегляд</button>';
  grid.parentNode.insertBefore(bar, grid);

  bar.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-mode]');
    if (!btn) return;
    setMode(btn.dataset.mode || null);
    Array.prototype.forEach.call(bar.querySelectorAll('[data-mode]'), function (b) {
      var active = b === btn && Boolean(btn.dataset.mode);
      b.classList.toggle('btn-primary', active);
      b.classList.toggle('btn-ghost', !active);
    });
  });

})();
