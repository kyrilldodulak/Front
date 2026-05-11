# GameShop

Курсовий проект з дисципліни «Frontend» (КПІ ім. Сікорського, ФПСПМ, група КМ-32,
Додуляк Кирило). GameShop — інтернет-магазин відеоігор та ігрових аксесуарів,
який покриває одночасно 6 лабораторних робіт та фінальний курсовий.

> Опис теми та структура: [docs/lab1-structure.md](docs/lab1-structure.md). Ескіз
> головної сторінки: [docs/lab1-mockup.html](docs/lab1-mockup.html) (відкривається
> в браузері напряму).

## Стек

| Шар        | Технології                                                                            |
|------------|----------------------------------------------------------------------------------------|
| Vanilla    | HTML5 (семантика, ARIA), CSS3 (Flexbox, Grid, медіа-запити), vanilla JS                |
| React      | React 18, TypeScript, Vite, React Router 6, Redux Toolkit, IntersectionObserver        |
| Сервер     | Node.js 20, Express, TypeScript, better-sqlite3, bcrypt, multer, swagger-ui-express    |
| Дані       | SQLite (`server/data/gameshop.db`) — користувачі, сесії, відгуки, замовлення, ціни, кеш RAWG |
| Зовнішнє   | [RAWG.io](https://rawg.io/apidocs) (через серверний проксі та кеш у SQLite)            |

## Структура

```
.
├── docs/                       Лаба 1: схема, ескіз, навігація
│   ├── lab1-structure.md
│   └── lab1-mockup.html
├── server/                     Express + SQLite + SSR React
│   ├── public/                 Vanilla сторінки (Лаби 2-3) + збілджений React (app/)
│   │   ├── index.html  cart.html  checkout.html  register.html  login.html  404.html
│   │   ├── css/        main.css  layout.css  responsive.css
│   │   ├── js/         cart.js  validation.js  header.js  dynamic.js
│   │   └── images/     hero-platforms.svg, cover-1..4.svg
│   └── src/                    TypeScript серверна логіка
│       ├── index.ts                     bootstrap
│       ├── db.ts                        better-sqlite3 + міграції + сід
│       ├── auth.ts                      bcrypt + cookies + сесії в SQLite
│       ├── rawg.ts                      проксі/кеш RAWG (з фолбеком)
│       ├── ssr.tsx                      SSR shell для React (Лаба 5)
│       ├── swagger.ts                   /api/docs
│       ├── routes/
│       │   ├── auth.ts          /api/auth/{register,login,logout,me}
│       │   ├── products.ts      /api/products  /api/products/:slug
│       │   ├── reviews.ts       /api/reviews/:productId  (GET, POST)
│       │   ├── orders.ts        /api/orders  + admin /api/admin/orders
│       │   ├── upload.ts        /api/upload/avatar
│       │   └── admin.ts         /api/admin/{users,prices}
│       └── middleware/errorHandler.ts
├── client-react/               React (Лаби 4, 6)
│   └── src/
│       ├── App.tsx                  React Router (catalog/product/profile/admin)
│       ├── pages/                   CatalogPage, ProductPage, ProfilePage, AdminPage
│       ├── components/              GameCard, Filters, Loader, ErrorBox, cart.ts
│       ├── store/                   Redux Toolkit (catalog + auth slices)
│       ├── api/                     products, reviews, auth, orders
│       └── styles/app.css
├── openapi.yaml                Документація REST API (Swagger)
└── README.md
```

## Запуск

### Вимоги

- Node.js ≥ 20.
- macOS / Linux / Windows. На macOS може знадобитись Xcode CLT для нативної збірки `better-sqlite3`.

### Кроки

```bash
cp .env.example .env            # за бажанням впишіть RAWG_API_KEY
npm install                     # root + workspaces
npm run dev                     # сервер (3000) + Vite dev (5173)
```

Прод-білд:

```bash
npm run build                   # client-react → server/public/app, server → server/dist
npm start                       # node server/dist/index.js → http://localhost:3000
```

Без `RAWG_API_KEY` сервер працює з вбудованою заглушкою з 12 ігор —
це дозволяє демонструвати UI без зовнішніх ключів.

### Демо-облікові записи

Створюються автоматично під час першої міграції:

| Логін   | Пароль  | Роль  |
|---------|---------|-------|
| admin   | admin   | admin |
| user    | user    | user  |

Адмін-панель — `/admin`. Swagger UI — `/api/docs`.

## Швидкий тур

- `http://localhost:3000/` — головна (vanilla, Лаба 2-3).
- `http://localhost:3000/cart.html` — кошик (vanilla JS + localStorage, Лаба 3).
- `http://localhost:3000/register.html` — реєстрація з валідацією (Лаба 3 + 5).
- `http://localhost:3000/catalog` — React-каталог через SSR + RAWG проксі (Лаба 4-6).
- `http://localhost:3000/product/cyberpunk-2077` — деталі гри + відгуки порціями (Лаба 6).
- `http://localhost:3000/profile` — особистий кабінет, історія замовлень, аватар (Лаба 5-6).
- `http://localhost:3000/admin` — CRUD цін, керування замовленнями і користувачами.
- `http://localhost:3000/api/docs` — Swagger UI (бонус Лаба 6).

## Трасування лабораторних → файли

| Лаба | Що                                       | Де                                                                                  |
|------|-------------------------------------------|--------------------------------------------------------------------------------------|
| 1    | Структура, схема, ескіз                   | [docs/lab1-structure.md](docs/lab1-structure.md), [docs/lab1-mockup.html](docs/lab1-mockup.html) |
| 2    | Семантичний HTML5 + CSS3                  | [server/public/index.html](server/public/index.html) тощо, [server/public/css/](server/public/css/) |
| 3    | Vanilla JS (валідація, кошик, події)      | [server/public/js/cart.js](server/public/js/cart.js), [server/public/js/validation.js](server/public/js/validation.js), [server/public/js/dynamic.js](server/public/js/dynamic.js) |
| 4    | React + RAWG AJAX, фільтри, стрімінг      | [client-react/src/pages/CatalogPage.tsx](client-react/src/pages/CatalogPage.tsx), [client-react/src/store/catalogSlice.ts](client-react/src/store/catalogSlice.ts) |
| 5    | Express + auth + cookies + SSR + відгуки  | [server/src/auth.ts](server/src/auth.ts), [server/src/ssr.tsx](server/src/ssr.tsx), [server/src/routes/auth.ts](server/src/routes/auth.ts), [server/src/routes/reviews.ts](server/src/routes/reviews.ts) |
| 6    | REST + React Router + Swagger             | [server/src/routes/](server/src/routes/), [client-react/src/App.tsx](client-react/src/App.tsx), [openapi.yaml](openapi.yaml) |

## Покриття бонусних балів

- Лаба 2: ARIA, медіа-запити, CSS-анімація `pulse` на акційному бейджі, image map (`<map>`/`<area>`), Flexbox + Grid.
- Лаба 3: динамічна реакція на одну й ту саму подію через `addEventListener` / `removeEventListener` ([dynamic.js](server/public/js/dynamic.js), переключення режиму кліку по картках).
- Лаба 4: динамічні запити при зміні фільтрів/пошуку, Redux Toolkit, складний компонент `CatalogPage` із стрімінговим довантаженням через `IntersectionObserver`.
- Лаба 5: `bcrypt` для паролів, http-only cookies з підписаними session id у SQLite, SSR React з гідратацією.
- Лаба 6: Swagger UI на `/api/docs` (документація API через [openapi.yaml](openapi.yaml)).

## Як перевірити вимоги в кожній лабі

Запустіть сервер (`npm run build && npm start`) і перевірте:

1. **Лаба 1**: відкрийте [docs/lab1-structure.md](docs/lab1-structure.md) та `docs/lab1-mockup.html`.
2. **Лаба 2**: `view-source:` сторінок у `server/public/`. Перевірте `<table>`, форми з ≥3 типами `<input>`, ≥2 списки, image-map, плаваючі елементи (sticky хедер, fixed back-to-top, absolute бейдж акції).
3. **Лаба 3**: відкрийте `register.html`, спробуйте сабмітити з порожніми полями (submit) і ввести невалідний email і покинути фокус (blur). Поміняйте «Тип акаунту» на «Продавець» — з'явиться поле компанії з власним `input`-обробником.
4. **Лаба 4**: `/catalog`, відкрийте DevTools → Network: пошук/фільтри тригерять нові запити, при скролі вниз робиться `?page=2`.
5. **Лаба 5**: на головній видно блок «Логін», після `/login.html` — змінюється; HTML, що повертає `/catalog`, містить `data-theme="dark"` залежно від cookie / часу доби (можна вручну виставити cookie `theme=light`).
6. **Лаба 6**: `/api/docs` — Swagger UI. У `/product/:slug` кнопка «Завантажити ще» довантажує наступну порцію відгуків через REST.

## Ризики

- [Inference] Без `RAWG_API_KEY` каталог обмежений 12 заглушковими іграми; усі інші функції (auth, відгуки, замовлення, адмінка) працюють повноцінно.
- [Unverified] Якщо викладач прямо вимагає чистий JavaScript для серверної частини (без TypeScript), можна швидко скомпілювати `server/dist/*.js` командою `npm run build --workspace server` і використати їх — TS виступає лише як надбудова над JS.
# Front
