import { db } from './db.js';

const RAWG_BASE = 'https://api.rawg.io/api';
const TTL_MS = (Number(process.env.RAWG_CACHE_TTL_SECONDS) || 86400) * 1000;
const HAS_KEY = () => Boolean(process.env.RAWG_API_KEY);

type RawgGame = {
  id: number;
  slug: string;
  name: string;
  released?: string | null;
  background_image?: string | null;
  rating?: number;
  ratings_count?: number;
  metacritic?: number | null;
  short_screenshots?: Array<{ id: number; image: string }>;
  genres?: Array<{ id: number; name: string; slug: string }>;
  platforms?: Array<{ platform: { id: number; name: string; slug: string } }>;
  description_raw?: string;
};

type RawgListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawgGame[];
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  released: string | null;
  cover: string | null;
  rating: number;
  metacritic: number | null;
  genres: string[];
  platforms: string[];
  price: number;
  short_screenshots?: string[];
  description?: string;
};

const PRICE_BUCKETS = [199, 299, 399, 499, 699, 899, 999, 1199, 1499];

function getLocalPrice(slug: string, fallbackBy?: number): number {
  const row = db
    .prepare('SELECT price FROM local_prices WHERE product_id = ?')
    .get(slug) as { price: number } | undefined;
  if (row) return row.price;
  if (fallbackBy && fallbackBy > 0) return PRICE_BUCKETS[fallbackBy % PRICE_BUCKETS.length];
  return 499;
}

function toProduct(g: RawgGame): Product {
  return {
    id: g.slug,
    slug: g.slug,
    title: g.name,
    released: g.released ?? null,
    cover: g.background_image ?? null,
    rating: g.rating ?? 0,
    metacritic: g.metacritic ?? null,
    genres: (g.genres ?? []).map((x) => x.name),
    platforms: (g.platforms ?? []).map((x) => x.platform.name),
    price: getLocalPrice(g.slug, g.id),
    short_screenshots: (g.short_screenshots ?? []).map((s) => s.image),
    description: g.description_raw
  };
}

function readCache<T>(key: string): T | null {
  const row = db
    .prepare('SELECT payload, cached_at FROM rawg_cache WHERE key = ?')
    .get(key) as { payload: string; cached_at: number } | undefined;
  if (!row) return null;
  if (Date.now() - row.cached_at > TTL_MS) return null;
  try {
    return JSON.parse(row.payload) as T;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, payload: T) {
  db.prepare(
    'INSERT INTO rawg_cache (key, payload, cached_at) VALUES (?, ?, ?) ' +
      'ON CONFLICT(key) DO UPDATE SET payload=excluded.payload, cached_at=excluded.cached_at'
  ).run(key, JSON.stringify(payload), Date.now());
}

async function rawgFetch<T>(endpoint: string, params: Record<string, string | number>): Promise<T> {
  if (!HAS_KEY()) throw new Error('RAWG_API_KEY is not set');
  const qs = new URLSearchParams({ key: process.env.RAWG_API_KEY! });
  for (const [k, v] of Object.entries(params)) {
    const s = String(v ?? '').trim();
    if (s) qs.append(k, s);
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`${RAWG_BASE}${endpoint}?${qs.toString()}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`RAWG ${res.status}: ${res.statusText}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

const STUB_GAMES: RawgGame[] = [
  { id: 1, slug: 'cyberpunk-2077', name: 'Cyberpunk 2077', released: '2020-12-10',
    background_image: '/images/cover-1.svg', rating: 4.1, metacritic: 86,
    genres: [{ id: 1, name: 'RPG', slug: 'role-playing-games-rpg' }, { id: 2, name: 'Action', slug: 'action' }],
    platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }, { platform: { id: 2, name: 'PlayStation 5', slug: 'playstation5' } }] },
  { id: 2, slug: 'the-witcher-3-wild-hunt', name: 'The Witcher 3: Wild Hunt', released: '2015-05-19',
    background_image: '/images/cover-2.svg', rating: 4.7, metacritic: 92,
    genres: [{ id: 1, name: 'RPG', slug: 'role-playing-games-rpg' }, { id: 3, name: 'Adventure', slug: 'adventure' }],
    platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }, { platform: { id: 4, name: 'Xbox', slug: 'xbox-one' } }] },
  { id: 3, slug: 'hades-ii', name: 'Hades II', released: '2025-01-01',
    background_image: '/images/cover-3.svg', rating: 4.6, metacritic: 90,
    genres: [{ id: 4, name: 'Roguelike', slug: 'roguelike' }, { id: 2, name: 'Action', slug: 'action' }],
    platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }] },
  { id: 4, slug: 'baldurs-gate-3', name: "Baldur's Gate 3", released: '2023-08-03',
    background_image: '/images/cover-4.svg', rating: 4.8, metacritic: 96,
    genres: [{ id: 1, name: 'RPG', slug: 'role-playing-games-rpg' }, { id: 5, name: 'Strategy', slug: 'strategy' }],
    platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }, { platform: { id: 2, name: 'PlayStation 5', slug: 'playstation5' } }] },
  { id: 5, slug: 'red-dead-redemption-2', name: 'Red Dead Redemption 2', released: '2018-10-26',
    background_image: '/images/cover-1.svg', rating: 4.6, metacritic: 96,
    genres: [{ id: 2, name: 'Action', slug: 'action' }, { id: 3, name: 'Adventure', slug: 'adventure' }],
    platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }, { platform: { id: 4, name: 'Xbox', slug: 'xbox-one' } }] },
  { id: 6, slug: 'elden-ring', name: 'Elden Ring', released: '2022-02-25',
    background_image: '/images/cover-2.svg', rating: 4.7, metacritic: 96,
    genres: [{ id: 1, name: 'RPG', slug: 'role-playing-games-rpg' }, { id: 2, name: 'Action', slug: 'action' }],
    platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }] },
  { id: 7, slug: 'portal-2', name: 'Portal 2', released: '2011-04-19',
    background_image: '/images/cover-3.svg', rating: 4.6, metacritic: 95,
    genres: [{ id: 6, name: 'Puzzle', slug: 'puzzle' }],
    platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }] },
  { id: 8, slug: 'gta-5', name: 'Grand Theft Auto V', released: '2013-09-17',
    background_image: '/images/cover-4.svg', rating: 4.5, metacritic: 96,
    genres: [{ id: 2, name: 'Action', slug: 'action' }],
    platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }] },
  { id: 9, slug: 'hollow-knight', name: 'Hollow Knight', released: '2017-02-24',
    background_image: '/images/cover-1.svg', rating: 4.4, metacritic: 90,
    genres: [{ id: 7, name: 'Indie', slug: 'indie' }, { id: 3, name: 'Adventure', slug: 'adventure' }],
    platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }] },
  { id: 10, slug: 'celeste', name: 'Celeste', released: '2018-01-25',
    background_image: '/images/cover-2.svg', rating: 4.5, metacritic: 92,
    genres: [{ id: 7, name: 'Indie', slug: 'indie' }, { id: 8, name: 'Platformer', slug: 'platformer' }],
    platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }] },
  { id: 11, slug: 'stardew-valley', name: 'Stardew Valley', released: '2016-02-26',
    background_image: '/images/cover-3.svg', rating: 4.6, metacritic: 89,
    genres: [{ id: 9, name: 'Simulation', slug: 'simulation' }, { id: 7, name: 'Indie', slug: 'indie' }],
    platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }] },
  { id: 12, slug: 'hades', name: 'Hades', released: '2020-09-17',
    background_image: '/images/cover-4.svg', rating: 4.7, metacritic: 93,
    genres: [{ id: 4, name: 'Roguelike', slug: 'roguelike' }, { id: 2, name: 'Action', slug: 'action' }],
    platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }] }
];

function listFromStub(opts: {
  search?: string;
  page: number;
  pageSize: number;
  genre?: string;
  platform?: string;
}): RawgListResponse {
  let games = STUB_GAMES.slice();
  if (opts.search) {
    const q = opts.search.toLowerCase();
    games = games.filter((g) => g.name.toLowerCase().includes(q));
  }
  if (opts.genre) {
    const g = opts.genre.toLowerCase();
    games = games.filter((it) =>
      it.genres?.some((x) => x.slug === g || x.name.toLowerCase() === g)
    );
  }
  if (opts.platform) {
    const p = opts.platform.toLowerCase();
    games = games.filter((it) =>
      it.platforms?.some(
        (x) => x.platform.slug === p || x.platform.name.toLowerCase().includes(p)
      )
    );
  }
  const start = (opts.page - 1) * opts.pageSize;
  const end = start + opts.pageSize;
  return {
    count: games.length,
    next: end < games.length ? 'next' : null,
    previous: opts.page > 1 ? 'prev' : null,
    results: games.slice(start, end)
  };
}

export async function listProducts(opts: {
  search?: string;
  page?: number;
  pageSize?: number;
  ordering?: string;
  genre?: string;
  platform?: string;
}): Promise<{ count: number; results: Product[]; hasNext: boolean }> {
  const page = Math.max(1, Number(opts.page) || 1);
  const pageSize = Math.min(40, Math.max(1, Number(opts.pageSize) || 12));
  const cacheKey = `list:${JSON.stringify({ ...opts, page, pageSize })}`;

  const cached = readCache<{ count: number; results: Product[]; hasNext: boolean }>(cacheKey);
  if (cached) return cached;

  let raw: RawgListResponse;
  if (HAS_KEY()) {
    try {
      raw = await rawgFetch<RawgListResponse>('/games', {
        page,
        page_size: pageSize,
        search: opts.search ?? '',
        ordering: opts.ordering ?? '-rating',
        genres: opts.genre ?? '',
        platforms: opts.platform ?? ''
      });
    } catch (err) {
      console.warn('[rawg] fallback to stub:', (err as Error).message);
      raw = listFromStub({
        search: opts.search,
        page,
        pageSize,
        genre: opts.genre,
        platform: opts.platform
      });
    }
  } else {
    raw = listFromStub({
      search: opts.search,
      page,
      pageSize,
      genre: opts.genre,
      platform: opts.platform
    });
  }

  const result = {
    count: raw.count,
    results: raw.results.map(toProduct),
    hasNext: Boolean(raw.next)
  };
  writeCache(cacheKey, result);
  return result;
}

export async function getProduct(slug: string): Promise<Product | null> {
  const cacheKey = `detail:${slug}`;
  const cached = readCache<Product>(cacheKey);
  if (cached) return cached;

  let game: RawgGame | null = null;
  if (HAS_KEY()) {
    try {
      game = await rawgFetch<RawgGame>(`/games/${encodeURIComponent(slug)}`, {});
    } catch (err) {
      console.warn('[rawg] detail fallback:', (err as Error).message);
    }
  }
  if (!game) {
    const stub = STUB_GAMES.find((g) => g.slug === slug);
    if (!stub) return null;
    game = {
      ...stub,
      description_raw:
        'Опис цієї гри тимчасово недоступний (RAWG_API_KEY не встановлено). ' +
        'Це заглушковий запис, що демонструє роботу UI.',
      short_screenshots: [
        { id: 1, image: stub.background_image ?? '' },
        { id: 2, image: '/images/cover-1.svg' },
        { id: 3, image: '/images/cover-2.svg' }
      ]
    };
  }

  const product = toProduct(game);
  product.description = game.description_raw ?? '';
  writeCache(cacheKey, product);
  return product;
}

export function setLocalPrice(slug: string, price: number) {
  db.prepare(
    'INSERT INTO local_prices (product_id, price) VALUES (?, ?) ' +
      'ON CONFLICT(product_id) DO UPDATE SET price=excluded.price'
  ).run(slug, price);
  db.prepare('DELETE FROM rawg_cache WHERE key LIKE ?').run(`%${slug}%`);
}

export function listLocalPrices() {
  return db.prepare('SELECT product_id, price FROM local_prices ORDER BY product_id').all() as Array<{
    product_id: string;
    price: number;
  }>;
}

export function deleteLocalPrice(slug: string) {
  db.prepare('DELETE FROM local_prices WHERE product_id = ?').run(slug);
}
