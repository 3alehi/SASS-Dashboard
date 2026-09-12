# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# apps/api Dockerfile
#
# Multi-stage build for the Fastify API.
#
# NOTE on packages/shared: it has no build step (its package.json points
# main/types directly at ./src/index.ts and is consumed as raw TypeScript,
# transpiled on the fly by tsx/vite/vitest in every context). Because of
# that, running the compiled API with plain `node dist/server.js` would
# crash with ERR_UNKNOWN_FILE_EXTENSION the moment it tries to resolve
# @nexora/shared. The runtime stage below therefore starts the app with
# `tsx` instead of `node`, which transparently handles the .ts import. tsx
# is a small, fast dependency (already used for local dev) so this has no
# real runtime cost. See docs/docker.md for more detail.
# ---------------------------------------------------------------------------

# ----- Stage 1: builder ----------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy manifests first for better layer caching.
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm ci

# Now copy the full source and build the API workspace.
# packages/shared has no build script (consumed as TS source, see note
# above), so only apps/api needs compiling here.
COPY tsconfig.json ./tsconfig.json
COPY tsconfig.base.json ./tsconfig.base.json
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN npm run build --workspace=apps/api

# ----- Stage 2: runtime ------------------------------------------------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Full node_modules from the builder stage (kept as-is, dev deps included,
# rather than pruned) because tsx — a devDependency of apps/api — is
# required at runtime to execute the @nexora/shared TS source; see the
# top-of-file note. Pruning dev deps and reinstalling just tsx afterwards
# would save some image size but adds a second network install for little
# benefit in this monorepo.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Compiled API output.
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# packages/shared is consumed as TypeScript source (no dist), so ship its
# source and package.json as-is.
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/src ./packages/shared/src

RUN addgroup -S nexora && adduser -S nexora -G nexora
USER nexora

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||4000)+'/api/v1/health').then(r=>{if(r.status!==200)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node_modules/.bin/tsx", "apps/api/dist/server.js"]
