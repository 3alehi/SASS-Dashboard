import type {
  ConvertLeadInput,
  CreateLeadInput,
  LeadListQuery,
  UpdateLeadInput,
} from '@nexora/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePermissions } from '@/hooks/use-permissions';
import {
  convertLead,
  createLead,
  deleteLead,
  fetchLead,
  fetchLeads,
  updateLead,
} from '@/services/leads-service';

function useActiveOrganizationId(): string | undefined {
  return usePermissions().activeMembership?.organizationId;
}

export function useLeads(query: Partial<LeadListQuery>) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['leads', organizationId, query],
    queryFn: () => fetchLeads(organizationId!, query),
    enabled: Boolean(organizationId),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}

export function useLead(leadId: string | undefined) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['leads', organizationId, 'detail', leadId],
    queryFn: () => fetchLead(organizationId!, leadId!),
    enabled: Boolean(organizationId) && Boolean(leadId),
  });
}

export function useCreateLead() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLeadInput) => createLead(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', organizationId] });
    },
  });
}

export function useUpdateLead() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, input }: { leadId: string; input: UpdateLeadInput }) =>
      updateLead(organizationId!, leadId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads', organizationId] });
      queryClient.invalidateQueries({
        queryKey: ['leads', organizationId, 'detail', variables.leadId],
      });
    },
  });
}

export function useDeleteLead() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leadId: string) => deleteLead(organizationId!, leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', organizationId] });
    },
  });
}

export function useConvertLead() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, input }: { leadId: string; input: ConvertLeadInput }) =>
      convertLead(organizationId!, leadId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads', organizationId] });
      queryClient.invalidateQueries({
        queryKey: ['leads', organizationId, 'detail', variables.leadId],
      });
      queryClient.invalidateQueries({ queryKey: ['customers', organizationId] });
    },
  });
}
