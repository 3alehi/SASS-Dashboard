# Docker

NEXORA ships two independent, production-oriented images:

- `apps/api/Dockerfile` — the Fastify API.
- `apps/web/Dockerfile` — the React SPA, served by nginx.

Both talk to a hosted Supabase project. There is no Postgres container —
`database/migrations/*.sql` are plain SQL files meant to be applied to a
Supabase project via the Supabase CLI/dashboard, not to a local database.

## Building the images standalone

From the repository root (the build context must be the repo root so the
Dockerfiles can reach `packages/shared`):

```bash
# API
docker build -f apps/api/Dockerfile -t nexora-api .

# Web — VITE_* vars are baked into the static bundle at build time, so they
# must be passed as build args here, not as runtime env vars.
docker build -f apps/web/Dockerfile \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your-anon-key \
  --build-arg VITE_API_BASE_URL=http://localhost:4000/api/v1 \
  -t nexora-web .
```

Run them:

```bash
docker run --rm -p 4000:4000 --env-file .env nexora-api
docker run --rm -p 8080:80 nexora-web
```

## Running the full stack with docker-compose

```bash
cp .env.example .env   # fill in real Supabase project + JWT values
docker compose up --build
```

- API: http://localhost:4000/api/v1/health
- Web: http://localhost:8080

`docker-compose.yml` reads `.env` twice, for two different purposes:

- The `api` service uses `env_file: .env` to inject every backend variable
  (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `JWT_SECRET`, `API_PORT`, `API_HOST`, `API_CORS_ORIGIN`, `LOG_LEVEL`,
  `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`) as real runtime environment
  variables inside the container.
- The `web` service's `build.args` interpolate `${VITE_SUPABASE_URL}`,
  `${VITE_SUPABASE_ANON_KEY}`, and `${VITE_API_BASE_URL}` from the same
  root `.env` file — `docker compose` automatically loads `.env` from the
  project root for this kind of `${VAR}` substitution, no extra
  configuration needed.

All required variables and their meaning are documented in
`.env.example` at the repo root — copy it to `.env` and fill in real
values before running either `docker compose up` or a standalone
`docker run --env-file .env`.

## Why the API image doesn't just run `node dist/server.js`

`apps/api` compiles cleanly to `apps/api/dist/server.js` via
`tsc && tsc-alias`, and normally you'd run a production Node image with
plain `node dist/server.js`. That breaks here because `packages/shared`
is **not** compiled to JavaScript — its `package.json` points `main` and
`types` directly at `./src/index.ts`, and it's consumed as raw
TypeScript everywhere (transpiled on the fly by `tsx` in `apps/api`,
by Vite in `apps/web`, and by `vitest` in tests). The moment the compiled
API tries to `import` `@nexora/shared`, Node's native ESM loader hits a
`.ts` file it doesn't know how to execute and crashes with
`ERR_UNKNOWN_FILE_EXTENSION`.

The fix used here is the least invasive one: the runtime image still
compiles `apps/api` normally (so path aliases are resolved to relative
imports ahead of time via `tsc-alias`), but starts the compiled output
with `tsx` instead of `node`:

```
CMD ["node_modules/.bin/tsx", "apps/api/dist/server.js"]
```

`tsx` transparently handles the `.ts` import of `@nexora/shared/src/index.ts`
without any other code changes, at negligible startup cost. The
alternative — giving `packages/shared` its own build step and pointing
its `package.json` at a compiled `dist/` — would work too, but touches a
package consumed by both `apps/api` and `apps/web` and their test
suites, so it was deliberately left out of this change's scope.

## Health check

The API image's `HEALTHCHECK` calls `GET /api/v1/health`, which requires
no authentication and returns `{ success: true, data: { status: "ok", ... } }`
with HTTP 200 when the server is up.
