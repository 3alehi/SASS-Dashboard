import type { Permission } from '@nexora/shared';
import type { ReactNode } from 'react';

import { usePermissions } from '@/hooks/use-permissions';

interface CanProps {
  permission?: Permission;
  anyOf?: Permission[];
  allOf?: Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Conditionally renders children based on the current user's permissions in
 * the active organization. UI-only affordance — hides actions the user
 * can't perform, but every mutation is still enforced server-side via
 * requirePermission() and Postgres RLS regardless of what this renders.
 */
export function Can({ permission, anyOf, allOf, fallback = null, children }: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let allowed = true;
  if (permission) allowed = allowed && hasPermission(permission);
  if (anyOf) allowed = allowed && hasAnyPermission(anyOf);
  if (allOf) allowed = allowed && hasAllPermissions(allOf);

  return <>{allowed ? children : fallback}</>;
}
