# Security

## Threat model: multi-tenant data isolation

The primary security requirement in NEXORA is that one organization's users can never read or
write another organization's data. This is enforced with defense in depth:

1. **PostgreSQL Row Level Security** on every tenant table (see
   [`0012_row_level_security.sql`](../database/migrations/0012_row_level_security.sql)) — the
   database itself refuses cross-tenant reads/writes, independent of application code.
2. **Server-side permission checks** in the API (Phase 4/5) before any mutation.
3. **Never trusting client-supplied identifiers.** `organization_id`, `user_id`, `role`, and
   `permissions` are never accepted from request bodies, query params, or JWT claims the client
   controls — they are always re-derived server-side from the verified session and the
   `organization_members` table.

## Secrets

- `SUPABASE_SERVICE_ROLE_KEY` is a server-only secret. It is never referenced from `apps/web` (no
  `VITE_`-prefixed variable holds it), never logged, and never sent to the browser in any API
  response.
- `.env` is git-ignored; `.env.example` documents every variable with empty placeholder values.
  See [`.env.example`](../.env.example).
- `JWT_SECRET` and any other server secret are read from environment variables only, never
  hardcoded.

## Database-layer protections

- **Row Level Security** is enabled on every table that stores tenant data — no table relies on
  application code alone to filter by organization.
- **No `USING (true)` policies.** Every policy scopes through `is_org_member()` or
  `has_permission()`, both `security definer` functions that check `auth.uid()` against
  `organization_members`.
- **Foreign keys with explicit cascade/restrict behavior** prevent orphaned rows and accidental
  cross-tenant references (see individual migration files for the `on delete` behavior chosen per
  relationship).
- **`audit_logs` is effectively append-only** — no UPDATE or DELETE policy is granted to any role,
  so once an audit entry is written it cannot be altered or removed via the API or PostgREST.

## Planned application-layer protections (Phase 4/5/20)

- Input validation with Zod on every API route, mirroring frontend validation.
- Rate limiting, Helmet security headers, and CORS restricted to known origins.
- Structured logging (Pino) with request IDs; secrets and passwords are never logged.
- A dedicated security-audit pass (Phase 20) before production polish.
