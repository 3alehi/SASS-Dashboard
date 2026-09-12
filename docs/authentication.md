# Authentication

NEXORA uses **Supabase Auth** for identity. The frontend talks to Supabase directly for
authentication via `@supabase/supabase-js`
([`apps/web/src/lib/supabase.ts`](../apps/web/src/lib/supabase.ts)); the API never issues its own
credentials or sessions — it only verifies the Supabase-issued JWT on incoming requests, via the
`authenticate` plugin described below.

## Implemented flows

| Flow                | Route                                               | Notes                                                                                                                                                                                                                                                                                           |
| ------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sign up             | `/register`                                         | Creates the `auth.users` row; Supabase sends a confirmation email. A matching `profiles` row is created automatically via the `handle_new_auth_user()` trigger (migration `0002`).                                                                                                              |
| Email verification  | link in the confirmation email → `/auth/callback`   | Supabase parses the session from the URL fragment automatically (`detectSessionInUrl`); the callback page just waits for the session and redirects. Users can resend the email from Settings → Profile.                                                                                         |
| Sign in             | `/login`                                            | Redirects back to the page the user was trying to reach (`location.state.from`), or `/app/dashboard`.                                                                                                                                                                                           |
| Sign out            | user menu                                           | Clears the Supabase session; the auth listener propagates this to `useAuthStore` immediately.                                                                                                                                                                                                   |
| Forgot password     | `/forgot-password` → email link → `/reset-password` | Always shows a generic "check your email" message, whether or not the address exists, to avoid leaking account existence.                                                                                                                                                                       |
| Change password     | Settings → Security                                 | Re-authenticates with the current password via `signInWithPassword` before calling `updateUser()` — Supabase's `updateUser()` does not verify the old password on its own, so this check is done explicitly in [`auth-service.ts`](../apps/web/src/services/auth-service.ts).                   |
| Profile management  | Settings → Profile                                  | Updates `full_name`/`phone` in the user's `auth.users` metadata.                                                                                                                                                                                                                                |
| Session persistence | app-wide                                            | `persistSession` + `autoRefreshToken` are enabled on the Supabase client; `useAuthListener` subscribes once at the app root and keeps `useAuthStore` in sync across tabs and token refreshes.                                                                                                   |
| Route protection    | `ProtectedRoute` / `GuestRoute`                     | Redirect unauthenticated users away from `/app/*` to `/login`, and authenticated users away from `/login`/`/register`/`/forgot-password` to `/app/dashboard`. Both show a loading screen until the initial session check resolves, so a logged-in user never flashes the login page on refresh. |

## Validation

Every auth form uses React Hook Form + a Zod schema from
[`schemas/auth.ts`](../apps/web/src/schemas/auth.ts): `loginSchema`, `registerSchema`,
`forgotPasswordSchema`, `resetPasswordSchema`, `changePasswordSchema`, `updateProfileSchema`.
Passwords require 8+ characters with at least one uppercase letter, one lowercase letter, and one
number. This is a UX convenience only — the real boundary is Supabase Auth's own password rules
plus the server-side checks below, not the frontend schema.

## Server-side verification

The Fastify API verifies the Supabase-issued JWT on every authenticated request
([`plugins/authenticate.ts`](../apps/api/src/plugins/authenticate.ts)) and derives the user's
identity from it — the API never trusts a client-supplied user id. Organization membership and
role are then resolved from `organization_members` for that verified user id, per request. See
[authorization.md](./authorization.md) and [security.md](./security.md).
