import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  findUserByUsernameOrEmail,
  requireAuth
} from '../auth.js';

export const authRouter = Router();

const RegisterSchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(['user', 'seller']).optional(),
  company: z.string().min(2).optional()
});

authRouter.post('/register', async (req, res, next) => {
  try {
    const data = RegisterSchema.parse(req.body);
    const exists = db
      .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .get(data.username, data.email);
    if (exists) {
      res.status(409).json({ error: 'Логін або email вже зайняті' });
      return;
    }
    const hash = await hashPassword(data.password);
    const result = db
      .prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(data.username, data.email, hash, 'user');
    const userId = Number(result.lastInsertRowid);
    const session = createSession(userId);
    setSessionCookie(res, session.id, session.expiresAt);
    res.status(201).json({
      user: {
        id: userId,
        username: data.username,
        email: data.email,
        role: 'user',
        avatar: null
      }
    });
  } catch (err) {
    next(err);
  }
});

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const data = LoginSchema.parse(req.body);
    const user = findUserByUsernameOrEmail(data.username);
    if (!user) {
      res.status(401).json({ error: 'Невірний логін або пароль' });
      return;
    }
    if (user.blocked) {
      res.status(403).json({ error: 'Користувача заблоковано' });
      return;
    }
    if (!(await verifyPassword(data.password, user.password_hash))) {
      res.status(401).json({ error: 'Невірний логін або пароль' });
      return;
    }
    const session = createSession(user.id);
    setSessionCookie(res, session.id, session.expiresAt);
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', (req, res) => {
  if (req.sessionId) destroySession(req.sessionId);
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get('/me', (req, res) => {
  res.json({ user: req.user ?? null });
});

authRouter.get('/me/strict', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
