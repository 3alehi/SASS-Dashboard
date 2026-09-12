import type { DashboardQuery } from '@nexora/shared';
import { useQuery } from '@tanstack/react-query';

import { usePermissions } from '@/hooks/use-permissions';
import {
  fetchDashboardOverview,
  fetchLeadConversionFunnel,
  fetchPipelineByStage,
  fetchRevenueSeries,
  fetchSalesPerformance,
  fetchWonLostSeries,
} from '@/services/dashboard-service';

function useActiveOrganizationId(): string | undefined {
  return usePermissions().activeMembership?.organizationId;
}

export function useDashboardOverview(query: DashboardQuery) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['dashboard', organizationId, 'overview', query],
    queryFn: () => fetchDashboardOverview(organizationId!, query),
    enabled: Boolean(organizationId),
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
  });
}

export function useRevenueSeries(query: DashboardQuery) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['dashboard', organizationId, 'revenue', query],
    queryFn: () => fetchRevenueSeries(organizationId!, query),
    enabled: Boolean(organizationId),
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
  });
}

export function usePipelineByStage() {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['dashboard', organizationId, 'pipeline-by-stage'],
    queryFn: () => fetchPipelineByStage(organizationId!),
    enabled: Boolean(organizationId),
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
  });
}

export function useWonLostSeries(query: DashboardQuery) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['dashboard', organizationId, 'won-lost', query],
    queryFn: () => fetchWonLostSeries(organizationId!, query),
    enabled: Boolean(organizationId),
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
  });
}

export function useLeadConversionFunnel(query: DashboardQuery) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['dashboard', organizationId, 'lead-conversion', query],
    queryFn: () => fetchLeadConversionFunnel(organizationId!, query),
    enabled: Boolean(organizationId),
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
  });
}

export function useSalesPerformance(query: DashboardQuery) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['dashboard', organizationId, 'sales-performance', query],
    queryFn: () => fetchSalesPerformance(organizationId!, query),
    enabled: Boolean(organizationId),
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
  });
}
