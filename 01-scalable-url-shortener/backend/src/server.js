import { Pool } from 'pg';
import { createClient } from 'redis';
import { createApp } from './app.js';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const cache = createClient({ url: process.env.REDIS_URL });
cache.on('error', err => console.warn('Redis error:', err.message));
await cache.connect();
const app = createApp({ pool, cache, baseUrl: process.env.PUBLIC_BASE_URL, corsOrigin: process.env.CORS_ORIGIN });
const server = app.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('LinkScale API ready'));
async function shutdown() { server.close(); await Promise.allSettled([pool.end(), cache.quit()]); process.exit(0); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
