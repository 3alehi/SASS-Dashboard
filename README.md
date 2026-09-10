# NEXORA

> Modern SaaS CRM & Business Management Platform

NEXORA is a multi-tenant SaaS CRM built to demonstrate professional, production-grade
full-stack engineering: authentication, RBAC, row-level security, a real sales pipeline,
analytics, and the operational tooling (CI/CD, testing, docs) a real commercial product needs.

This project is under active, phased development. See [Development Phases](#development-phases)
for current status.

## Tech Stack

**Frontend:** React, TypeScript, Vite, React Router, TanStack Query, Zustand, React Hook Form,
Zod, Tailwind CSS, shadcn/ui, Radix UI, Recharts, Framer Motion

**Backend:** Node.js, TypeScript, Fastify, Zod, JWT, REST + OpenAPI, Pino, Helmet

**Database:** Supabase (PostgreSQL, Auth, Row Level Security, Realtime)

**DevOps:** Docker, Docker Compose, GitHub Actions, ESLint, Prettier, Vitest, Playwright

## Monorepo Structure

```
nexora/
├── apps/
│   ├── web/          # React SPA (Vite)
│   └── api/          # Fastify REST API
├── packages/
│   └── shared/       # Shared TypeScript types & Zod schemas
├── database/
│   ├── migrations/   # SQL migrations
│   └── seeds/        # Seed data scripts
├── docs/             # Architecture & operational docs
└── .github/workflows # CI/CD pipelines
```

## Development Phases

This project is built incrementally, one phase at a time, each ending in a reviewed
Git commit. See [docs/development.md](docs/development.md) for the full phase plan and
current progress.

## Getting Started

Prerequisites: Node.js 20+, npm 10+.

```bash
npm install
cp .env.example .env   # fill in Supabase credentials
npm run dev:web         # http://localhost:5173
npm run dev:api         # http://localhost:4000
```

## Documentation

- [Architecture](docs/architecture.md)
- [Database](docs/database.md)
- [Authentication](docs/authentication.md)
- [Authorization](docs/authorization.md)
- [API](docs/api.md)
- [Development](docs/development.md)
- [Deployment](docs/deployment.md)
- [Testing](docs/testing.md)
- [Security](docs/security.md)

## License

Proprietary — portfolio project.
