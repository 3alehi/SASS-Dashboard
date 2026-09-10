import type { InviteMemberInput, UpdateMemberRoleInput } from '@nexora/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePermissions } from '@/hooks/use-permissions';
import {
  deactivateMember,
  fetchTeamMembers,
  inviteTeamMember,
  reactivateMember,
  removeMember,
  updateMemberRole,
} from '@/services/team-service';

function useActiveOrganizationId(): string | undefined {
  return usePermissions().activeMembership?.organizationId;
}

export function useTeamMembers() {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['team', organizationId],
    queryFn: () => fetchTeamMembers(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 30 * 1000,
  });
}

export function useInviteTeamMember() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InviteMemberInput) => inviteTeamMember(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', organizationId] });
    },
  });
}

export function useUpdateMemberRole() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, input }: { memberId: string; input: UpdateMemberRoleInput }) =>
      updateMemberRole(organizationId!, memberId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', organizationId] });
    },
  });
}

export function useDeactivateMember() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => deactivateMember(organizationId!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', organizationId] });
    },
  });
}

export function useReactivateMember() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => reactivateMember(organizationId!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', organizationId] });
    },
  });
}

export function useRemoveMember() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => removeMember(organizationId!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', organizationId] });
    },
  });
}
