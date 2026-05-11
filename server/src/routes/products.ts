import { Router } from 'express';
import { listProducts, getProduct } from '../rawg.js';

export const productsRouter = Router();

productsRouter.get('/', async (req, res, next) => {
  try {
    const { search, page, pageSize, ordering, genre, platform } = req.query as Record<
      string,
      string | undefined
    >;
    const data = await listProducts({
      search,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 12,
      ordering,
      genre,
      platform
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

productsRouter.get('/:slug', async (req, res, next) => {
  try {
    const product = await getProduct(req.params.slug);
    if (!product) {
      res.status(404).json({ error: 'Товар не знайдено' });
      return;
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});
