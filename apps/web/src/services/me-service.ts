import type { Permission } from '@nexora/shared';

import { apiGet } from '@/services/api-client';

export interface OrganizationMembership {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: string;
  permissions: Permission[];
}

export interface MeResponse {
  id: string;
  email: string | null;
  organizations: OrganizationMembership[];
}

/**
 * Fetches the authenticated user's organization memberships and resolved
 * permissions from the API (GET /api/v1/me) — the same server-side RBAC
 * resolution the API itself uses for enforcement, so the frontend's
 * permission gates always reflect what the server will actually allow.
 */
export function fetchMe(): Promise<MeResponse> {
  return apiGet<MeResponse>('/me');
}
