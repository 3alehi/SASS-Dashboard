# Authorization

NEXORA uses role-based access control (RBAC) enforced at three independent layers: PostgreSQL Row
Level Security, the Fastify API, and the frontend. Only the first two are security boundaries —
the frontend layer exists purely to hide/disable UI a user couldn't use anyway.

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

2. **API.** Every protected route composes two preHandlers:
   `[app.authenticate, requirePermission('resource.action')]`
   ([`require-permission.ts`](../apps/api/src/modules/rbac/require-permission.ts)).
   `authenticate` verifies the Supabase JWT and attaches `request.user`; `requirePermission`
   resolves `organization_id` **only from the route param**, looks up the caller's ACTIVE
   membership and role in that organization directly from `organization_members`/`role_permissions`
   (bypassing RLS via the service-role client, since the API is the trusted party doing its own
   authorization here), and returns 403 if the permission isn't granted. This is independent
   enforcement, not a convenience wrapper around RLS — a bug in one layer doesn't compromise the
   other.

3. **Frontend.** `GET /api/v1/me` returns the caller's organizations with their resolved role and
   permission list, fetched once via `useMe()`/`usePermissions()`
   ([`use-permissions.ts`](../apps/web/src/hooks/use-permissions.ts)). The `<Can>` component and
   `<PermissionRoute>` guard use this to hide nav items, disable actions, and redirect to `/403`
   for pages the user's role doesn't grant — purely a UX affordance. A user who edits Zustand
   state or intercepts network requests to force `hasPermission()` to return `true` gains nothing:
   the API and RLS re-check independently on every request.

## Organization membership is never client-supplied

`organization_id` is resolved server-side from `organization_members` for the authenticated user,
never accepted as a raw value from request bodies or query params for authorization decisions —
only from the route path, which `requirePermission` then verifies against real membership before
trusting it for anything. See [security.md](./security.md).

## Team management cannot mint or orphan an OWNER

The team API (`apps/api/src/modules/team`) deliberately excludes `OWNER` from the set of roles
assignable via invite or role-change — a `team.manage` holder (which includes `ADMIN`) can invite
and promote up to `ADMIN`, but never create a second owner or hand ownership to someone else.
Conversely, `isLastActiveOwner()` blocks demoting, deactivating, or removing an organization's only
active owner through any of those endpoints, so an organization can never end up with zero owners
by mistake. There is currently no supported "transfer ownership" flow — that would need to be a
dedicated, more carefully guarded operation.
