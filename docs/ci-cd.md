# CI/CD

NEXORA uses GitHub Actions for continuous integration. There is no automated
deploy pipeline in this repo — deployment is handled by Vercel's own
git-integrated builds, triggered directly by pushes to `main`.

## Workflow: `.github/workflows/ci.yml`

**Triggers:**

- `push` to `main` or `develop`
- `pull_request` targeting `main` or `develop`

The workflow runs four independent jobs in parallel so a failure is
immediately attributable to a specific check:

| Job         | What it checks                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lint`      | ESLint across the whole repo (single flat config at the root)                                                                                                             |
| `typecheck` | `tsc --noEmit` / `tsc -b` for `packages/shared`, `apps/api`, `apps/web`                                                                                                   |
| `test`      | `vitest run` for `packages/shared`, `apps/api`, `apps/web`                                                                                                                |
| `build`     | Compiles `apps/api` (`tsc` + `tsc-alias`) and builds `apps/web` (`vite build`); typechecks `packages/shared` (it has no build step — it re-exports `.ts` source directly) |

Every job checks out the repo, sets up Node 20 (matching `.nvmrc`) with npm
caching enabled, and runs `npm ci` once at the repo root — this is a single
npm-workspaces project with one root `package-lock.json`, so there's no
per-workspace install step.

### No secrets required

- `apps/api` tests run fully offline. `apps/api/src/test/setup.ts` seeds
  fake-but-valid `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET` values via `??=` before the
  env schema in `apps/api/src/config/env.ts` is validated, so no real
  Supabase project or GitHub secret is needed to run `npm test` in CI.
- `apps/web`'s production build throws if `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY` are unset (see `apps/web/src/lib/supabase.ts`).
  The workflow sets syntactically-valid placeholder values
  (`https://ci-placeholder.supabase.co` / `ci-placeholder-key`) directly in
  the workflow YAML — these are not secrets, just enough to satisfy the
  build-time guard so CI can confirm the app builds. They are never used to
  reach a real Supabase project.

## Reproducing a CI step locally

Run these from the repo root, after `npm ci` (or `npm install`):

| CI step                     | Local command                                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Lint                        | `npm run lint`                                                                                                                      |
| Typecheck `packages/shared` | `npm run typecheck --workspace=packages/shared`                                                                                     |
| Typecheck `apps/api`        | `npm run typecheck --workspace=apps/api`                                                                                            |
| Typecheck `apps/web`        | `npm run typecheck --workspace=apps/web`                                                                                            |
| Test `packages/shared`      | `npm run test --workspace=packages/shared`                                                                                          |
| Test `apps/api`             | `npm run test --workspace=apps/api`                                                                                                 |
| Test `apps/web`             | `npm run test --workspace=apps/web`                                                                                                 |
| Build `apps/api`            | `npm run build --workspace=apps/api`                                                                                                |
| Build `apps/web`            | `VITE_SUPABASE_URL=https://ci-placeholder.supabase.co VITE_SUPABASE_ANON_KEY=ci-placeholder-key npm run build --workspace=apps/web` |

Or, equivalently, run everything at once with the root fan-out scripts:

```bash
npm run lint
npm run typecheck   # fans out to all workspaces via --workspaces --if-present
npm run test        # fans out to all workspaces via --workspaces --if-present
```

## Adding a new check

Add a new step (with a clear `name:`) to the relevant job in
`.github/workflows/ci.yml`, and add the matching command to the table above
so the local-repro instructions stay accurate.
