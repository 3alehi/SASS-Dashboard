import type { Permission } from '@nexora/shared';
import { useEffect, useMemo } from 'react';

import { useMe } from '@/hooks/use-me';
import { useUiStore } from '@/stores/ui-store';

/**
 * Resolves the current user's role and permission set for the active
 * organization, from data fetched via GET /api/v1/me (the same source of
 * truth the API uses for its own enforcement). This hook drives UI-only
 * affordances — hiding/disabling actions the user can't perform — and must
 * never be treated as a security boundary: every mutating request is also
 * checked server-side (requirePermission) and by Postgres RLS.
 */
export function usePermissions() {
  const { data, isLoading } = useMe();
  const activeOrganizationId = useUiStore((state) => state.activeOrganizationId);
  const setActiveOrganizationId = useUiStore((state) => state.setActiveOrganizationId);

  const organizations = useMemo(() => data?.organizations ?? [], [data]);

  // Keep the persisted active org valid: fall back to the first membership
  // if none is set yet, or if the previously active org is no longer one
  // the user belongs to.
  useEffect(() => {
    if (organizations.length === 0) return;
    const stillValid = organizations.some((org) => org.organizationId === activeOrganizationId);
    if (!stillValid) {
      setActiveOrganizationId(organizations[0]?.organizationId ?? null);
    }
  }, [organizations, activeOrganizationId, setActiveOrganizationId]);

  const activeMembership = useMemo(
    () =>
      organizations.find((org) => org.organizationId === activeOrganizationId) ?? organizations[0],
    [organizations, activeOrganizationId],
  );

  const permissionSet = useMemo(
    () => new Set(activeMembership?.permissions ?? []),
    [activeMembership],
  );

  function hasPermission(permission: Permission): boolean {
    return permissionSet.has(permission);
  }

  function hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some((permission) => permissionSet.has(permission));
  }

  function hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every((permission) => permissionSet.has(permission));
  }

  return {
    isLoading,
    organizations,
    activeMembership,
    role: activeMembership?.role,
    permissions: activeMembership?.permissions ?? [],
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
