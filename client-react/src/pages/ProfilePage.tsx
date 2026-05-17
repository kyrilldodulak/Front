import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { listOrders, type Order } from '../api/orders';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';

const STATUS_LABELS: Record<string, string> = {
  new: 'Нове',
  paid: 'Оплачено',
  shipped: 'Відправлено',
  cancelled: 'Скасовано'
};

export function OrderModal({ order, onClose, isAdmin }: { order: Order; onClose: () => void; isAdmin?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const grouped = (order.items ?? []).reduce<Record<string, { title: string; price: number; keys: string[] }>>((acc, it) => {
    const k = it.product_id;
    if (!acc[k]) acc[k] = { title: it.title, price: it.price, keys: [] };
    acc[k].keys.push(it.activation_key ?? '—');
    return acc;
  }, {});

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(6,8,14,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card"
        style={{
          width: 'min(640px, 100%)',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          padding: '28px 28px 24px',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Закрити"
          type="button"
          style={{
            position: 'absolute', top: 12, right: 14,
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: 'transparent', color: 'var(--text-dim)',
            fontSize: 22, cursor: 'pointer', lineHeight: 1,
          }}
        >×</button>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 4, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: 20 }}>Замовлення #{order.id}</h3>
          <span className="muted" style={{ fontSize: 13 }}>{new Date(order.created_at).toLocaleString('uk-UA')}</span>
        </div>
        <div className="muted" style={{ fontSize: 13, marginBottom: 18 }}>
          Статус: <strong style={{ color: 'var(--text)' }}>{STATUS_LABELS[order.status] ?? order.status}</strong>
          {' · '}На email: <strong style={{ color: 'var(--text)' }}>{order.email}</strong>
          {isAdmin && order.full_name ? <> {' · '}Клієнт: <strong style={{ color: 'var(--text)' }}>{order.full_name}</strong></> : null}
        </div>

        {order.comment && (
          <div style={{
            background: 'var(--bg-2)', borderLeft: '3px solid var(--accent)',
            padding: '10px 14px', borderRadius: 4, fontSize: 14, marginBottom: 18, color: 'var(--text-dim)',
          }}>{order.comment}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Object.entries(grouped).length === 0 && (
            <div className="muted" style={{ fontSize: 13 }}>Деталі замовлення тимчасово недоступні.</div>
          )}
          {Object.entries(grouped).map(([pid, g]) => (
            <div key={pid} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10, alignItems: 'baseline' }}>
                <strong style={{ fontSize: 14 }}>{g.title}</strong>
                <span style={{ color: 'var(--accent-2)', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
                  {g.price * g.keys.length} ₴
                  {g.keys.length > 1 ? <span className="muted" style={{ fontWeight: 400 }}> · {g.keys.length} коп.</span> : null}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Ключі активації
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {g.keys.map((k, i) => (
                  <code key={i} style={{
                    fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace',
                    background: 'var(--bg-2)', padding: '6px 10px', borderRadius: 4,
                    fontSize: 13, letterSpacing: '0.04em', color: 'var(--accent-2)',
                    userSelect: 'all',
                  }}>{k}</code>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16,
        }}>
          <span>Всього сплачено</span>
          <span style={{ color: 'var(--accent-2)' }}>{order.total} ₴</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    listOrders()
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const selected = selectedId !== null ? orders.find((o) => o.id === selectedId) ?? null : null;

  if (loading) return <Loader />;
  if (error) return <ErrorBox error={error} />;
  if (orders.length === 0)
    return (
      <div className="card">
        Ви ще не зробили жодного замовлення. <Link to="/catalog">До каталогу</Link>.
      </div>
    );

  return (
    <>
      {selected && <OrderModal order={selected} onClose={() => setSelectedId(null)} />}
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Дата</th>
              <th>Позицій</th>
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
                <td>{o.items?.length ?? '—'}</td>
                <td>{o.total} ₴</td>
                <td>{STATUS_LABELS[o.status] ?? o.status}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setSelectedId(o.id)}
                  >
                    Деталі та ключі
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
