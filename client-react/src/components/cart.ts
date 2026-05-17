import type { Product } from '../api/products';

const COUNT_CACHE_KEY = 'gameshop.cart.count';

function makeKey(username: string | null) {
  return `gameshop.cart.v1:${username || 'guest'}`;
}

let STORAGE_KEY = makeKey(null);

type StoredItem = {
  id: string;
  title: string;
  price: number;
  image: string | null;
  qty: number;
};

function read(): StoredItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredItem[]) : [];
  } catch {
    return [];
  }
}

export function getCartItems(): StoredItem[] {
  return read();
}

export function getCartTotalQty(): number {
  return read().reduce((s, it) => s + (Number(it.qty) || 0), 0);
}

export function getCartStorageKey(): string {
  return STORAGE_KEY;
}

function write(items: StoredItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  const totalQty = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
  try {
    localStorage.setItem(COUNT_CACHE_KEY, String(totalQty));
  } catch {
    /* ignore */
  }
  document.dispatchEvent(new CustomEvent('cart:changed', { detail: items }));
}

export function getCachedCartCount(): number {
  try {
    const v = localStorage.getItem(COUNT_CACHE_KEY);
    const n = v ? Number(v) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function flash(message: string) {
  const el = document.createElement('div');
  el.textContent = message;
  el.setAttribute('role', 'status');
  el.style.cssText =
    'position:fixed;top:80px;right:24px;background:#51cf66;color:#0f1420;' +
    'padding:10px 16px;border-radius:8px;font-weight:600;' +
    'z-index:1000;opacity:0;transition:opacity 0.25s,transform 0.25s;transform:translateY(-8px);';
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    setTimeout(() => el.remove(), 300);
  }, 1800);
}

export function switchCartUser(username: string | null) {
  const oldKey = STORAGE_KEY;
  const newKey = makeKey(username);
  if (oldKey === newKey) return;

  const prevItems = read();
  STORAGE_KEY = newKey;

  if (prevItems.length > 0 && oldKey === makeKey(null)) {
    const nextItems = read();
    for (const item of prevItems) {
      const existing = nextItems.find((i) => i.id === item.id);
      if (existing) existing.qty += item.qty;
      else nextItems.push(item);
    }
    localStorage.removeItem(oldKey);
    write(nextItems);
  } else {
    const nextItems = read();
    const totalQty = nextItems.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    try { localStorage.setItem(COUNT_CACHE_KEY, String(totalQty)); } catch { /* ignore */ }
    document.dispatchEvent(new CustomEvent('cart:changed', { detail: nextItems }));
  }
}

export function addToCart(product: Product, qty = 1) {
  const items = read();
  const existing = items.find((it) => it.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.cover,
      qty
    });
  }
  write(items);
  flash(`${product.title} додано до кошика`);
}
