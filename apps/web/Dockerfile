# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# apps/web Dockerfile
#
# Multi-stage build: compile the Vite SPA, then serve the static output
# with nginx. Vite inlines VITE_* variables at BUILD time (they end up
# baked into the JS bundle), so they must be supplied as build args, not
# runtime environment variables.
# ---------------------------------------------------------------------------

# ----- Stage 1: builder ----------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm ci

COPY tsconfig.json ./tsconfig.json
COPY tsconfig.base.json ./tsconfig.base.json
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Vite build-time env vars — baked into the static bundle.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_BASE_URL
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
    VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build --workspace=apps/web

# ----- Stage 2: runtime ------------------------------------------------
FROM nginx:alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
