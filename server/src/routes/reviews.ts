import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const reviewsRouter = Router();

reviewsRouter.get('/:productId', (req, res) => {
  const productId = req.params.productId;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 5));
  const offset = (page - 1) * pageSize;

  const total = (db
    .prepare('SELECT COUNT(*) AS c FROM reviews WHERE product_id = ?')
    .get(productId) as { c: number }).c;

  const items = db
    .prepare(
      `SELECT id, product_id, user_id, author, rating, body, created_at
       FROM reviews WHERE product_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(productId, pageSize, offset);

  res.json({
    page,
    pageSize,
    total,
    hasNext: offset + pageSize < total,
    items
  });
});

const PostSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(5).max(2000)
});

reviewsRouter.post('/:productId', requireAuth, (req, res, next) => {
  try {
    const data = PostSchema.parse(req.body);
    const user = req.user!;
    const result = db
      .prepare(
        'INSERT INTO reviews (product_id, user_id, author, rating, body) VALUES (?, ?, ?, ?, ?)'
      )
      .run(req.params.productId, user.id, user.username, data.rating, data.body);
    const created = db
      .prepare('SELECT * FROM reviews WHERE id = ?')
      .get(Number(result.lastInsertRowid));
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});
