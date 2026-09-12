import type { RoleMatrix } from '@nexora/shared';

import { apiGet } from '@/services/api-client';

export function fetchRoleMatrix(organizationId: string): Promise<RoleMatrix> {
  return apiGet<RoleMatrix>(`/organizations/${organizationId}/roles`);
}
