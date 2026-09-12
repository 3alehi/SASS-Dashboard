# NEXORA — Web App

React + TypeScript + Vite frontend, served at `/app/*` behind auth (public routes: `/`, `/login`,
`/register`, `/forgot-password`, `/reset-password`, `/auth/callback`).

## Development

```bash
npm run dev:web                        # http://localhost:5173
npm run build --workspace=apps/web
npm run test --workspace=apps/web
```

Requires `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_BASE_URL` — see
[`.env.example`](../../.env.example). The app talks to Supabase directly for authentication and to
the API in [`apps/api`](../api) for everything else.

See the root [README.md](../../README.md) for the monorepo overview, and
[docs/authentication.md](../../docs/authentication.md) /
[docs/authorization.md](../../docs/authorization.md) for how auth and permission-gated routes
(`<ProtectedRoute>`, `<PermissionRoute>`, `<Can>`) work.
