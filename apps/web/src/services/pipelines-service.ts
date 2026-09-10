import type { Pipeline } from '@nexora/shared';

import { apiGet } from '@/services/api-client';

export function fetchPipelines(organizationId: string): Promise<Pipeline[]> {
  return apiGet<Pipeline[]>(`/organizations/${organizationId}/pipelines`);
}
