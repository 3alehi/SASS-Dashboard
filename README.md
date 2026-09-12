# NEXORA

> Multi-tenant SaaS CRM & Business Management Platform

NEXORA is a multi-tenant CRM: organizations sign up, invite team members with roles, and manage
customers, leads, a sales pipeline, tasks, and support tickets, all scoped strictly to their own
tenant. It's built as a full-stack reference implementation — authentication, RBAC enforced at the
database and API layers, row-level security, realtime notifications, audit logging, and analytics
dashboards — using a typical modern TypeScript stack end to end.

This project is under active, phased development. See [Development Phases](#development-phases)
for current status.

## Tech Stack

**Frontend:** React, TypeScript, Vite, React Router, TanStack Query, Zustand, React Hook Form,
Zod, Tailwind CSS, shadcn/ui, Radix UI, Recharts

**Backend:** Node.js, TypeScript, Fastify, Zod, Pino, Helmet, `@fastify/rate-limit`

**Database:** Supabase (PostgreSQL, Auth, Row Level Security, Realtime)

**Tooling:** npm workspaces, ESLint, Prettier, Vitest

## Monorepo Structure

```
nexora/
├── apps/
│   ├── web/          # React SPA (Vite) — see apps/web/README.md
│   └── api/          # Fastify REST API — see apps/api/README.md
├── packages/
│   └── shared/       # Shared Zod schemas, types, and RBAC constants (@nexora/shared)
├── database/
│   ├── migrations/   # SQL migrations, applied in filename order
│   └── seeds/        # Seed data scripts
└── docs/             # Architecture and operational docs
```

## Getting Started

Prerequisites: Node.js 20+, npm 10+, and a Supabase project (hosted or local via the Supabase CLI).

```bash
npm install
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
npm run dev:web         # http://localhost:5173
npm run dev:api          # http://localhost:4000 (Swagger UI at /docs)
```

The database schema lives in [`database/migrations/`](database/migrations) — apply it to your
Supabase project with the Supabase CLI (`supabase db reset` locally, `supabase db push` against a
linked hosted project). See [docs/database.md](docs/database.md) for details.

## Features

Implemented, and enforced through both the API (`requirePermission`) and Postgres Row Level
Security — see [docs/authorization.md](docs/authorization.md):

- **Auth** — Supabase-backed sign up, sign in, email verification, password reset, session
  persistence across tabs.
- **RBAC** — six fixed roles (`OWNER`, `ADMIN`, `MANAGER`, `SALES`, `SUPPORT`, `MEMBER`), a
  `resource.action` permission matrix, enforced at the database, API, and (for UX only) frontend.
- **Customers** — CRUD with contacts, search, filtering, soft delete/restore.
- **Leads** — CRUD and a conversion workflow into a customer (+ contact, optionally a deal).
- **Deals & pipeline** — Kanban-style pipeline board, drag-and-drop stage moves, pipeline summary
  metrics.
- **Tasks** — CRUD, comments, board/calendar views.
- **Tickets** — threaded support conversations with staff-only internal notes.
- **Team management** — invite, role changes, deactivate/reactivate/remove, with last-owner
  protection.
- **Dashboard & analytics** — KPI overview and chart series (revenue, pipeline by stage, won/lost,
  lead conversion, sales performance by owner) with period-over-period comparison.
- **Notifications** — per-user inbox delivered live via Supabase Realtime, with per-type
  preferences.
- **Global search** — ranked search across customers, leads, deals, tasks, and tickets.
- **Audit logs** — append-only trail of every mutating action, restricted to `settings.manage`.
- **Settings** — profile, notification preferences, appearance, and security are implemented;
  organization, team, and role settings pages are still placeholders (Phase 16, in progress).

## Documentation

- [docs/development.md](docs/development.md) — phase plan, current progress, branching model
- [docs/database.md](docs/database.md) — schema, multi-tenancy, RLS, database functions, realtime
- [docs/api.md](docs/api.md) — API architecture, module structure, full endpoint reference
- [docs/authentication.md](docs/authentication.md) — auth flows
- [docs/authorization.md](docs/authorization.md) — RBAC model and enforcement layers
- [docs/security.md](docs/security.md) — threat model and security design notes

## License

Proprietary — portfolio project.
