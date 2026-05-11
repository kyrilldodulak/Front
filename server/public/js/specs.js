(function () {
  'use strict';

  var SPECS = [
    {
      id: 'cp2077',
      title: 'Cyberpunk 2077',
      year: 2020,
      developer: 'CD Projekt Red',
      genre: 'Action RPG · Open World',
      min: { OS: 'Windows 10 64-bit', CPU: 'Intel Core i5-3570K / AMD FX-8310', RAM: '8 GB', GPU: 'GeForce GTX 780 / Radeon RX 470', Storage: '70 GB SSD' },
      rec: { OS: 'Windows 10/11 64-bit', CPU: 'Intel Core i7-4790 / AMD Ryzen 3 3200G', RAM: '12 GB', GPU: 'GeForce GTX 1060 6GB / Radeon RX 590', Storage: '70 GB NVMe SSD' }
    },
    {
      id: 'tw3',
      title: 'The Witcher 3: Wild Hunt',
      year: 2015,
      developer: 'CD Projekt Red',
      genre: 'Action RPG · Open World',
      min: { OS: 'Windows 7/8/10 64-bit', CPU: 'Intel Core i5-2500K / AMD Phenom II X4 940', RAM: '6 GB', GPU: 'GeForce GTX 660 / Radeon HD 7870', Storage: '50 GB HDD' },
      rec: { OS: 'Windows 10 64-bit', CPU: 'Intel Core i7-3770 / AMD FX-8350', RAM: '8 GB', GPU: 'GeForce GTX 1060 / Radeon RX 480', Storage: '50 GB SSD' }
    },
    {
      id: 'hades2',
      title: 'Hades II',
      year: 2024,
      developer: 'Supergiant Games',
      genre: 'Roguelike · Action',
      min: { OS: 'Windows 10 64-bit', CPU: 'Dual Core 2.4 GHz', RAM: '4 GB', GPU: 'Intel HD 5000 / GeForce GTX 660', Storage: '15 GB' },
      rec: { OS: 'Windows 10/11 64-bit', CPU: 'Quad Core 3.0 GHz', RAM: '8 GB', GPU: 'GeForce GTX 1050', Storage: '15 GB SSD' }
    },
    {
      id: 'bg3',
      title: "Baldur's Gate 3",
      year: 2023,
      developer: 'Larian Studios',
      genre: 'CRPG · Strategy',
      min: { OS: 'Windows 10 64-bit', CPU: 'Intel I5 4690 / AMD FX 8350', RAM: '8 GB', GPU: 'GTX 970 / RX 480 (4 GB+ VRAM)', Storage: '150 GB SSD' },
      rec: { OS: 'Windows 10 64-bit', CPU: 'Intel i7 8700K / AMD r5 3600', RAM: '16 GB', GPU: 'RTX 2060 Super / RX 5700 XT (8 GB+ VRAM)', Storage: '150 GB NVMe SSD' }
    },
    {
      id: 'eldenring',
      title: 'Elden Ring',
      year: 2022,
      developer: 'FromSoftware',
      genre: 'Action RPG · Souls-like',
      min: { OS: 'Windows 10', CPU: 'Intel Core i5-8400 / AMD Ryzen 3 3300X', RAM: '12 GB', GPU: 'GeForce GTX 1060 3GB / Radeon RX 580 4GB', Storage: '60 GB' },
      rec: { OS: 'Windows 10/11', CPU: 'Intel Core i7-8700K / AMD Ryzen 5 3600X', RAM: '16 GB', GPU: 'GeForce GTX 1070 8GB / Radeon RX Vega 56', Storage: '60 GB SSD' }
    },
    {
      id: 'starfield',
      title: 'Starfield',
      year: 2023,
      developer: 'Bethesda Game Studios',
      genre: 'Action RPG · Sci-fi',
      min: { OS: 'Windows 10/11 64-bit', CPU: 'AMD Ryzen 5 2600X / Intel Core i7-6800K', RAM: '16 GB', GPU: 'AMD Radeon RX 5700 / GeForce 1070 Ti', Storage: '125 GB SSD' },
      rec: { OS: 'Windows 10/11 64-bit', CPU: 'AMD Ryzen 5 3600X / Intel i5-10600K', RAM: '16 GB', GPU: 'AMD Radeon RX 6800 XT / GeForce RTX 2080', Storage: '125 GB NVMe SSD' }
    },
    {
      id: 'gtav',
      title: 'Grand Theft Auto V',
      year: 2013,
      developer: 'Rockstar North',
      genre: 'Action · Open World',
      min: { OS: 'Windows 8.1 64-bit', CPU: 'Intel Core 2 Quad CPU Q6600 / AMD Phenom 9850', RAM: '4 GB', GPU: 'NVIDIA 9800 GT 1GB / AMD HD 4870 1GB', Storage: '72 GB' },
      rec: { OS: 'Windows 10 64-bit', CPU: 'Intel Core i5 3470 / AMD X8 FX-8350', RAM: '8 GB', GPU: 'GeForce GTX 660 2GB / Radeon HD 7870 2GB', Storage: '72 GB SSD' }
    },
    {
      id: 'rdr2',
      title: 'Red Dead Redemption 2',
      year: 2018,
      developer: 'Rockstar Games',
      genre: 'Action · Adventure',
      min: { OS: 'Windows 7 SP1 64-bit', CPU: 'Intel Core i5-2500K / AMD FX-6300', RAM: '8 GB', GPU: 'Nvidia GeForce GTX 770 2GB / Radeon R9 280 3GB', Storage: '150 GB' },
      rec: { OS: 'Windows 10 64-bit', CPU: 'Intel Core i7-4770K / AMD Ryzen 5 1500X', RAM: '12 GB', GPU: 'Nvidia GeForce GTX 1060 6GB / Radeon RX 480 4GB', Storage: '150 GB SSD' }
    }
  ];

  var search = document.getElementById('specsSearch');
  var select = document.getElementById('specsGame');
  var datalist = document.getElementById('specsGamesList');
  var caption = document.getElementById('specsCaption');
  var meta = document.getElementById('specsMeta');
  var tbody = document.querySelector('#specsTable tbody');
  if (!select || !tbody) return;

  SPECS.forEach(function (g) {
    var opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.title;
    select.appendChild(opt);

    var dopt = document.createElement('option');
    dopt.value = g.title;
    dopt.dataset.id = g.id;
    datalist.appendChild(dopt);
  });

  function findByTitle(value) {
    var lower = value.trim().toLowerCase();
    if (!lower) return null;
    var exact = SPECS.find(function (g) { return g.title.toLowerCase() === lower; });
    if (exact) return exact;
    return SPECS.find(function (g) { return g.title.toLowerCase().indexOf(lower) !== -1; }) || null;
  }

  function render(game) {
    if (!game) {
      caption.textContent = 'Виберіть гру, щоб побачити вимоги';
      meta.innerHTML = '';
      tbody.innerHTML = '';
      return;
    }
    caption.textContent = 'Системні вимоги: ' + game.title;
    meta.innerHTML =
      '<span class="meta-chip">' + game.year + '</span>' +
      '<span class="meta-chip">' + game.developer + '</span>' +
      '<span class="meta-chip">' + game.genre + '</span>';

    var keys = Object.keys(game.min);
    tbody.innerHTML = keys.map(function (k) {
      return '<tr>' +
        '<th scope="row">' + k + '</th>' +
        '<td>' + game.min[k] + '</td>' +
        '<td>' + game.rec[k] + '</td>' +
        '</tr>';
    }).join('');
  }

  select.addEventListener('change', function () {
    var game = SPECS.find(function (g) { return g.id === select.value; });
    if (game) {
      search.value = game.title;
      render(game);
    }
  });

  search.addEventListener('input', function () {
    var game = findByTitle(search.value);
    if (game) {
      select.value = game.id;
      render(game);
    } else if (!search.value) {
      render(null);
    }
  });

  select.value = SPECS[0].id;
  search.value = SPECS[0].title;
  render(SPECS[0]);
})();
