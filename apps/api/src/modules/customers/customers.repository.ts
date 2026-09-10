import type {
  CreateCustomerInput,
  Customer,
  CustomerListQuery,
  UpdateCustomerInput,
} from '@nexora/shared';

import { supabaseAdmin } from '@/lib/supabase-admin.js';

interface CustomerRow {
  id: string;
  organization_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  status: Customer['status'];
  source: string | null;
  industry: string | null;
  value: number;
  owner_id: string | null;
  notes: string | null;
  last_activity_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    website: row.website,
    status: row.status,
    source: row.source,
    industry: row.industry,
    value: Number(row.value),
    ownerId: row.owner_id,
    notes: row.notes,
    lastActivityAt: row.last_activity_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

const SORT_COLUMN_MAP: Record<CustomerListQuery['sortBy'], string> = {
  name: 'name',
  company: 'company',
  value: 'value',
  createdAt: 'created_at',
  lastActivityAt: 'last_activity_at',
};

export interface PaginatedCustomers {
  items: Customer[];
  total: number;
}

export async function listCustomers(
  organizationId: string,
  query: CustomerListQuery,
): Promise<PaginatedCustomers> {
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  let request = supabaseAdmin
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (query.search) {
    request = request.or(
      `name.ilike.%${query.search}%,company.ilike.%${query.search}%,email.ilike.%${query.search}%`,
    );
  }
  if (query.status) {
    request = request.eq('status', query.status);
  }
  if (query.ownerId) {
    request = request.eq('owner_id', query.ownerId);
  }

  const { data, error, count } = await request
    .order(SORT_COLUMN_MAP[query.sortBy], { ascending: query.sortDir === 'asc' })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to list customers: ${error.message}`);
  }

  return {
    items: (data ?? []).map((row) => toCustomer(row as CustomerRow)),
    total: count ?? 0,
  };
}

export async function getCustomerById(
  organizationId: string,
  customerId: string,
): Promise<Customer | null> {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('id', customerId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return null;
  return toCustomer(data as CustomerRow);
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

export async function createCustomer(
  organizationId: string,
  createdBy: string,
  input: CreateCustomerInput,
): Promise<Customer> {
  const normalized = normalizeOptionalStrings(input);

  const { data, error } = await supabaseAdmin
    .from('customers')
    .insert({
      organization_id: organizationId,
      name: normalized.name,
      company: normalized.company ?? null,
      email: normalized.email ?? null,
      phone: normalized.phone ?? null,
      website: normalized.website ?? null,
      status: normalized.status,
      source: normalized.source ?? null,
      industry: normalized.industry ?? null,
      value: normalized.value,
      owner_id: normalized.ownerId ?? null,
      notes: normalized.notes ?? null,
      created_by: createdBy,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create customer: ${error?.message}`);
  }

  return toCustomer(data as CustomerRow);
}

export async function updateCustomer(
  organizationId: string,
  customerId: string,
  input: UpdateCustomerInput,
): Promise<Customer | null> {
  const normalized = normalizeOptionalStrings(input);

  const patch: Record<string, unknown> = {};
  if (normalized.name !== undefined) patch.name = normalized.name;
  if (normalized.company !== undefined) patch.company = normalized.company ?? null;
  if (normalized.email !== undefined) patch.email = normalized.email ?? null;
  if (normalized.phone !== undefined) patch.phone = normalized.phone ?? null;
  if (normalized.website !== undefined) patch.website = normalized.website ?? null;
  if (normalized.status !== undefined) patch.status = normalized.status;
  if (normalized.source !== undefined) patch.source = normalized.source ?? null;
  if (normalized.industry !== undefined) patch.industry = normalized.industry ?? null;
  if (normalized.value !== undefined) patch.value = normalized.value;
  if (normalized.ownerId !== undefined) patch.owner_id = normalized.ownerId ?? null;
  if (normalized.notes !== undefined) patch.notes = normalized.notes ?? null;

  const { data, error } = await supabaseAdmin
    .from('customers')
    .update(patch)
    .eq('organization_id', organizationId)
    .eq('id', customerId)
    .is('deleted_at', null)
    .select('*')
    .maybeSingle();

  if (error || !data) return null;
  return toCustomer(data as CustomerRow);
}

export async function softDeleteCustomer(
  organizationId: string,
  customerId: string,
): Promise<boolean> {
  const { error, data } = await supabaseAdmin
    .from('customers')
    .update({ deleted_at: new Date().toISOString(), status: 'ARCHIVED' })
    .eq('organization_id', organizationId)
    .eq('id', customerId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  return !error && Boolean(data);
}

export async function restoreCustomer(
  organizationId: string,
  customerId: string,
): Promise<boolean> {
  const { error, data } = await supabaseAdmin
    .from('customers')
    .update({ deleted_at: null, status: 'ACTIVE' })
    .eq('organization_id', organizationId)
    .eq('id', customerId)
    .not('deleted_at', 'is', null)
    .select('id')
    .maybeSingle();

  return !error && Boolean(data);
}
