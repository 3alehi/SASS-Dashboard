import type { Permission } from '@nexora/shared';

import { supabase } from '@/lib/supabase';

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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

/**
 * Fetches the authenticated user's organization memberships and resolved
 * permissions from the API (GET /api/v1/me) — the same server-side RBAC
 * resolution the API itself uses for enforcement, so the frontend's
 * permission gates always reflect what the server will actually allow.
 */
export async function fetchMe(): Promise<MeResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  const response = await fetch(`${API_BASE_URL}/me`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  if (!response.ok) {
    throw new Error('Failed to load account information.');
  }

  const body = await response.json();
  return body.data as MeResponse;
}
