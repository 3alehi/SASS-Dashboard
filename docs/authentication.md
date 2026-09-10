# Authentication

> Full authentication flows (sign up, sign in, email verification, password reset, session
> handling, protected routes) are implemented in Phase 4. This document tracks the identity model
> established in Phase 3 that authentication builds on.

## Identity provider

NEXORA uses **Supabase Auth** for identity. The frontend talks to Supabase directly for
authentication (sign up, sign in, password reset, session refresh) via `@supabase/supabase-js`
([`apps/web/src/lib/supabase.ts`](../apps/web/src/lib/supabase.ts)); the API never issues its own
credentials or sessions.

## Profile bootstrap

Every `auth.users` row gets a matching `profiles` row automatically, via the
`handle_new_auth_user()` trigger (migration `0002`) — the application never has to remember to
create a profile after signup.

## Server-side verification

The Fastify API (Phase 4) verifies the Supabase-issued JWT on every authenticated request and
derives the user's identity (`auth.uid()`-equivalent) from it — the API never trusts a client-
supplied user id. Organization membership and role are then resolved from `organization_members`
for that verified user id, per request. See [authorization.md](./authorization.md) and
[security.md](./security.md).
