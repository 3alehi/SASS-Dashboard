import type { CreateLeadInput, Lead, LeadListQuery, UpdateLeadInput } from '@nexora/shared';

import { supabaseAdmin } from '@/lib/supabase-admin.js';

interface LeadRow {
  id: string;
  organization_id: string;
  full_name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  value: number | null;
  owner_id: string | null;
  notes: string | null;
  converted_customer_id: string | null;
  converted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  lead_statuses: { name: string } | { name: string }[] | null;
  lead_sources: { name: string } | { name: string }[] | null;
}

function unwrapRelation<T extends { name: string }>(relation: T | T[] | null): string | null {
  const row = Array.isArray(relation) ? relation[0] : relation;
  return row?.name ?? null;
}

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    organizationId: row.organization_id,
    fullName: row.full_name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    status: (unwrapRelation(row.lead_statuses) ?? 'NEW') as Lead['status'],
    source: unwrapRelation(row.lead_sources),
    value: row.value === null ? null : Number(row.value),
    ownerId: row.owner_id,
    notes: row.notes,
    convertedCustomerId: row.converted_customer_id,
    convertedAt: row.converted_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

const SELECT_COLUMNS = '*, lead_statuses!inner(name), lead_sources(name)';

const SORT_COLUMN_MAP: Record<LeadListQuery['sortBy'], string> = {
  fullName: 'full_name',
  value: 'value',
  createdAt: 'created_at',
};

/**
 * No in-memory caching here on purpose: the API may run as multiple
 * serverless invocations with no shared memory (see docs/deployment.md), so
 * a process-local cache for lead_sources — which grows dynamically as users
 * type new source names — could silently serve stale or duplicate-creating
 * data on a different instance. lead_statuses is small and static, but is
 * looked up the same simple way for consistency and to avoid a second cache
 * invalidation story later.
 */
async function getStatusId(name: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('lead_statuses')
    .select('id')
    .eq('name', name)
    .single();

  if (error || !data) {
    throw new Error(`Unknown lead status: ${name}`);
  }
  return data.id as number;
}

async function getOrCreateSourceId(name: string): Promise<number | null> {
  if (!name) return null;

  // upsert on the unique `name` constraint avoids a lost-update race between
  // the "does it exist" check and the insert under concurrent requests.
  const { data, error } = await supabaseAdmin
    .from('lead_sources')
    .upsert({ name }, { onConflict: 'name', ignoreDuplicates: false })
    .select('id')
    .single();

  if (error || !data) return null;
  return data.id as number;
}

export interface PaginatedLeads {
  items: Lead[];
  total: number;
}

export async function listLeads(organizationId: string, query: LeadListQuery): Promise<PaginatedLeads> {
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  let request = supabaseAdmin
    .from('leads')
    .select(SELECT_COLUMNS, { count: 'exact' })
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (query.search) {
    request = request.or(
      `full_name.ilike.%${query.search}%,company.ilike.%${query.search}%,email.ilike.%${query.search}%`,
    );
  }
  if (query.status) {
    const statusId = await getStatusId(query.status);
    request = request.eq('status_id', statusId);
  }
  if (query.ownerId) {
    request = request.eq('owner_id', query.ownerId);
  }

  const { data, error, count } = await request
    .order(SORT_COLUMN_MAP[query.sortBy], { ascending: query.sortDir === 'asc' })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to list leads: ${error.message}`);
  }

  return {
    items: (data ?? []).map((row) => toLead(row as unknown as LeadRow)),
    total: count ?? 0,
  };
}

export async function getLeadById(organizationId: string, leadId: string): Promise<Lead | null> {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select(SELECT_COLUMNS)
    .eq('organization_id', organizationId)
    .eq('id', leadId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return null;
  return toLead(data as unknown as LeadRow);
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

export async function createLead(
  organizationId: string,
  createdBy: string,
  input: CreateLeadInput,
): Promise<Lead> {
  const normalized = normalizeOptionalStrings(input);
  const statusId = await getStatusId(normalized.status ?? 'NEW');
  const sourceId = normalized.source ? await getOrCreateSourceId(normalized.source) : null;

  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert({
      organization_id: organizationId,
      full_name: normalized.fullName,
      company: normalized.company ?? null,
      email: normalized.email ?? null,
      phone: normalized.phone ?? null,
      status_id: statusId,
      source_id: sourceId,
      value: normalized.value ?? null,
      owner_id: normalized.ownerId ?? null,
      notes: normalized.notes ?? null,
      created_by: createdBy,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(`Failed to create lead: ${error?.message}`);
  }

  return toLead(data as unknown as LeadRow);
}

export async function updateLead(
  organizationId: string,
  leadId: string,
  input: UpdateLeadInput,
): Promise<Lead | null> {
  const normalized = normalizeOptionalStrings(input);

  const patch: Record<string, unknown> = {};
  if (normalized.fullName !== undefined) patch.full_name = normalized.fullName;
  if (normalized.company !== undefined) patch.company = normalized.company ?? null;
  if (normalized.email !== undefined) patch.email = normalized.email ?? null;
  if (normalized.phone !== undefined) patch.phone = normalized.phone ?? null;
  if (normalized.status !== undefined) patch.status_id = await getStatusId(normalized.status);
  if (normalized.source !== undefined) {
    patch.source_id = normalized.source ? await getOrCreateSourceId(normalized.source) : null;
  }
  if (normalized.value !== undefined) patch.value = normalized.value ?? null;
  if (normalized.ownerId !== undefined) patch.owner_id = normalized.ownerId ?? null;
  if (normalized.notes !== undefined) patch.notes = normalized.notes ?? null;

  const { data, error } = await supabaseAdmin
    .from('leads')
    .update(patch)
    .eq('organization_id', organizationId)
    .eq('id', leadId)
    .is('deleted_at', null)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error || !data) return null;
  return toLead(data as unknown as LeadRow);
}

export async function softDeleteLead(organizationId: string, leadId: string): Promise<boolean> {
  const { error, data } = await supabaseAdmin
    .from('leads')
    .update({ deleted_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('id', leadId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  return !error && Boolean(data);
}
