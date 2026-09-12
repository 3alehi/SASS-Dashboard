import type {
  DashboardOverview,
  DashboardQuery,
  LeadConversionStage,
  RevenueSeries,
  SalesPerformanceEntry,
  StageValue,
  WonLostPoint,
} from '@nexora/shared';

import { apiGet } from '@/services/api-client';

function basePath(organizationId: string): string {
  return `/organizations/${organizationId}/dashboard`;
}

function toParams(query: DashboardQuery): Record<string, string | undefined> {
  return {
    preset: query.preset,
    from: query.from,
    to: query.to,
    compare: query.compare ? 'true' : undefined,
  };
}

export function fetchDashboardOverview(
  organizationId: string,
  query: DashboardQuery,
): Promise<DashboardOverview> {
  return apiGet<DashboardOverview>(`${basePath(organizationId)}/overview`, toParams(query));
}

export function fetchRevenueSeries(
  organizationId: string,
  query: DashboardQuery,
): Promise<RevenueSeries> {
  return apiGet<RevenueSeries>(`${basePath(organizationId)}/revenue`, toParams(query));
}

export function fetchPipelineByStage(organizationId: string): Promise<StageValue[]> {
  return apiGet<StageValue[]>(`${basePath(organizationId)}/pipeline-by-stage`);
}

export function fetchWonLostSeries(
  organizationId: string,
  query: DashboardQuery,
): Promise<WonLostPoint[]> {
  return apiGet<WonLostPoint[]>(`${basePath(organizationId)}/won-lost`, toParams(query));
}

export function fetchLeadConversionFunnel(
  organizationId: string,
  query: DashboardQuery,
): Promise<LeadConversionStage[]> {
  return apiGet<LeadConversionStage[]>(
    `${basePath(organizationId)}/lead-conversion`,
    toParams(query),
  );
}

export function fetchSalesPerformance(
  organizationId: string,
  query: DashboardQuery,
): Promise<SalesPerformanceEntry[]> {
  return apiGet<SalesPerformanceEntry[]>(
    `${basePath(organizationId)}/sales-performance`,
    toParams(query),
  );
}
