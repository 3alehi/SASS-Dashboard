# Authorization

NEXORA uses role-based access control (RBAC) enforced at two layers: the database (Row Level
Security) and the API (permission checks on every mutating route). The frontend only uses
permission data to hide/disable UI — it is never the source of truth.

> Full RBAC middleware and frontend permission hooks land in Phase 5. This document describes the
> data model that phase builds on, established in Phase 3.

## Roles

Fixed, system-defined roles (table `roles`): `OWNER`, `ADMIN`, `MANAGER`, `SALES`, `SUPPORT`,
`MEMBER`. Roles are global, not per-organization — the same six roles exist for every tenant, and
an organization member holds exactly one role per organization they belong to.

## Permissions

Granular `resource.action` strings (table `permissions`), e.g. `customers.create`,
`deals.update`, `team.manage`, `billing.manage`. See
[`0002_tenancy_and_rbac.sql`](../database/migrations/0002_tenancy_and_rbac.sql) for the full list.

## Role → permission matrix

| Permission group  | OWNER | ADMIN | MANAGER | SALES |      SUPPORT       |  MEMBER   |
| ----------------- | :---: | :---: | :-----: | :---: | :----------------: | :-------: |
| `customers.*`     |  ✅   |  ✅   |   ✅    |  ✅   |     read only      | read only |
| `leads.*`         |  ✅   |  ✅   |   ✅    |  ✅   |         —          | read only |
| `deals.*`         |  ✅   |  ✅   |   ✅    |  ✅   |         —          | read only |
| `tasks.*`         |  ✅   |  ✅   |   ✅    |  ✅   | read/create/update | read only |
| `tickets.*`       |  ✅   |  ✅   |   ✅    |   —   |         ✅         | read only |
| `reports.read`    |  ✅   |  ✅   |   ✅    |  ✅   |         —          |     —     |
| `settings.manage` |  ✅   |  ✅   |    —    |   —   |         —          |     —     |
| `team.manage`     |  ✅   |  ✅   |    —    |   —   |         —          |     —     |
| `billing.manage`  |  ✅   |  ✅   |    —    |   —   |         —          |     —     |

This matrix is seeded into `role_permissions` by migration `0002`, not hardcoded in application
code — it can be inspected or extended with plain SQL.

## Enforcement layers

1. **Database (Row Level Security).** Every tenant table's INSERT/UPDATE/DELETE policies call
   `has_permission(organization_id, 'resource.action')`. Even a request that bypassed the API
   entirely (e.g. a leaked anon key used directly against PostgREST) cannot write data the
   caller's role doesn't permit. See [`0012_row_level_security.sql`](../database/migrations/0012_row_level_security.sql).
2. **API.** Fastify route handlers re-check permissions server-side before executing a mutation
   (Phase 5). This is defense in depth, not the primary boundary — RLS is.
3. **Frontend.** UI hides or disables actions the current user's role doesn't permit (Phase 5).
   This is a UX affordance only; it is never trusted for security.

## Organization membership is never client-supplied

`organization_id` is resolved server-side from `organization_members` for the authenticated user
(`auth.uid()`), never accepted as a raw value from request bodies or query params for
authorization decisions. See [security.md](./security.md).
