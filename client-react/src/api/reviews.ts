export type Review = {
  id: number;
  product_id: string;
  user_id: number | null;
  author: string;
  rating: number;
  body: string;
  created_at: string;
};

export type ReviewsPage = {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  items: Review[];
};

const API = '/api';

export async function fetchReviews(productId: string, page = 1, pageSize = 5): Promise<ReviewsPage> {
  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const res = await fetch(`${API}/reviews/${encodeURIComponent(productId)}?${qs.toString()}`, {
    credentials: 'include'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function postReview(productId: string, body: { rating: number; body: string }) {
  const res = await fetch(`${API}/reviews/${encodeURIComponent(productId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as Review;
}
