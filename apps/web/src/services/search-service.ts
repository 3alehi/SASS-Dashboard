import type { SearchQuery, SearchResult } from '@nexora/shared';

import { apiGet } from '@/services/api-client';

export function searchOrganization(
  organizationId: string,
  query: Partial<SearchQuery>,
): Promise<SearchResult[]> {
  return apiGet<SearchResult[]>(`/organizations/${organizationId}/search`, {
    q: query.q,
    limit: query.limit,
  });
}
