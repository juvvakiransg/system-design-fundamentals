# LinkScale REST API

Base URL (local): `http://localhost:3000`

## POST /api/v1/urls
Request JSON: `{ "originalUrl": "https://example.com/path" }`
Success `201`: `{ "shortCode": "aB7x9K12", "shortUrl": "http://localhost:3000/aB7x9K12", "originalUrl": "https://example.com/path", "createdAt": "2026-11-18T12:00:00.000Z" }`
Errors: `400` invalid URL, `429` rate limit, `503` code allocation failure, `500` server error.

## GET /:code
Success: `302` with `Location` header. Unknown code: `404` JSON.

## GET /api/v1/urls/:code/stats
Success `200`: `{ "shortCode": "aB7x9K12", "originalUrl": "https://example.com/path", "clicks": 5, "createdAt": "2026-11-18T12:00:00.000Z" }`
Errors: `400` invalid code, `404` not found.

## GET /health
Success `200`: `{ "status": "ok" }`. Failure `503`: `{ "error": "Dependencies unavailable" }`.
