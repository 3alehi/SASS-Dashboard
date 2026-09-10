import type { CreateDealInput, Deal, DealListQuery, UpdateDealInput } from '@nexora/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePermissions } from '@/hooks/use-permissions';
import {
  createDeal,
  deleteDeal,
  fetchDeal,
  fetchDeals,
  fetchPipelineDeals,
  fetchPipelineSummary,
  moveDeal,
  updateDeal,
} from '@/services/deals-service';

function useActiveOrganizationId(): string | undefined {
  return usePermissions().activeMembership?.organizationId;
}

export function useDeals(query: Partial<DealListQuery>) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['deals', organizationId, query],
    queryFn: () => fetchDeals(organizationId!, query),
    enabled: Boolean(organizationId),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}

export function usePipelineDeals(pipelineId: string | undefined) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['deals', organizationId, 'pipeline', pipelineId],
    queryFn: () => fetchPipelineDeals(organizationId!, pipelineId!),
    enabled: Boolean(organizationId) && Boolean(pipelineId),
    staleTime: 15 * 1000,
  });
}

export function usePipelineSummary(pipelineId: string | undefined) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['pipeline-summary', organizationId, pipelineId],
    queryFn: () => fetchPipelineSummary(organizationId!, pipelineId!),
    enabled: Boolean(organizationId) && Boolean(pipelineId),
    staleTime: 15 * 1000,
  });
}

export function useDeal(dealId: string | undefined) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['deals', organizationId, 'detail', dealId],
    queryFn: () => fetchDeal(organizationId!, dealId!),
    enabled: Boolean(organizationId) && Boolean(dealId),
  });
}

export function useCreateDeal() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDealInput) => createDeal(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-summary', organizationId] });
    },
  });
}

export function useUpdateDeal() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, input }: { dealId: string; input: UpdateDealInput }) =>
      updateDeal(organizationId!, dealId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals', organizationId] });
      queryClient.invalidateQueries({
        queryKey: ['deals', organizationId, 'detail', variables.dealId],
      });
      queryClient.invalidateQueries({ queryKey: ['pipeline-summary', organizationId] });
    },
  });
}

export function useDeleteDeal() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dealId: string) => deleteDeal(organizationId!, dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-summary', organizationId] });
    },
  });
}

interface MoveDealVariables {
  dealId: string;
  stageId: string;
  pipelineId: string;
}

/**
 * Optimistically moves a deal to a new stage in the cached Kanban list so
 * the drag feels instant, then confirms with the server. On failure, the
 * cache is rolled back to its pre-drag snapshot via the context returned
 * from onMutate — the board never gets left showing a card in a stage the
 * server rejected.
 */
export function useMoveDeal() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, stageId }: MoveDealVariables) =>
      moveDeal(organizationId!, dealId, stageId),
    onMutate: async ({ dealId, stageId, pipelineId }: MoveDealVariables) => {
      const queryKey = ['deals', organizationId, 'pipeline', pipelineId];
      await queryClient.cancelQueries({ queryKey });

      const previousDeals = queryClient.getQueryData<Deal[]>(queryKey);

      queryClient.setQueryData<Deal[]>(queryKey, (current) =>
        current?.map((deal) => (deal.id === dealId ? { ...deal, stageId } : deal)),
      );

      return { previousDeals, queryKey };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previousDeals);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['deals', organizationId, 'pipeline', variables.pipelineId],
      });
      queryClient.invalidateQueries({
        queryKey: ['pipeline-summary', organizationId, variables.pipelineId],
      });
    },
  });
}
