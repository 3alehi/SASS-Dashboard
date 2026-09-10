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
│   └── team/                 # GET /api/v1/organizations/:organizationId/team — reference RBAC route
```

Each future module (customers, leads, deals, …) follows the `team` module's shape: a
`*.routes.ts` file registering endpoints with `[app.authenticate, requirePermission('...')]`
preHandlers and a Zod schema for the response.

## Current endpoints

| Method | Path                                         | Auth     | Permission    | Notes                                                      |
| ------ | -------------------------------------------- | -------- | ------------- | ---------------------------------------------------------- |
| GET    | `/api/v1/health`                             | none     | —             | Liveness check                                             |
| GET    | `/api/v1/me`                                 | required | —             | Returns the caller's organizations, roles, and permissions |
| GET    | `/api/v1/organizations/:organizationId/team` | required | `team.manage` | Reference implementation of the RBAC pattern               |

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
