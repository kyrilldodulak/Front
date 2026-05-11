import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../auth.js';

const ItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  price: z.coerce.number().int().min(1),
  qty: z.coerce.number().int().min(1).max(99)
});

const OrderSchema = z.object({
  customer: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    city: z.string().min(2),
    address: z.string().min(2),
    comment: z.string().max(500).optional()
  }),
  items: z.array(ItemSchema).min(1)
});

const STATUSES = ['new', 'paid', 'shipped', 'cancelled'] as const;

export const ordersRouter = Router();

ordersRouter.get('/', requireAuth, (req, res) => {
  const userId = req.user!.id;
  const orders = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as Array<{ id: number }>;
  for (const o of orders as Array<{ id: number; items?: unknown[] }>) {
    o.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
  }
  res.json(orders);
});

ordersRouter.post('/', requireAuth, (req, res, next) => {
  try {
    const data = OrderSchema.parse(req.body);
    const user = req.user!;
    const total = data.items.reduce((s, it) => s + it.price * it.qty, 0);

    const tx = db.transaction(() => {
      const result = db
        .prepare(
          `INSERT INTO orders (user_id, full_name, email, phone, city, address, comment, total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          user.id,
          data.customer.fullName,
          data.customer.email,
          data.customer.phone,
          data.customer.city,
          data.customer.address,
          data.customer.comment ?? null,
          total
        );
      const orderId = Number(result.lastInsertRowid);
      const insertItem = db.prepare(
        'INSERT INTO order_items (order_id, product_id, title, price, qty) VALUES (?, ?, ?, ?, ?)'
      );
      for (const it of data.items) insertItem.run(orderId, it.id, it.title, it.price, it.qty);
      return orderId;
    });

    res.status(201).json({ id: tx(), total, status: 'new' });
  } catch (err) {
    next(err);
  }
});

export const adminOrdersRouter = Router();

adminOrdersRouter.get('/', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all());
});

adminOrdersRouter.patch('/:id', requireAdmin, (req, res) => {
  const status = String(req.body?.status || '');
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    res.status(400).json({ error: 'Невалідний статус' });
    return;
  }
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, Number(req.params.id));
  res.json({ ok: true });
});
