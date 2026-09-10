# Development Phases

NEXORA is built in phases. Each phase is implemented, linted, type-checked, tested,
and committed before the next one starts. Branching follows Git Flow:
`main` (production) ← `develop` (integration) ← `feature/*` (per-phase work).

| #   | Phase                               | Status     |
| --- | ----------------------------------- | ---------- |
| 1   | Repository + architecture + tooling | ✅ Done    |
| 2   | Design system + application shell   | ✅ Done    |
| 3   | Supabase + database + RLS           | ✅ Done    |
| 4   | Authentication                      | ✅ Done    |
| 5   | RBAC                                | ✅ Done    |
| 6   | Customers                           | ✅ Done    |
| 7   | Leads                               | ✅ Done    |
| 8   | Deals + pipeline                    | ✅ Done    |
| 9   | Tasks                               | ⏳ Planned |
| 10  | Tickets                             | ⏳ Planned |
| 11  | Team management                     | ⏳ Planned |
| 12  | Dashboard + analytics               | ⏳ Planned |
| 13  | Notifications + realtime            | ⏳ Planned |
| 14  | Global search + command palette     | ⏳ Planned |
| 15  | Audit logs                          | ⏳ Planned |
| 16  | Settings                            | ⏳ Planned |
| 17  | Import/export                       | ⏳ Planned |
| 18  | Landing page + pricing              | ⏳ Planned |
| 19  | Testing                             | ⏳ Planned |
| 20  | Security audit                      | ⏳ Planned |
| 21  | Performance optimization            | ⏳ Planned |
| 22  | Docker                              | ⏳ Planned |
| 23  | CI/CD                               | ⏳ Planned |
| 24  | Documentation                       | ⏳ Planned |
| 25  | Final production polish             | ⏳ Planned |

## Local Development

```bash
npm install
cp .env.example .env
npm run dev:web
npm run dev:api
```

## Branching Model (Git Flow)

- `main` — always deployable, production-ready.
- `develop` — integration branch; all feature branches merge here first.
- `feature/<name>` — one branch per phase/feature, merged into `develop` via PR.
- `release/<version>` — cut from `develop` when preparing a production release.
- `hotfix/<name>` — urgent fixes branched from `main`, merged back into both `main` and `develop`.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/).
