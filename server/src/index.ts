import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirnameInit = path.dirname(fileURLToPath(import.meta.url));
for (const candidate of [
  path.resolve(__dirnameInit, '..', '..', '.env'),
  path.resolve(__dirnameInit, '..', '.env'),
  path.resolve(process.cwd(), '.env')
]) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    console.log(`[env] loaded ${candidate}`);
    break;
  }
}

import express from 'express';
import cookieParser from 'cookie-parser';
import { attachUser } from './auth.js';
import { authRouter } from './routes/auth.js';
import { productsRouter } from './routes/products.js';
import { reviewsRouter } from './routes/reviews.js';
import { ordersRouter, adminOrdersRouter } from './routes/orders.js';
import { uploadRouter } from './routes/upload.js';
import { adminRouter } from './routes/admin.js';
import { swaggerRouter } from './swagger.js';
import { ssrHandler } from './ssr.js';
import { errorHandler, notFoundJson } from './middleware/errorHandler.js';

const publicDir = path.resolve(__dirnameInit, '..', 'public');
const uploadsDir = path.resolve(__dirnameInit, '..', 'uploads');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isDev = process.env.NODE_ENV !== 'production';

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(attachUser);

app.use('/uploads', express.static(uploadsDir, { maxAge: '7d', fallthrough: true }));
app.use('/app', express.static(path.join(publicDir, 'app'), { maxAge: '30d', fallthrough: true }));

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, time: new Date().toISOString(), env: isDev ? 'dev' : 'prod' })
);
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin/orders', adminOrdersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/docs', swaggerRouter);

const SPA_ROUTES = ['/catalog', '/product/:slug', '/profile', '/profile/*', '/admin', '/admin/*'];
for (const r of SPA_ROUTES) app.get(r, ssrHandler(isDev));

app.use(
  express.static(publicDir, {
    maxAge: '0',
    fallthrough: true,
    extensions: ['html'],
    index: ['index.html']
  })
);

app.use(notFoundJson);
app.use((_req, res) => {
  const file = path.join(publicDir, '404.html');
  if (fs.existsSync(file)) res.status(404).sendFile(file);
  else res.status(404).type('text/plain').send('Not found');
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[gameshop] http://localhost:${PORT}  (env: ${isDev ? 'dev' : 'prod'})`);
  if (!process.env.RAWG_API_KEY) {
    console.log('[gameshop] RAWG_API_KEY не задано — використовується вбудована заглушка з 12 ігор');
  }
});
