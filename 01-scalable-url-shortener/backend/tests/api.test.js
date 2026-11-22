import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
function fixture() {
  const rows = new Map(); let clicks = 0;
  const pool = { async query(sql, params = []) {
    if (sql.startsWith('INSERT')) { const [code, url] = params; if (rows.has(code)) { const e = new Error('duplicate'); e.code = '23505'; throw e; } const r = { short_code: code, original_url: url, created_at: new Date().toISOString() }; rows.set(code, r); return { rows: [r], rowCount: 1 }; }
    if (sql.startsWith('UPDATE')) { clicks++; return { rowCount: 1, rows: [] }; }
    const row = rows.get(params[0]);
    return { rows: row ? [{ ...row, click_count: clicks }] : [], rowCount: row ? 1 : 0 };
  }};
  const values = new Map();
  const cache = { async get(k) { return values.get(k); }, async set(k, v) { values.set(k, v); }, async ping() { return 'PONG'; } };
  return createApp({ pool, cache, generateCode: () => 'aB7x9K' });
}
test('create, redirect, stats and validation', async () => {
  const server = fixture().listen(0);
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const bad = await fetch(`${base}/api/v1/urls`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ originalUrl: 'file:///etc/passwd' }) });
    assert.equal(bad.status, 400);
    const created = await fetch(`${base}/api/v1/urls`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ originalUrl: 'https://example.com/abc' }) });
    assert.equal(created.status, 201);
    assert.equal((await created.json()).shortCode, 'aB7x9K');
    const redirected = await fetch(`${base}/aB7x9K`, { redirect: 'manual' });
    assert.equal(redirected.status, 302);
    assert.equal(redirected.headers.get('location'), 'https://example.com/abc');
    const stats = await fetch(`${base}/api/v1/urls/aB7x9K/stats`);
    assert.equal((await stats.json()).clicks, 1);
    assert.equal((await fetch(`${base}/missing1`)).status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
