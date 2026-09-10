import type { AssignableRole, TeamMember } from '@nexora/shared';

import { supabaseAdmin } from '@/lib/supabase-admin.js';

interface MemberRow {
  id: string;
  organization_id: string;
  user_id: string | null;
  invited_email: string | null;
  status: TeamMember['status'];
  invited_at: string | null;
  joined_at: string | null;
  deactivated_at: string | null;
  created_at: string;
  roles: { name: TeamMember['role'] } | { name: TeamMember['role'] }[] | null;
  profiles: { full_name: string; id: string } | { full_name: string; id: string }[] | null;
}

function unwrap<T>(relation: T | T[] | null): T | null {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

async function getProfileEmail(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

async function toTeamMember(row: MemberRow): Promise<TeamMember> {
  const role = unwrap(row.roles);
  const profile = unwrap(row.profiles);
  const email = row.user_id ? await getProfileEmail(row.user_id) : row.invited_email;

  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    fullName: profile?.full_name ?? null,
    email,
    role: role?.name ?? 'MEMBER',
    status: row.status,
    invitedAt: row.invited_at,
    joinedAt: row.joined_at,
    deactivatedAt: row.deactivated_at,
    createdAt: row.created_at,
  };
}

const SELECT_COLUMNS = '*, roles!inner(name), profiles(id, full_name)';

export async function listMembers(organizationId: string): Promise<TeamMember[]> {
  const { data, error } = await supabaseAdmin
    .from('organization_members')
    .select(SELECT_COLUMNS)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return Promise.all((data as unknown as MemberRow[]).map(toTeamMember));
}

async function getRoleId(roleName: AssignableRole): Promise<number | null> {
  const { data } = await supabaseAdmin
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .maybeSingle();
  return (data?.id as number | undefined) ?? null;
}

export interface InviteResult {
  member: TeamMember | null;
  error: string | null;
}

/**
 * Invites a new team member by email via Supabase Auth's admin API (which
 * sends the actual invitation email through Supabase's configured mailer),
 * then records the pending membership. If a profile for that email already
 * exists (the invited user has signed up before, in another organization),
 * we link the membership to their existing user id instead of re-inviting.
 */
export async function inviteMember(
  organizationId: string,
  invitedBy: string,
  email: string,
  role: AssignableRole,
): Promise<InviteResult> {
  const roleId = await getRoleId(role);
  if (!roleId) {
    return { member: null, error: `Unknown role: ${role}` };
  }

  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );

  let userId: string | null = existingUser?.id ?? null;

  if (!userId) {
    const { data: invited, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (inviteError) {
      return { member: null, error: inviteError.message };
    }
    userId = invited.user?.id ?? null;
  }

  const { data, error } = await supabaseAdmin
    .from('organization_members')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      invited_email: userId ? null : email,
      role_id: roleId,
      status: 'INVITED',
      invited_by: invitedBy,
      invited_at: new Date().toISOString(),
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error || !data) {
    return { member: null, error: error?.message ?? 'Failed to create membership.' };
  }

  const member = await toTeamMember(data as unknown as MemberRow);
  return { member, error: null };
}

export async function updateMemberRole(
  organizationId: string,
  memberId: string,
  role: AssignableRole,
): Promise<TeamMember | null> {
  const roleId = await getRoleId(role);
  if (!roleId) return null;

  const { data, error } = await supabaseAdmin
    .from('organization_members')
    .update({ role_id: roleId })
    .eq('organization_id', organizationId)
    .eq('id', memberId)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error || !data) return null;
  return toTeamMember(data as unknown as MemberRow);
}

export async function deactivateMember(organizationId: string, memberId: string): Promise<boolean> {
  const { error, data } = await supabaseAdmin
    .from('organization_members')
    .update({ status: 'DEACTIVATED', deactivated_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('id', memberId)
    .select('id')
    .maybeSingle();

  return !error && Boolean(data);
}

export async function reactivateMember(organizationId: string, memberId: string): Promise<boolean> {
  const { error, data } = await supabaseAdmin
    .from('organization_members')
    .update({ status: 'ACTIVE', deactivated_at: null })
    .eq('organization_id', organizationId)
    .eq('id', memberId)
    .select('id')
    .maybeSingle();

  return !error && Boolean(data);
}

export async function removeMember(organizationId: string, memberId: string): Promise<boolean> {
  const { error, data } = await supabaseAdmin
    .from('organization_members')
    .delete()
    .eq('organization_id', organizationId)
    .eq('id', memberId)
    .select('id')
    .maybeSingle();

  return !error && Boolean(data);
}

/**
 * True if removing/demoting/deactivating this member would leave the
 * organization with zero ACTIVE owners. Called before any of those
 * operations on a member whose current role is OWNER, so the last owner can
 * never be locked out or orphan the organization — a subsequent ownership
 * transfer flow (not yet implemented) would be the supported way to change
 * who owns an org.
 */
export async function isLastActiveOwner(
  organizationId: string,
  memberId: string,
): Promise<boolean> {
  const { data: member } = await supabaseAdmin
    .from('organization_members')
    .select('status, roles!inner(name)')
    .eq('organization_id', organizationId)
    .eq('id', memberId)
    .maybeSingle();

  if (!member || member.status !== 'ACTIVE') return false;

  const role = unwrap(member.roles as { name: string } | { name: string }[] | null);
  if (role?.name !== 'OWNER') return false;

  const { count } = await supabaseAdmin
    .from('organization_members')
    .select('id, roles!inner(name)', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'ACTIVE')
    .eq('roles.name', 'OWNER');

  return (count ?? 0) <= 1;
}
