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
│   ├── team/                 # GET /api/v1/organizations/:organizationId/team — reference RBAC route
│   ├── customers/             # full CRUD reference module (routes + repository split)
│   ├── leads/                   # CRUD + lead conversion workflow (calls the convert_lead() SQL function)
│   ├── pipelines/                # read-only: pipelines + ordered stages
│   ├── deals/                     # CRUD + move (Kanban drag-and-drop) + pipeline summary metrics
│   ├── tasks/                      # CRUD + comments + unpaginated /board endpoint
│   └── tickets/                     # CRUD + threaded conversation with internal notes
```

Each future module (customers, leads, deals, …) follows the `team` module's shape: a
`*.routes.ts` file registering endpoints with `[app.authenticate, requirePermission('...')]`
preHandlers and a Zod schema for the response.

## Current endpoints

| Method | Path                                                                  | Auth     | Permission                          | Notes                                                                                                                             |
| ------ | --------------------------------------------------------------------- | -------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/v1/health`                                                      | none     | —                                   | Liveness check                                                                                                                    |
| GET    | `/api/v1/me`                                                          | required | —                                   | Returns the caller's organizations, roles, and permissions                                                                        |
| GET    | `/api/v1/organizations/:organizationId/team`                          | required | `team.manage`                       | Reference implementation of the RBAC pattern                                                                                      |
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
