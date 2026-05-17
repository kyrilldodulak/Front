export type OrderItem = {
  product_id: string;
  title: string;
  price: number;
  qty: number;
  activation_key: string | null;
};

export type Order = {
  id: number;
  user_id: number | null;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  address: string | null;
  comment: string | null;
  status: 'new' | 'paid' | 'shipped' | 'cancelled';
  total: number;
  created_at: string;
  items?: OrderItem[];
};

const API = '/api';

export async function listOrders(): Promise<Order[]> {
  const res = await fetch(`${API}/orders`, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function listAllOrders(): Promise<Order[]> {
  const res = await fetch(`${API}/admin/orders`, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function updateOrderStatus(id: number, status: Order['status']) {
  const res = await fetch(`${API}/admin/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
