import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'gameshop.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    avatar TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    blocked INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    author TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews(product_id);

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    comment TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    total INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    title TEXT NOT NULL,
    price INTEGER NOT NULL,
    qty INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS local_prices (
    product_id TEXT PRIMARY KEY,
    price INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rawg_cache (
    key TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    cached_at INTEGER NOT NULL
  );
`;

const DEFAULT_PRICES: Array<[string, number]> = [
  ['cyberpunk-2077', 899],
  ['the-witcher-3-wild-hunt', 499],
  ['hades-ii', 699],
  ['baldurs-gate-3', 1499],
  ['red-dead-redemption-2', 1199],
  ['elden-ring', 1299],
  ['portal-2', 199],
  ['gta-5', 599],
  ['hollow-knight', 299],
  ['celeste', 249],
  ['stardew-valley', 199],
  ['hades', 399]
];

function migrate() {
  db.exec(SCHEMA);
}

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number };
  if (userCount.c === 0) {
    const insert = db.prepare(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)'
    );
    insert.run('admin', 'admin@gameshop.local', bcrypt.hashSync('admin', 10), 'admin');
    insert.run('user', 'user@gameshop.local', bcrypt.hashSync('user', 10), 'user');
    console.log('[seed] created admin/admin and user/user');
  }

  const priceCount = db.prepare('SELECT COUNT(*) AS c FROM local_prices').get() as { c: number };
  if (priceCount.c === 0) {
    const insert = db.prepare('INSERT INTO local_prices (product_id, price) VALUES (?, ?)');
    const tx = db.transaction((items: Array<[string, number]>) => {
      for (const [slug, price] of items) insert.run(slug, price);
    });
    tx(DEFAULT_PRICES);
  }
}

migrate();
seed();

export type User = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin' | 'seller';
  avatar: string | null;
  created_at: string;
  blocked: number;
};
