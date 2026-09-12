import type {
  Organization,
  OrganizationSettings,
  UpdateOrganizationInput,
  UpdateOrganizationSettingsInput,
} from '@nexora/shared';

import { supabaseAdmin } from '@/lib/supabase-admin.js';

interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  industry: string | null;
  size: string | null;
  website: string | null;
  billing_email: string | null;
  created_at: string;
  updated_at: string;
}

function toOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    industry: row.industry,
    size: row.size,
    website: row.website,
    billingEmail: row.billing_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeOptionalStrings<T extends Record<string, unknown>>(input: T): T {
  const result = { ...input };
  for (const key of Object.keys(result)) {
    if (result[key as keyof T] === '') {
      (result as Record<string, unknown>)[key] = null;
    }
  }
  return result;
}

export async function getOrganizationById(organizationId: string): Promise<Organization | null> {
  const { data, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return null;
  return toOrganization(data as unknown as OrganizationRow);
}

export async function updateOrganization(
  organizationId: string,
  input: UpdateOrganizationInput,
): Promise<Organization | null> {
  const normalized = normalizeOptionalStrings(input);

  const patch: Record<string, unknown> = {};
  if (normalized.name !== undefined) patch.name = normalized.name;
  if (normalized.industry !== undefined) patch.industry = normalized.industry ?? null;
  if (normalized.size !== undefined) patch.size = normalized.size ?? null;
  if (normalized.website !== undefined) patch.website = normalized.website ?? null;
  if (normalized.billingEmail !== undefined) patch.billing_email = normalized.billingEmail ?? null;
  if (normalized.logoUrl !== undefined) patch.logo_url = normalized.logoUrl ?? null;

  const { data, error } = await supabaseAdmin
    .from('organizations')
    .update(patch)
    .eq('id', organizationId)
    .is('deleted_at', null)
    .select('*')
    .maybeSingle();

  if (error || !data) return null;
  return toOrganization(data as unknown as OrganizationRow);
}

interface OrganizationSettingsRow {
  organization_id: string;
  default_currency: string;
  fiscal_year_start: number;
  date_format: string;
}

function toOrganizationSettings(row: OrganizationSettingsRow): OrganizationSettings {
  return {
    organizationId: row.organization_id,
    defaultCurrency: row.default_currency,
    fiscalYearStart: row.fiscal_year_start,
    dateFormat: row.date_format as OrganizationSettings['dateFormat'],
  };
}

export async function getOrganizationSettings(
  organizationId: string,
): Promise<OrganizationSettings | null> {
  const { data, error } = await supabaseAdmin
    .from('organization_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error || !data) return null;
  return toOrganizationSettings(data as unknown as OrganizationSettingsRow);
}

export async function updateOrganizationSettings(
  organizationId: string,
  input: UpdateOrganizationSettingsInput,
): Promise<OrganizationSettings | null> {
  const patch: Record<string, unknown> = {};
  if (input.defaultCurrency !== undefined) patch.default_currency = input.defaultCurrency;
  if (input.fiscalYearStart !== undefined) patch.fiscal_year_start = input.fiscalYearStart;
  if (input.dateFormat !== undefined) patch.date_format = input.dateFormat;

  const { data, error } = await supabaseAdmin
    .from('organization_settings')
    .upsert({ organization_id: organizationId, ...patch }, { onConflict: 'organization_id' })
    .select('*')
    .maybeSingle();

  if (error || !data) return null;
  return toOrganizationSettings(data as unknown as OrganizationSettingsRow);
}
