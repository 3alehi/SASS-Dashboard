import type {
  CreateDealInput,
  Deal,
  DealListQuery,
  PaginatedResult,
  PipelineSummary,
  UpdateDealInput,
} from '@nexora/shared';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/services/api-client';

function basePath(organizationId: string): string {
  return `/organizations/${organizationId}/deals`;
}

export function fetchDeals(
  organizationId: string,
  query: Partial<DealListQuery>,
): Promise<PaginatedResult<Deal>> {
  return apiGet<PaginatedResult<Deal>>(basePath(organizationId), {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    pipelineId: query.pipelineId,
    stageId: query.stageId,
    ownerId: query.ownerId,
    customerId: query.customerId,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
  });
}

export function fetchPipelineDeals(organizationId: string, pipelineId: string): Promise<Deal[]> {
  return apiGet<Deal[]>(`/organizations/${organizationId}/pipelines/${pipelineId}/deals`);
}

export function fetchPipelineSummary(
  organizationId: string,
  pipelineId: string,
): Promise<PipelineSummary> {
  return apiGet<PipelineSummary>(
    `/organizations/${organizationId}/pipelines/${pipelineId}/summary`,
  );
}

export function fetchDeal(organizationId: string, dealId: string): Promise<Deal> {
  return apiGet<Deal>(`${basePath(organizationId)}/${dealId}`);
}

export function createDeal(organizationId: string, input: CreateDealInput): Promise<Deal> {
  return apiPost<Deal>(basePath(organizationId), input);
}

export function updateDeal(
  organizationId: string,
  dealId: string,
  input: UpdateDealInput,
): Promise<Deal> {
  return apiPatch<Deal>(`${basePath(organizationId)}/${dealId}`, input);
}

export function moveDeal(organizationId: string, dealId: string, stageId: string): Promise<Deal> {
  return apiPost<Deal>(`${basePath(organizationId)}/${dealId}/move`, { stageId });
}

export function deleteDeal(organizationId: string, dealId: string): Promise<{ ok: true }> {
  return apiDelete<{ ok: true }>(`${basePath(organizationId)}/${dealId}`);
}
