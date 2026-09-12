import type {
  Organization,
  OrganizationSettings,
  UpdateOrganizationInput,
  UpdateOrganizationSettingsInput,
} from '@nexora/shared';

import { apiGet, apiPatch } from '@/services/api-client';

export function fetchOrganization(organizationId: string): Promise<Organization> {
  return apiGet<Organization>(`/organizations/${organizationId}`);
}

export function updateOrganization(
  organizationId: string,
  input: UpdateOrganizationInput,
): Promise<Organization> {
  return apiPatch<Organization>(`/organizations/${organizationId}`, input);
}

export function fetchOrganizationSettings(organizationId: string): Promise<OrganizationSettings> {
  return apiGet<OrganizationSettings>(`/organizations/${organizationId}/settings`);
}

export function updateOrganizationSettings(
  organizationId: string,
  input: UpdateOrganizationSettingsInput,
): Promise<OrganizationSettings> {
  return apiPatch<OrganizationSettings>(`/organizations/${organizationId}/settings`, input);
}
