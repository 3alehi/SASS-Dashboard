import type { InviteMemberInput, TeamMember, UpdateMemberRoleInput } from '@nexora/shared';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/services/api-client';

function basePath(organizationId: string): string {
  return `/organizations/${organizationId}/team`;
}

export function fetchTeamMembers(organizationId: string): Promise<TeamMember[]> {
  return apiGet<TeamMember[]>(basePath(organizationId));
}

export function inviteTeamMember(
  organizationId: string,
  input: InviteMemberInput,
): Promise<TeamMember> {
  return apiPost<TeamMember>(`${basePath(organizationId)}/invite`, input);
}

export function updateMemberRole(
  organizationId: string,
  memberId: string,
  input: UpdateMemberRoleInput,
): Promise<TeamMember> {
  return apiPatch<TeamMember>(`${basePath(organizationId)}/${memberId}/role`, input);
}

export function deactivateMember(organizationId: string, memberId: string): Promise<{ ok: true }> {
  return apiPost<{ ok: true }>(`${basePath(organizationId)}/${memberId}/deactivate`);
}

export function reactivateMember(organizationId: string, memberId: string): Promise<{ ok: true }> {
  return apiPost<{ ok: true }>(`${basePath(organizationId)}/${memberId}/reactivate`);
}

export function removeMember(organizationId: string, memberId: string): Promise<{ ok: true }> {
  return apiDelete<{ ok: true }>(`${basePath(organizationId)}/${memberId}`);
}
