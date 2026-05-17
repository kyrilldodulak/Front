# GameShop

Курсовий проект з дисципліни «Frontend» (КПІ ім. Сікорського, ФПСПМ, група КМ-32, Додуляк Кирило).
Інтернет-магазин відеоігор та ігрових аксесуарів.

## Стек

| Шар     | Технології |
|---------|-----------|
| Vanilla | HTML5, CSS3 (Flexbox, Grid, медіа-запити), JavaScript |
| React   | React 18, TypeScript, Vite, React Router 6, Redux Toolkit, IntersectionObserver |
| Сервер  | Node.js 20, Express, TypeScript, better-sqlite3, bcrypt, multer, swagger-ui-express |
| Дані    | SQLite — користувачі, сесії, відгуки, замовлення, ціни, кеш RAWG |
| API     | [RAWG.io](https://rawg.io/apidocs) через серверний проксі з кешем |

## Структура

```
.
├── docs/
│   ├── lab1-structure.md       схема навігації
│   └── lab1-mockup.html        ескіз головної сторінки
├── server/
│   ├── public/                 vanilla-сторінки + збілджений React (app/)
│   │   ├── index.html  cart.html  checkout.html  register.html  login.html  404.html
│   │   ├── css/        main.css  layout.css  responsive.css
│   │   ├── js/         cart.js  validation.js  header.js  dynamic.js  specs.js
│   │   └── images/
│   └── src/
│       ├── index.ts            точка входу
│       ├── db.ts               SQLite схема, міграції, сід
│       ├── auth.ts             bcrypt, httpOnly cookies, сесії
│       ├── rawg.ts             проксі RAWG з SQLite-кешем
│       ├── ssr.tsx             HTML-shell для React (динамічний серверний рядок)
│       ├── swagger.ts          /api/docs
│       └── routes/             auth, products, reviews, orders, upload, admin
├── client-react/
│   └── src/
│       ├── App.tsx             React Router
│       ├── pages/              CatalogPage, ProductPage, ProfilePage, AdminPage
│       ├── components/         GameCard, Filters, Loader, ErrorBox
│       ├── store/              Redux Toolkit (catalogSlice, authSlice)
│       └── api/                products, reviews, auth, orders
├── openapi.yaml                Swagger-специфікація REST API
└── README.md
```

## Запуск

**Вимоги:** Node.js ≥ 20.

```bash
cp .env.example .env      
npm install
npm run dev                
```
**Продакшн:**

```bash
npm run build
npm start     
npm run build && npm start
```

## Демо-акаунти

| Логін | Пароль | Роль  |
|-------|--------|-------|
| admin | admin  | admin |
| user  | user   | user  |

## Сторінки

| URL | Опис |
|-----|------|
| `http://localhost:3000/` | Головна (vanilla) |
| `http://localhost:3000/cart.html` | Кошик (localStorage) |
| `http://localhost:3000/register.html` | Реєстрація з валідацією |
| `http://localhost:3000/catalog` | React-каталог з фільтрами та нескінченним скролом (IntersectionObserver) |
| `http://localhost:3000/product/cyberpunk-2077` | Деталі гри + відгуки |
| `http://localhost:3000/profile` | Кабінет, замовлення, аватар |
| `http://localhost:3000/admin` | Адмін-панель |
| `http://localhost:3000/api/docs` | Swagger UI |

## Лабораторні роботи

| Лаба | Що реалізовано | Де |
|------|---------------|-----|
| 1 | Структура, схема навігації, ескіз | `docs/` |
| 2 | Семантичний HTML5 + CSS3, ARIA, адаптивність | `server/public/` |
| 3 | Vanilla JS: валідація форм, кошик, події | `server/public/js/` |
| 4 | React + AJAX (RAWG), Redux, фільтри, лоадер, IntersectionObserver для стрімінгу | `client-react/src/` |
| 5 | Express + auth + bcrypt + cookies + SSR (час+користувач) + SQLite | `server/src/` |
| 6 | REST API + React Router + Swagger | `server/src/routes/`, `openapi.yaml` |
