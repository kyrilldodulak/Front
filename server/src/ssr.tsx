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

function pickTheme(req: Request): 'light' | 'dark' {
  const cookie = req.cookies?.theme as string | undefined;
  if (cookie === 'light' || cookie === 'dark') return cookie;
  const hour = new Date().getHours();
  return hour < 7 || hour >= 20 ? 'dark' : 'dark';
}

function escapeForInline(json: string): string {
  return json.replace(/</g, '\\u003c');
}

function renderSkeleton(user: PublicUser | null): string {
  const greeting = user ? `Привіт, ${user.username}` : 'Гість, увійдіть для відгуків';
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
      <div class="loader" role="status">Завантаження інтерфейсу…</div>
    </main>
  `;
}

function renderShell(opts: {
  title: string;
  user: PublicUser | null;
  theme: 'light' | 'dark';
  preloaded?: unknown;
  isDev: boolean;
}): string {
  const assets = getEntryAssets();
  const cssLinks = assets?.cssFiles.map((href) => `<link rel="stylesheet" href="${href}">`).join('') ?? '';
  const scriptTag = assets
    ? `<script type="module" src="${assets.js}"></script>`
    : opts.isDev
      ? `
      <script type="module" src="http://localhost:5173/@vite/client"></script>
      <script type="module" src="http://localhost:5173/src/main.tsx"></script>
    `
      : '<!-- React app не зібрано: запустіть `npm run build` -->';

  const initial = opts.preloaded
    ? `<script>window.__INITIAL_STATE__=${escapeForInline(JSON.stringify(opts.preloaded))};</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="uk" data-theme="${opts.theme}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${opts.title}</title>
    <link rel="stylesheet" href="/css/main.css" />
    <link rel="stylesheet" href="/css/layout.css" />
    <link rel="stylesheet" href="/css/responsive.css" />
    ${cssLinks}
    <style>
      html[data-theme="dark"]  { background: #0f1420; color: #e6e9f2; }
      html[data-theme="light"] { background: #f5f6fa; color: #1a2030; }
      html[data-theme="light"] body, html[data-theme="light"] main { background: #f5f6fa; color: #1a2030; }
    </style>
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
    const theme = pickTheme(req);
    const user = req.user ?? null;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(
      renderShell({
        title: 'GameShop',
        user,
        theme,
        preloaded: { user, theme, time: new Date().toISOString(), path: req.path },
        isDev
      })
    );
  };
}
