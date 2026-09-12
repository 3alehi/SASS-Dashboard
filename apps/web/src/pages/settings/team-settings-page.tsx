import { Navigate } from 'react-router-dom';

/**
 * Team membership already has a full, permission-gated page at /app/team
 * (Phase 11) — this settings sub-route redirects there instead of
 * duplicating that functionality.
 */
export function TeamSettingsPage() {
  return <Navigate to="/app/team" replace />;
}
