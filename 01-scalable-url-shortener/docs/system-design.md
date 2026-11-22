# System Design: LinkScale

## 1. Functional requirements
1. Create a short code for a valid HTTP(S) URL.
2. Redirect short code to destination with HTTP 302.
3. Return click count and creation timestamp.
4. Return 404 for unknown codes.

## 2. Non-functional requirements
- Low latency for redirects; Redis cache-aside reduces repeated mapping lookups.
- Persistent mapping and analytics in PostgreSQL.
- Random codes and unique DB index mitigate collisions.
- Simple, stateless API process suitable for horizontal scaling after replacing in-memory rate limits.

## 3. HLD
Browser → Express API → PostgreSQL (source of truth); Express API ↔ Redis (mapping cache). The browser calls the backend on port 3000. The UI is served by Nginx on port 5173.

## 4. LLD
- `POST /api/v1/urls`: validate URL → generate 8-character Nano ID → INSERT → return link. Retry on unique constraint conflicts.
- `GET /:code`: validate code → Redis GET → on miss PostgreSQL SELECT and Redis SET with 1-hour TTL → PostgreSQL atomic click increment → 302 redirect.
- `GET /api/v1/urls/:code/stats`: PostgreSQL SELECT → return JSON.
- `GET /health`: verify PostgreSQL and Redis connectivity.

## 5. Data model
`urls(id BIGSERIAL PK, short_code VARCHAR(16) UNIQUE, original_url TEXT, created_at TIMESTAMPTZ, click_count BIGINT)`.

## 6. Scale and capacity (illustrative, not benchmarked)
Assume 100,000 new links/day and 10 million redirects/day. Average writes ≈1.16/s and redirects ≈116/s, with peaks potentially 10× higher. At 150 bytes of logical mapping data per link (excluding database overhead/indexes), 36.5M new links/year ≈5.5 GB raw mapping data/year. Real storage, replication, WAL, and index costs will be higher. A single database can be adequate initially; benchmark before adding replicas or sharding.

## 7. Trade-offs
- **302 vs 301:** 302 reduces long-lived browser caching, allowing counts to reflect more visits; not all visits can be counted reliably.
- **Synchronous counters:** easy to reason about, but creates a write on every redirect. At higher traffic, queue events and batch aggregate asynchronously.
- **Cache-aside:** cache failures fall back to PostgreSQL, but Redis connection is required for startup and health checks in this demo.
- **Random Nano IDs:** simple and collision-resistant for POC; DB uniqueness enforces correctness.
- **Rate limiting:** local memory by default; use a shared Redis-backed limiter for multiple replicas.

## 8. Reliability, security, operations
- Container health checks for PostgreSQL and Redis.
- Backend startup depends on healthy dependencies.
- Parameterized SQL prevents basic SQL injection.
- Add authentication, domain safety checks, phishing abuse monitoring, TLS, secrets management, centralized logs, tracing, backup/restore tests, and per-tenant quotas before production.
- Recommended metrics: p50/p95/p99 redirect latency, error rate, cache hit ratio, DB pool saturation, creation throughput, and redirect throughput.

## 9. Test plan
- Included: URL validation and mocked HTTP API flow (`npm test` in backend).
- Recommended next: real Postgres/Redis integration tests, concurrency collision tests, chaos testing with Redis offline, and k6 load tests.
