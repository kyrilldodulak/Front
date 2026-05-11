import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { listOrders, type Order } from '../api/orders';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listOrders()
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (error) return <ErrorBox error={error} />;
  if (orders.length === 0)
    return (
      <div className="card">
        Ви ще не зробили жодного замовлення. <Link to="/catalog">До каталогу</Link>.
      </div>
    );

  return (
    <div className="card" style={{ padding: 0 }}>
      <table>
        <caption style={{ padding: 14 }}>Історія замовлень</caption>
        <thead>
          <tr>
            <th>№</th>
            <th>Дата</th>
            <th>Сума</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>#{o.id}</td>
              <td>{new Date(o.created_at).toLocaleString('uk-UA')}</td>
              <td>{o.total} ₴</td>
              <td>{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsTab() {
  const user = useAppSelector((s) => s.auth.user);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Файл більше 2 MB');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: form,
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Помилка');
      setMessage('Аватар оновлено!');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  if (!user) return null;
  return (
    <div className="card">
      <h3>Налаштування</h3>
      <p className="muted">
        Логін: <strong>{user.username}</strong>
      </p>
      <p className="muted">
        Email: <strong>{user.email}</strong>
      </p>
      <p className="muted">
        Роль: <strong>{user.role}</strong>
      </p>
      {user.avatar && (
        <img
          src={user.avatar}
          alt="аватар"
          style={{ width: 96, height: 96, borderRadius: 48, objectFit: 'cover', marginTop: 12 }}
        />
      )}
      <div className="form-row mt-16">
        <label>Завантажити новий аватар (PNG/JPG, ≤ 2 MB)</label>
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
      </div>
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const user = useAppSelector((s) => s.auth.user);
  const loading = useAppSelector((s) => s.auth.loading);

  if (loading) return <Loader />;
  if (!user) {
    return (
      <div className="card">
        <h2>Особистий кабінет</h2>
        <p className="muted">Щоб переглянути профіль, <a href="/login.html">увійдіть</a>.</p>
      </div>
    );
  }

  return (
    <section>
      <h1>Особистий кабінет</h1>
      <nav className="admin-tabs" aria-label="Розділи профілю">
        <NavLink to="/profile" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Замовлення
        </NavLink>
        <NavLink to="/profile/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
          Налаштування
        </NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<OrdersTab />} />
        <Route path="/orders" element={<OrdersTab />} />
        <Route path="/settings" element={<SettingsTab />} />
      </Routes>
    </section>
  );
}
