import type { ReactNode } from 'react';

/**
 * Placeholder for the authenticated route guard.
 * Phase 4 replaces this with a real Supabase session check and redirect to /login.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
