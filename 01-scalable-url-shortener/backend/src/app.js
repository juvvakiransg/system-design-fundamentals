import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { nanoid } from 'nanoid';
import { validateUrl, validateCode } from './validation.js';

const CREATE_LIMIT = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });
export function createApp({ pool, cache, baseUrl = 'http://localhost:3000', corsOrigin = 'http://localhost:5173', generateCode = () => nanoid(8) }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '16kb' }));
  app.get('/health', async (_req, res) => {
    try { await pool.query('SELECT 1'); await cache.ping(); res.json({ status: 'ok' }); }
    catch { res.status(503).json({ error: 'Dependencies unavailable' }); }
  });
  app.post('/api/v1/urls', CREATE_LIMIT, async (req, res, next) => {
    const { originalUrl } = req.body ?? {};
    if (!validateUrl(originalUrl)) return res.status(400).json({ error: 'Provide a valid public HTTP(S) URL (max 2048 characters)' });
    try {
      for (let i = 0; i < 5; i++) {
        const code = generateCode();
        try {
          const result = await pool.query('INSERT INTO urls (short_code, original_url) VALUES ($1, $2) RETURNING short_code, original_url, created_at', [code, originalUrl]);
          const row = result.rows[0];
          return res.status(201).json({ shortCode: row.short_code, shortUrl: `${baseUrl}/${row.short_code}`, originalUrl: row.original_url, createdAt: row.created_at });
        } catch (error) { if (error.code !== '23505') throw error; }
      }
      res.status(503).json({ error: 'Unable to allocate unique short code' });
    } catch (error) { next(error); }
  });
  app.get('/api/v1/urls/:code/stats', async (req, res, next) => {
    if (!validateCode(req.params.code)) return res.status(400).json({ error: 'Invalid short code' });
    try {
      const result = await pool.query('SELECT short_code, original_url, click_count, created_at FROM urls WHERE short_code = $1', [req.params.code]);
      if (!result.rowCount) return res.status(404).json({ error: 'Short URL not found' });
      const r = result.rows[0];
      res.json({ shortCode: r.short_code, originalUrl: r.original_url, clicks: Number(r.click_count), createdAt: r.created_at });
    } catch (error) { next(error); }
  });
  app.get('/:code', async (req, res, next) => {
    const code = req.params.code;
    if (!validateCode(code)) return res.status(404).json({ error: 'Short URL not found' });
    try {
      let originalUrl = null;
      try { originalUrl = await cache.get(`url:${code}`); } catch (e) { console.warn('Cache read failed:', e.message); }
      if (!originalUrl) {
        const result = await pool.query('SELECT original_url FROM urls WHERE short_code = $1', [code]);
        if (!result.rowCount) return res.status(404).json({ error: 'Short URL not found' });
        originalUrl = result.rows[0].original_url;
        try { await cache.set(`url:${code}`, originalUrl, { EX: 3600 }); } catch (e) { console.warn('Cache write failed:', e.message); }
      }
      await pool.query('UPDATE urls SET click_count = click_count + 1 WHERE short_code = $1', [code]);
      res.redirect(302, originalUrl);
    } catch (error) { next(error); }
  });
  app.use((err, _req, res, _next) => {
    console.error(err);
    if (err instanceof SyntaxError && 'body' in err) return res.status(400).json({ error: 'Invalid JSON' });
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}
