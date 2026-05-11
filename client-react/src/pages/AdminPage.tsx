import { useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import { listAllOrders, updateOrderStatus, type Order } from '../api/orders';

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
  const [newSlug, setNewSlug] = useState('');
  const [newPrice, setNewPrice] = useState('');

  function reload() {
    setLoading(true);
    fetch('/api/admin/prices', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function save(slug: string, price: number) {
    await fetch(`/api/admin/prices/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ price })
    });
    reload();
  }
  async function remove(slug: string) {
    if (!confirm(`Видалити ціну для ${slug}?`)) return;
    await fetch(`/api/admin/prices/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    reload();
  }
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newSlug || !newPrice) return;
    await save(newSlug, Number(newPrice));
    setNewSlug('');
    setNewPrice('');
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
          {items.map((p) => (
            <tr key={p.product_id}>
              <td>
                <code>{p.product_id}</code>
              </td>
              <td>
                <input
                  type="number"
                  defaultValue={p.price}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v && v !== p.price) save(p.product_id, v);
                  }}
                  style={{ width: 100 }}
                />
              </td>
              <td>
                <button className="btn btn-danger" onClick={() => remove(p.product_id)}>
                  Видалити
                </button>
              </td>
            </tr>
          ))}
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

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    setLoading(true);
    listAllOrders()
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);

  if (loading) return <Loader />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  return (
    <div className="card">
      <h3>Замовлення</h3>
      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>Дата</th>
            <th>Клієнт</th>
            <th>Сума</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>#{o.id}</td>
              <td>{new Date(o.created_at).toLocaleString('uk-UA')}</td>
              <td>
                {o.full_name}
                <br />
                <small className="muted">{o.email}</small>
              </td>
              <td>{o.total} ₴</td>
              <td>
                <select
                  value={o.status}
                  onChange={(e) => updateOrderStatus(o.id, e.target.value as Order['status']).then(reload)}
                >
                  <option value="new">new</option>
                  <option value="paid">paid</option>
                  <option value="shipped">shipped</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
      <h1>Адміністративна панель</h1>
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
