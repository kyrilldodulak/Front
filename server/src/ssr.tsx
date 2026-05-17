import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Request, Response } from 'express';
import type { PublicUser } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, '..', 'public', 'app');
const MANIFEST = path.join(APP_DIR, '.vite', 'manifest.json');

type ViteManifest = Record<string, { file: string; css?: string[]; isEntry?: boolean }>;

function readManifest(): ViteManifest | null {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) as ViteManifest;
  } catch {
    return null;
  }
}

function getEntryAssets(): { js: string; cssFiles: string[] } | null {
  const manifest = readManifest();
  if (!manifest) return null;
  const entry = Object.values(manifest).find((e) => e.isEntry) ?? manifest['index.html'];
  if (!entry) return null;
  return { js: `/app/${entry.file}`, cssFiles: (entry.css ?? []).map((c) => `/app/${c}`) };
}

function escapeForInline(json: string): string {
  return json.replace(/</g, '\\u003c');
}

function formatServerLine(user: PublicUser | null): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const partOfDay = now.getHours() < 5 ? 'ніч'
    : now.getHours() < 12 ? 'ранок'
    : now.getHours() < 18 ? 'день'
    : 'вечір';
  const who = user ? user.username : 'гість';
  return `Час сервера ${hh}:${mm} · ${partOfDay} · ${who}`;
}

function renderSkeleton(user: PublicUser | null): string {
  const greeting = user ? `Привіт, ${user.username}` : 'Гість, увійдіть для відгуків';
  const serverLine = formatServerLine(user);
  return `
    <header id="siteHeader">
      <div class="header-inner">
        <a class="logo" href="/">GAME<span>SHOP</span></a>
        <nav><ul>
          <li><a href="/">Головна</a></li>
          <li><a href="/catalog">Каталог</a></li>
          <li><a href="/cart.html">Кошик</a></li>
          <li><a href="/profile">Профіль</a></li>
        </ul></nav>
        <div class="header-actions">
          <span class="muted">${greeting}</span>
        </div>
      </div>
    </header>
    <main id="main">
      <p class="ssr-server-line" data-ssr="server-line">${serverLine}</p>
      <div class="loader" role="status">Завантаження інтерфейсу…</div>
    </main>
  `;
}

function renderShell(opts: {
  title: string;
  user: PublicUser | null;
  preloaded?: unknown;
  isDev: boolean;
}): string {
  const assets = opts.isDev ? null : getEntryAssets();
  const cssLinks = assets?.cssFiles.map((href) => `<link rel="stylesheet" href="${href}">`).join('') ?? '';
  const scriptTag = assets
    ? `<script type="module" src="${assets.js}"></script>`
    : opts.isDev
      ? `
      <script type="module">
        import RefreshRuntime from "http://127.0.0.1:5173/app/@react-refresh"
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {}
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
      </script>
      <script type="module" src="http://127.0.0.1:5173/app/@vite/client"></script>
      <script type="module" src="http://127.0.0.1:5173/app/src/main.tsx"></script>
    `
      : '';

  const initial = opts.preloaded
    ? `<script>window.__INITIAL_STATE__=${escapeForInline(JSON.stringify(opts.preloaded))};</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${opts.title}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="stylesheet" href="/css/main.css" />
    <link rel="stylesheet" href="/css/layout.css" />
    <link rel="stylesheet" href="/css/responsive.css" />
    ${cssLinks}
  </head>
  <body>
    <div id="root">${renderSkeleton(opts.user)}</div>
    ${initial}
    ${scriptTag}
  </body>
</html>`;
}

export function ssrHandler(isDev: boolean) {
  return (req: Request, res: Response) => {
    const user = req.user ?? null;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(
      renderShell({
        title: 'GameShop',
        user,
        preloaded: { user, time: new Date().toISOString(), path: req.path },
        isDev
      })
    );
  };
}
