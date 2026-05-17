import { useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import { listAllOrders, updateOrderStatus, type Order } from '../api/orders';
import { OrderModal } from './ProfilePage';

type LocalPrice = { product_id: string; price: number };
type AdminUser = {
  id: number;
  username: string;
  email: string;
  role: string;
  blocked: number;
  created_at: string;
};

function PricesTab() {
  const [items, setItems] = useState<LocalPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [newSlug, setNewSlug] = useState('');
  const [newPrice, setNewPrice] = useState('');

  function reload() {
    setLoading(true);
    fetch('/api/admin/prices', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: LocalPrice[]) => {
        setItems(data);
        setEdited({});
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function save(slug: string) {
    const raw = edited[slug];
    const price = Number(raw);
    if (!price || price < 1) return;
    setSaving((s) => ({ ...s, [slug]: true }));
    await fetch(`/api/admin/prices/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ price })
    });
    setSaving((s) => ({ ...s, [slug]: false }));
    setItems((prev) => prev.map((p) => p.product_id === slug ? { ...p, price } : p));
    setEdited((e) => { const n = { ...e }; delete n[slug]; return n; });
  }

  async function remove(slug: string) {
    if (!confirm(`Видалити ціну для ${slug}?`)) return;
    await fetch(`/api/admin/prices/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    setItems((prev) => prev.filter((p) => p.product_id !== slug));
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(newPrice);
    if (!newSlug || !price) return;
    await fetch(`/api/admin/prices/${encodeURIComponent(newSlug)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ price })
    });
    setNewSlug('');
    setNewPrice('');
    reload();
  }

  if (loading) return <Loader />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  return (
    <div className="card">
      <h3>Локальні ціни</h3>
      <table>
        <thead>
          <tr>
            <th>Slug</th>
            <th>Ціна (₴)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => {
            const val = edited[p.product_id] ?? String(p.price);
            const isDirty = edited[p.product_id] !== undefined && edited[p.product_id] !== String(p.price);
            return (
              <tr key={p.product_id}>
                <td><code>{p.product_id}</code></td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={val}
                    onChange={(e) => setEdited((prev) => ({ ...prev, [p.product_id]: e.target.value }))}
                    style={{ width: 110 }}
                  />
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-ghost"
                    disabled={!isDirty || saving[p.product_id]}
                    onClick={() => save(p.product_id)}
                  >
                    {saving[p.product_id] ? '…' : 'Зберегти'}
                  </button>
                  <button className="btn btn-danger" onClick={() => remove(p.product_id)}>
                    Видалити
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <form className="flex gap-12 mt-16" onSubmit={add}>
        <input
          placeholder="slug (напр. cyberpunk-2077)"
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
        />
        <input
          type="number"
          placeholder="ціна"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          style={{ width: 120 }}
        />
        <button className="btn btn-primary" type="submit">
          Додати
        </button>
      </form>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Нове',
  paid: 'Оплачено',
  shipped: 'Відправлено',
  cancelled: 'Скасовано'
};

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  function reload() {
    setLoading(true);
    listAllOrders()
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);

  async function handleStatusChange(id: number, status: Order['status']) {
    await updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  const selected = selectedId !== null ? orders.find((o) => o.id === selectedId) ?? null : null;

  if (loading) return <Loader />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  return (
    <>
      {selected && <OrderModal order={selected} onClose={() => setSelectedId(null)} isAdmin />}
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Дата</th>
              <th>Клієнт</th>
              <th>Сума</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{new Date(o.created_at).toLocaleString('uk-UA')}</td>
                <td>
                  {o.full_name}<br />
                  <small className="muted">{o.email}</small>
                </td>
                <td>{o.total} ₴</td>
                <td>
                  <select
                    value={o.status}
                    onChange={(e) => handleStatusChange(o.id, e.target.value as Order['status'])}
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button type="button" className="btn btn-ghost" onClick={() => setSelectedId(o.id)}>
                    Деталі
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    setLoading(true);
    fetch('/api/admin/users', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);

  async function toggleBlock(u: AdminUser) {
    await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ blocked: u.blocked ? 0 : 1 })
    });
    reload();
  }

  if (loading) return <Loader />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  return (
    <div className="card">
      <h3>Користувачі</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Логін</th>
            <th>Email</th>
            <th>Роль</th>
            <th>Статус</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.blocked ? 'заблокований' : 'активний'}</td>
              <td>
                <button className="btn btn-ghost" onClick={() => toggleBlock(u)}>
                  {u.blocked ? 'Розблокувати' : 'Заблокувати'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  const user = useAppSelector((s) => s.auth.user);
  if (!user || user.role !== 'admin') {
    return (
      <div className="card">
        <h2>Адмін-панель</h2>
        <p className="muted">Доступ лише для адміністраторів. Увійдіть як <code>admin / admin</code>.</p>
      </div>
    );
  }
  return (
    <section>
      <h1>Адмін-панель</h1>
      <nav className="admin-tabs">
        <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Ціни
        </NavLink>
        <NavLink to="/admin/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
          Замовлення
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => (isActive ? 'active' : '')}>
          Користувачі
        </NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<PricesTab />} />
        <Route path="/prices" element={<PricesTab />} />
        <Route path="/orders" element={<OrdersTab />} />
        <Route path="/users" element={<UsersTab />} />
      </Routes>
    </section>
  );
}
