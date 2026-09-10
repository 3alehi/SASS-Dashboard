# NEXORA — API

Fastify + TypeScript REST API, versioned under `/api/v1`. See [docs/api.md](../../docs/api.md) for
architecture, endpoints, and how to add a new protected route.

## Development

```bash
npm run dev:api        # http://localhost:4000, Swagger UI at /docs
npm run build --workspace=apps/api
npm run test --workspace=apps/api
```

Requires `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET` — see
[`.env.example`](../../.env.example).
