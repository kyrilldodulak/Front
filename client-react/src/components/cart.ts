import type { Product } from '../api/products';

const STORAGE_KEY = 'gameshop.cart.v1';

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

function write(items: StoredItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  document.dispatchEvent(new CustomEvent('cart:changed', { detail: items }));
}

function flash(message: string) {
  const el = document.createElement('div');
  el.textContent = message;
  el.setAttribute('role', 'status');
  el.style.cssText =
    'position:fixed;top:80px;right:24px;background:#51cf66;color:#0f1420;' +
    'padding:10px 16px;border-radius:8px;font-weight:600;box-shadow:0 8px 20px rgba(0,0,0,0.3);' +
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
