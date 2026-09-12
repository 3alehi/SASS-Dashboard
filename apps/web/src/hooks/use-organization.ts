import type { UpdateOrganizationInput, UpdateOrganizationSettingsInput } from '@nexora/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePermissions } from '@/hooks/use-permissions';
import {
  fetchOrganization,
  fetchOrganizationSettings,
  updateOrganization,
  updateOrganizationSettings,
} from '@/services/organization-service';

function useActiveOrganizationId(): string | undefined {
  return usePermissions().activeMembership?.organizationId;
}

export function useOrganization() {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['organization', organizationId],
    queryFn: () => fetchOrganization(organizationId!),
    enabled: Boolean(organizationId),
  });
}

export function useUpdateOrganization() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) => updateOrganization(organizationId!, input),
    onSuccess: (data) => {
      queryClient.setQueryData(['organization', organizationId], data);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useOrganizationSettings() {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['organization-settings', organizationId],
    queryFn: () => fetchOrganizationSettings(organizationId!),
    enabled: Boolean(organizationId),
  });
}

export function useUpdateOrganizationSettings() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrganizationSettingsInput) =>
      updateOrganizationSettings(organizationId!, input),
    onSuccess: (data) => {
      queryClient.setQueryData(['organization-settings', organizationId], data);
    },
  });
}
