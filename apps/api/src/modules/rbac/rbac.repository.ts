import type { RoleMatrix } from '@nexora/shared';

import { supabaseAdmin } from '@/lib/supabase-admin.js';

export interface OrganizationMembership {
  organizationId: string;
  roleId: number;
  roleName: string;
  status: 'ACTIVE' | 'INVITED' | 'DEACTIVATED';
}

/**
 * Resolves the caller's membership + role in an organization directly from
 * organization_members/roles, using the service-role client. This is the
 * server-side source of truth for "does this user belong to this org, and
 * with what role" — the API never trusts an organization_id or role sent by
 * the client for authorization decisions, only for addressing which record
 * to look up.
 */
export async function getMembership(
  userId: string,
  organizationId: string,
): Promise<OrganizationMembership | null> {
  const { data, error } = await supabaseAdmin
    .from('organization_members')
    .select('organization_id, role_id, status, roles!inner(name)')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const roleName = Array.isArray(data.roles)
    ? (data.roles[0]?.name as string)
    : ((data.roles as { name: string } | null)?.name ?? '');

  return {
    organizationId: data.organization_id as string,
    roleId: data.role_id as number,
    roleName,
    status: data.status as OrganizationMembership['status'],
  };
}

/**
 * Returns every permission key granted to the given role, via
 * role_permissions -> permissions. Used to build the permission set once per
 * request rather than issuing a has_permission() round trip per check.
 */
export async function getRolePermissions(roleId: number): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from('role_permissions')
    .select('permissions!inner(key)')
    .eq('role_id', roleId);

  if (error || !data) {
    return new Set();
  }

  const keys = data.map((row) => {
    const permission = Array.isArray(row.permissions)
      ? row.permissions[0]
      : (row.permissions as { key: string } | null);
    return permission?.key ?? '';
  });

  return new Set(keys.filter(Boolean));
}

/**
 * Returns the full role -> permissions matrix, straight from role_permissions
 * (the same table that backs has_permission() in Postgres). This is a
 * read-only reference view for the Settings > Roles & Permissions page —
 * roles and their grants are fixed system data, not editable through the
 * API, so there is no corresponding write endpoint.
 */
export async function getRoleMatrix(): Promise<RoleMatrix> {
  const { data: roles, error: rolesError } = await supabaseAdmin
    .from('roles')
    .select('id, name')
    .order('id', { ascending: true });

  if (rolesError || !roles) return [];

  const { data: grants, error: grantsError } = await supabaseAdmin
    .from('role_permissions')
    .select('role_id, permissions!inner(key)');

  if (grantsError || !grants) {
    return roles.map((role) => ({
      role: role.name as RoleMatrix[number]['role'],
      permissions: [],
    }));
  }

  const permissionsByRole = new Map<number, string[]>();
  for (const grant of grants) {
    const permission = Array.isArray(grant.permissions)
      ? grant.permissions[0]
      : (grant.permissions as { key: string } | null);
    if (!permission) continue;
    const list = permissionsByRole.get(grant.role_id as number) ?? [];
    list.push(permission.key);
    permissionsByRole.set(grant.role_id as number, list);
  }

  return roles.map((role) => ({
    role: role.name as RoleMatrix[number]['role'],
    permissions: (permissionsByRole.get(role.id as number) ??
      []) as RoleMatrix[number]['permissions'],
  }));
}
