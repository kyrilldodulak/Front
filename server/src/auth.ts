import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { db, type User } from './db.js';

export const SESSION_COOKIE_NAME = 'gs_sid';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export type PublicUser = {
  id: number;
  username: string;
  email: string;
  role: User['role'];
  avatar: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser | null;
      sessionId?: string | null;
    }
  }
}

function toPublic(u: User | undefined): PublicUser | null {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    avatar: u.avatar
  };
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function createSession(userId: number): { id: string; expiresAt: Date } {
  const id = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(
    id,
    userId,
    expiresAt.toISOString()
  );
  return { id, expiresAt };
}

export function destroySession(id: string) {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
}

export function getUserBySession(id: string | undefined): PublicUser | null {
  if (!id) return null;
  const row = db
    .prepare(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND datetime(s.expires_at) > datetime('now')`
    )
    .get(id) as User | undefined;
  return toPublic(row);
}

export function findUserByUsernameOrEmail(usernameOrEmail: string): User | undefined {
  return db
    .prepare('SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1')
    .get(usernameOrEmail, usernameOrEmail) as User | undefined;
}

export function setSessionCookie(res: Response, id: string, expiresAt: Date) {
  res.cookie(SESSION_COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/'
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
}

export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const sid = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  req.sessionId = sid ?? null;
  req.user = getUserBySession(sid);
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Потрібна авторизація' });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Доступ лише для адміністраторів' });
    return;
  }
  next();
}
