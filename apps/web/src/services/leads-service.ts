import type {
  ConvertLeadInput,
  ConvertLeadResult,
  CreateLeadInput,
  Lead,
  LeadListQuery,
  PaginatedResult,
  UpdateLeadInput,
} from '@nexora/shared';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/services/api-client';

function basePath(organizationId: string): string {
  return `/organizations/${organizationId}/leads`;
}

export function fetchLeads(
  organizationId: string,
  query: Partial<LeadListQuery>,
): Promise<PaginatedResult<Lead>> {
  return apiGet<PaginatedResult<Lead>>(basePath(organizationId), {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    status: query.status,
    ownerId: query.ownerId,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
  });
}

export function fetchLead(organizationId: string, leadId: string): Promise<Lead> {
  return apiGet<Lead>(`${basePath(organizationId)}/${leadId}`);
}

export function createLead(organizationId: string, input: CreateLeadInput): Promise<Lead> {
  return apiPost<Lead>(basePath(organizationId), input);
}

export function updateLead(
  organizationId: string,
  leadId: string,
  input: UpdateLeadInput,
): Promise<Lead> {
  return apiPatch<Lead>(`${basePath(organizationId)}/${leadId}`, input);
}

export function deleteLead(organizationId: string, leadId: string): Promise<{ ok: true }> {
  return apiDelete<{ ok: true }>(`${basePath(organizationId)}/${leadId}`);
}

export function convertLead(
  organizationId: string,
  leadId: string,
  input: ConvertLeadInput,
): Promise<ConvertLeadResult> {
  return apiPost<ConvertLeadResult>(`${basePath(organizationId)}/${leadId}/convert`, input);
}
