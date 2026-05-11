import type { User } from '../store/authSlice';

const API = '/api';

export async function me(): Promise<User | null> {
  const res = await fetch(`${API}/auth/me`, { credentials: 'include' });
  if (!res.ok) return null;
  const body = (await res.json()) as { user: User | null };
  return body.user;
}

export async function logout() {
  await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
}
