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

export type ListResponse = {
  count: number;
  results: Product[];
  hasNext: boolean;
};

type ListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  genre?: string;
  platform?: string;
};

const API = '/api';

export async function fetchProducts(params: ListParams): Promise<ListResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params.search) qs.set('search', params.search);
  if (params.ordering) qs.set('ordering', params.ordering);
  if (params.genre) qs.set('genre', params.genre);
  if (params.platform) qs.set('platform', params.platform);

  const res = await fetch(`${API}/products?${qs.toString()}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchProduct(slug: string): Promise<Product> {
  const res = await fetch(`${API}/products/${encodeURIComponent(slug)}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
