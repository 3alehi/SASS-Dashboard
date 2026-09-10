import type { ReactNode } from 'react';

/**
 * Placeholder for the guest-only route guard (login/register/forgot-password).
 * Phase 4 replaces this with a real Supabase session check and redirect to /app/dashboard.
 */
export function GuestRoute({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
