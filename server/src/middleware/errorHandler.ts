import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function notFoundJson(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  next();
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[err]', req.method, req.path, err);
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Невалідні дані', details: err.flatten() });
    return;
  }
  if (err instanceof Error) {
    res.status(500).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
}
