import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import { listLocalPrices, setLocalPrice, deleteLocalPrice } from '../rawg.js';

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get('/users', (_req, res) => {
  res.json(
    db
      .prepare(
        'SELECT id, username, email, role, blocked, created_at FROM users ORDER BY id'
      )
      .all()
  );
});

const PatchUser = z.object({
  blocked: z.coerce.number().int().optional(),
  role: z.enum(['user', 'admin', 'seller']).optional()
});

adminRouter.patch('/users/:id', (req, res, next) => {
  try {
    const data = PatchUser.parse(req.body);
    const updates: string[] = [];
    const values: Array<string | number> = [];
    if (typeof data.blocked === 'number') {
      updates.push('blocked = ?');
      values.push(data.blocked ? 1 : 0);
    }
    if (data.role) {
      updates.push('role = ?');
      values.push(data.role);
    }
    if (updates.length === 0) {
      res.status(400).json({ error: 'Немає змін' });
      return;
    }
    values.push(Number(req.params.id));
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/prices', (_req, res) => {
  res.json(listLocalPrices());
});

const PutPrice = z.object({ price: z.coerce.number().int().min(1).max(100000) });

adminRouter.put('/prices/:slug', (req, res, next) => {
  try {
    const data = PutPrice.parse(req.body);
    setLocalPrice(req.params.slug, data.price);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/prices/:slug', (req, res) => {
  deleteLocalPrice(req.params.slug);
  res.json({ ok: true });
});
