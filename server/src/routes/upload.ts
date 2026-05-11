import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const raw = path.extname(file.originalname).toLowerCase().slice(0, 8);
    const ext = /^\.[a-z0-9]+$/.test(raw) ? raw : '.bin';
    cb(null, `avatar-${req.user!.id}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Лише зображення'));
      return;
    }
    cb(null, true);
  }
});

export const uploadRouter = Router();

uploadRouter.post('/avatar', requireAuth, upload.single('avatar'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Файл не отримано' });
    return;
  }
  const url = `/uploads/${req.file.filename}`;
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(url, req.user!.id);
  res.json({ url });
});
