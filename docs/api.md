# API

The NEXORA API is a Fastify + TypeScript service in [`apps/api`](../apps/api), versioned under
`/api/v1`. It verifies Supabase-issued JWTs and enforces RBAC server-side — it never trusts a
client-supplied `organization_id`, `user_id`, `role`, or permission.

## Running locally

```bash
npm run dev:api   # http://localhost:4000
```

Interactive Swagger UI is available at `http://localhost:4000/docs` in non-production
environments only (see [security.md](./security.md)).

## Response format

Every response follows the same envelope:

```json
// success
{ "success": true, "data": { ... } }

// failure
{ "success": false, "error": { "code": "FORBIDDEN", "message": "...", "details": null } }
```

## Structure

```
apps/api/src/
├── app.ts              # builds the Fastify instance: plugins, routes, error handling
├── server.ts            # entrypoint: starts listening, graceful shutdown
├── config/env.ts         # Zod-validated environment variables
├── lib/supabase-admin.ts # service-role Supabase client (server-only)
├── plugins/
│   ├── authenticate.ts    # verifies the bearer JWT, decorates request.user
│   └── error-handler.ts   # central error handler + 404 handler
├── modules/
│   ├── health/            # GET /api/v1/health — public liveness check
│   ├── me/                 # GET /api/v1/me — caller's orgs + resolved permissions
│   ├── rbac/                # requirePermission() preHandler + membership/permission repository
│   ├── team/                 # invite/role-change/deactivate/remove, with last-owner protection
│   ├── customers/             # full CRUD reference module (routes + repository split)
│   ├── leads/                   # CRUD + lead conversion workflow (calls the convert_lead() SQL function)
│   ├── pipelines/                # read-only: pipelines + ordered stages
│   ├── deals/                     # CRUD + move (Kanban drag-and-drop) + pipeline summary metrics
│   ├── tasks/                      # CRUD + comments + unpaginated /board endpoint
│   ├── tickets/                     # CRUD + threaded conversation with internal notes
│   ├── dashboard/                    # KPI overview + chart series, gated by reports.read
│   ├── notifications/                 # Per-user notification inbox, delivered live via Supabase Realtime
│   ├── search/                         # Global search across customers/leads/deals/tasks/tickets
│   └── audit/                           # Audit log plugin + list endpoint, gated by settings.manage
```

Each future module (customers, leads, deals, …) follows the `team` module's shape: a
`*.routes.ts` file registering endpoints with `[app.authenticate, requirePermission('...')]`
preHandlers and a Zod schema for the response.

## Current endpoints

| Method | Path                                                                  | Auth     | Permission                          | Notes                                                                                                                             |
| ------ | --------------------------------------------------------------------- | -------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/v1/health`                                                      | none     | —                                   | Liveness check                                                                                                                    |
| GET    | `/api/v1/me`                                                          | required | —                                   | Returns the caller's organizations, roles, and permissions                                                                        |
| GET    | `/api/v1/me/notification-preferences`                                 | required | —                                   | The caller's per-type in-app notification toggles (defaults to all enabled)                                                       |
| PATCH  | `/api/v1/me/notification-preferences`                                 | required | —                                   | Partial update of the caller's notification preferences                                                                           |
| GET    | `/api/v1/organizations/:organizationId/team`                          | required | `team.manage`                       | List organization members                                                                                                         |
| POST   | `/api/v1/organizations/:organizationId/team/invite`                   | required | `team.manage`                       | Invite a member by email (sends a real invite via Supabase Auth); OWNER is not an assignable role here                            |
| PATCH  | `/api/v1/organizations/:organizationId/team/:memberId/role`           | required | `team.manage`                       | Change a member's role; refuses to demote an organization's only active OWNER                                                     |
| POST   | `/api/v1/organizations/:organizationId/team/:memberId/deactivate`     | required | `team.manage`                       | Revoke access without deleting the member's history; refuses on the only active OWNER                                             |
| POST   | `/api/v1/organizations/:organizationId/team/:memberId/reactivate`     | required | `team.manage`                       | Restore a deactivated member                                                                                                      |
| DELETE | `/api/v1/organizations/:organizationId/team/:memberId`                | required | `team.manage`                       | Remove a member from the organization; refuses on the only active OWNER                                                           |
| GET    | `/api/v1/organizations/:organizationId/customers`                     | required | `customers.read`                    | Paginated, searchable, filterable, sortable list                                                                                  |
| GET    | `/api/v1/organizations/:organizationId/customers/:customerId`         | required | `customers.read`                    | Single customer                                                                                                                   |
| POST   | `/api/v1/organizations/:organizationId/customers`                     | required | `customers.create`                  | Create a customer                                                                                                                 |
| PATCH  | `/api/v1/organizations/:organizationId/customers/:customerId`         | required | `customers.update`                  | Partial update                                                                                                                    |
| DELETE | `/api/v1/organizations/:organizationId/customers/:customerId`         | required | `customers.delete`                  | Soft-delete (archive) — sets `deleted_at`, never a hard delete                                                                    |
| POST   | `/api/v1/organizations/:organizationId/customers/:customerId/restore` | required | `customers.update`                  | Restores an archived customer                                                                                                     |
| GET    | `/api/v1/organizations/:organizationId/leads`                         | required | `leads.read`                        | Paginated, searchable, filterable, sortable list                                                                                  |
| GET    | `/api/v1/organizations/:organizationId/leads/:leadId`                 | required | `leads.read`                        | Single lead                                                                                                                       |
| POST   | `/api/v1/organizations/:organizationId/leads`                         | required | `leads.create`                      | Create a lead                                                                                                                     |
| PATCH  | `/api/v1/organizations/:organizationId/leads/:leadId`                 | required | `leads.update`                      | Partial update                                                                                                                    |
| DELETE | `/api/v1/organizations/:organizationId/leads/:leadId`                 | required | `leads.delete`                      | Soft-delete — sets `deleted_at` (no restore endpoint yet)                                                                         |
| POST   | `/api/v1/organizations/:organizationId/leads/:leadId/convert`         | required | `leads.update` + `customers.create` | Converts a lead into a customer (+ contact, optionally a deal) via the `convert_lead()` Postgres function; preserves the lead row |
| GET    | `/api/v1/organizations/:organizationId/pipelines`                     | required | `deals.read`                        | List pipelines with their ordered stages                                                                                          |
| GET    | `/api/v1/organizations/:organizationId/pipelines/:pipelineId/deals`   | required | `deals.read`                        | Every open+closed deal in a pipeline, unpaginated (feeds the Kanban board)                                                        |
| GET    | `/api/v1/organizations/:organizationId/pipelines/:pipelineId/summary` | required | `deals.read`                        | Total/weighted/won value and conversion rate for a pipeline                                                                       |
| GET    | `/api/v1/organizations/:organizationId/deals`                         | required | `deals.read`                        | Paginated, searchable, filterable, sortable list                                                                                  |
| GET    | `/api/v1/organizations/:organizationId/deals/:dealId`                 | required | `deals.read`                        | Single deal                                                                                                                       |
| POST   | `/api/v1/organizations/:organizationId/deals`                         | required | `deals.create`                      | Create a deal                                                                                                                     |
| PATCH  | `/api/v1/organizations/:organizationId/deals/:dealId`                 | required | `deals.update`                      | Partial update                                                                                                                    |
| POST   | `/api/v1/organizations/:organizationId/deals/:dealId/move`            | required | `deals.update`                      | Moves a deal to a different stage; validates the stage belongs to the deal's pipeline, stamps probability + closed_at             |
| DELETE | `/api/v1/organizations/:organizationId/deals/:dealId`                 | required | `deals.delete`                      | Soft-delete — sets `deleted_at`                                                                                                   |
| GET    | `/api/v1/organizations/:organizationId/tasks`                         | required | `tasks.read`                        | Paginated, searchable, filterable, sortable list                                                                                  |
| GET    | `/api/v1/organizations/:organizationId/tasks/board`                   | required | `tasks.read`                        | Every open task, unpaginated (feeds the board and calendar views)                                                                 |
| GET    | `/api/v1/organizations/:organizationId/tasks/:taskId`                 | required | `tasks.read`                        | Single task                                                                                                                       |
| POST   | `/api/v1/organizations/:organizationId/tasks`                         | required | `tasks.create`                      | Create a task                                                                                                                     |
| PATCH  | `/api/v1/organizations/:organizationId/tasks/:taskId`                 | required | `tasks.update`                      | Partial update — status → `COMPLETED` stamps `completed_at`, other statuses clear it                                              |
| DELETE | `/api/v1/organizations/:organizationId/tasks/:taskId`                 | required | `tasks.delete`                      | Soft-delete — sets `deleted_at`                                                                                                   |
| GET    | `/api/v1/organizations/:organizationId/tasks/:taskId/comments`        | required | `tasks.read`                        | List comments on a task                                                                                                           |
| POST   | `/api/v1/organizations/:organizationId/tasks/:taskId/comments`        | required | `tasks.update`                      | Add a comment to a task                                                                                                           |
| GET    | `/api/v1/organizations/:organizationId/tickets`                       | required | `tickets.read`                      | Paginated, searchable, filterable, sortable list                                                                                  |
| GET    | `/api/v1/organizations/:organizationId/tickets/:ticketId`             | required | `tickets.read`                      | Single ticket                                                                                                                     |
| POST   | `/api/v1/organizations/:organizationId/tickets`                       | required | `tickets.create`                    | Create a ticket                                                                                                                   |
| PATCH  | `/api/v1/organizations/:organizationId/tickets/:ticketId`             | required | `tickets.update`                    | Partial update — status → RESOLVED/CLOSED stamps the matching timestamp                                                           |
| DELETE | `/api/v1/organizations/:organizationId/tickets/:ticketId`             | required | `tickets.delete`                    | Soft-delete — sets `deleted_at`                                                                                                   |
| GET    | `/api/v1/organizations/:organizationId/tickets/:ticketId/messages`    | required | `tickets.read`                      | List the conversation, including internal notes (staff-only surface)                                                              |
| POST   | `/api/v1/organizations/:organizationId/tickets/:ticketId/messages`    | required | `tickets.update`                    | Reply, or add an internal note with `isInternal: true`                                                                            |
| GET    | `/api/v1/organizations/:organizationId/dashboard/overview`            | required | `reports.read`                      | KPI overview (revenue, pipeline value, won deals, conversion rate, new customers, open tasks) with period-over-period comparison  |
| GET    | `/api/v1/organizations/:organizationId/dashboard/revenue`             | required | `reports.read`                      | Revenue over time, current vs. previous period                                                                                    |
| GET    | `/api/v1/organizations/:organizationId/dashboard/pipeline-by-stage`   | required | `reports.read`                      | Open deal value and count grouped by pipeline stage (uses the organization's first pipeline)                                      |
| GET    | `/api/v1/organizations/:organizationId/dashboard/won-lost`            | required | `reports.read`                      | Deals won vs. lost per day for the selected range                                                                                 |
| GET    | `/api/v1/organizations/:organizationId/dashboard/lead-conversion`     | required | `reports.read`                      | Lead funnel counts by status (NEW/CONTACTED/QUALIFIED/CONVERTED) created within the range                                         |
| GET    | `/api/v1/organizations/:organizationId/dashboard/sales-performance`   | required | `reports.read`                      | Won deal value and count grouped by owner, sorted descending by value                                                             |

All `dashboard/*` endpoints accept the shared `DashboardQuery` querystring: `preset`
(`7d` / `30d` / `90d` / `this_year` / `custom`, default `30d`), `from`/`to` (ISO date
strings, used when `preset=custom`), and `compare` (boolean, default `false` — when
true, KPIs and the revenue series also return the immediately preceding period of
equal length for comparison).

| GET | `/api/v1/organizations/:organizationId/notifications` | required | — | Paginated list of the caller's own notifications (`unreadOnly` filter) |
| GET | `/api/v1/organizations/:organizationId/notifications/unread-count` | required | — | Unread count for the caller, polled by the bell badge as a fallback and read on mount |
| POST | `/api/v1/organizations/:organizationId/notifications/read-all` | required | — | Marks every one of the caller's notifications as read |
| POST | `/api/v1/organizations/:organizationId/notifications/:notificationId/read` | required | — | Marks a single notification as read |

`notifications/*` routes have no permission gate beyond authentication — every query
already filters by `request.user.id`, matching the notifications table's RLS policies,
so there is nothing an additional permission check would protect. New notifications
arrive in the frontend via a Supabase Realtime subscription (see
[database.md](./database.md#realtime)) rather than polling; the unread-count and list
endpoints back the initial render and the full notifications page.

| GET | `/api/v1/organizations/:organizationId/search` | required | — | Ranked search across customers, leads, deals, tasks, and tickets (`q`, `limit`, default 8) |

`search` has no `requirePermission()` gate beyond authentication either — the
`global_search()` Postgres function it calls checks organization membership and, per
entity type, the matching `.read` permission itself, so a caller without e.g.
`leads.read` simply never sees lead rows in the result set.

| GET | `/api/v1/organizations/:organizationId/audit-logs` | required | `settings.manage` | Paginated, filterable audit trail (`entityType`, `action`, `actorId`, `from`, `to`) |

## Audit logging

Every mutating route that creates, updates, or deletes a business record opts into
automatic audit logging by adding `config: { audit: { action, entityType } }` next to
its `schema`:

```ts
app.post(
  '/organizations/:organizationId/customers',
  {
    preHandler: [app.authenticate, requirePermission('customers.create')],
    config: { audit: { action: 'customer.create', entityType: 'customer' } },
    schema: {
      params: paramsSchema,
      body: createCustomerSchema,
      response: { 201: customerResponseSchema },
    },
  },
  async (request, reply) => {
    /* ... */
  },
);
```

A single `onSend` hook (`src/plugins/audit-log.ts`) reads that config after every
request and, only on a successful (2xx) response, writes a row to `audit_logs` —
resolving the entity id from the route's `:xId` param for update/delete, or from the
`{ data: { id } }` response body for create. This means a route can't forget to log:
adding the config is the only step, and a failed write is never logged as having
happened. High-frequency, conversational writes (task comments, ticket messages) are
deliberately excluded — audit logs record discrete business events, not chat.

## Adding a protected route

```ts
app.get(
  '/organizations/:organizationId/customers',
  {
    preHandler: [app.authenticate, requirePermission('customers.read')],
    schema: { params: paramsSchema, response: { 200: responseSchema } },
  },
  async (request) => {
    // request.user and request.membership are available here
  },
);
```

See [authorization.md](./authorization.md) for the full enforcement model.

## Logging

Structured JSON logging via Fastify's built-in Pino logger (pretty-printed in development). Every
request gets a `reqId`; completion is logged with method, url, status code, and response time.
Authorization headers and cookies are redacted from logs. See [security.md](./security.md).
