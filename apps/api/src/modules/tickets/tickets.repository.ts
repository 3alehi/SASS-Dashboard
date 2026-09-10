import type { CreateTicketInput, Ticket, TicketListQuery, UpdateTicketInput } from '@nexora/shared';

import { supabaseAdmin } from '@/lib/supabase-admin.js';

interface TicketRow {
  id: string;
  organization_id: string;
  ticket_number: number;
  title: string;
  description: string | null;
  customer_id: string | null;
  priority: Ticket['priority'];
  status: Ticket['status'];
  category: string | null;
  assigned_agent_id: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  customers: { name: string } | { name: string }[] | null;
  profiles: { full_name: string } | { full_name: string }[] | null;
}

function unwrap<T>(relation: T | T[] | null): T | null {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

function toTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    organizationId: row.organization_id,
    ticketNumber: Number(row.ticket_number),
    title: row.title,
    description: row.description,
    customerId: row.customer_id,
    customerName: unwrap(row.customers)?.name ?? null,
    priority: row.priority,
    status: row.status,
    category: row.category,
    assignedAgentId: row.assigned_agent_id,
    assignedAgentName: unwrap(row.profiles)?.full_name ?? null,
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

const SELECT_COLUMNS = '*, customers(name), profiles!tickets_assigned_agent_id_fkey(full_name)';

const SORT_COLUMN_MAP: Record<TicketListQuery['sortBy'], string> = {
  ticketNumber: 'ticket_number',
  title: 'title',
  priority: 'priority',
  createdAt: 'created_at',
};

function normalizeOptionalStrings<T extends Record<string, unknown>>(input: T): T {
  const result = { ...input };
  for (const key of Object.keys(result)) {
    if (result[key as keyof T] === '') {
      (result as Record<string, unknown>)[key] = null;
    }
  }
  return result;
}

export interface PaginatedTickets {
  items: Ticket[];
  total: number;
}

export async function listTickets(
  organizationId: string,
  query: TicketListQuery,
): Promise<PaginatedTickets> {
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  let request = supabaseAdmin
    .from('tickets')
    .select(SELECT_COLUMNS, { count: 'exact' })
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (query.search) {
    request = request.ilike('title', `%${query.search}%`);
  }
  if (query.status) {
    request = request.eq('status', query.status);
  }
  if (query.priority) {
    request = request.eq('priority', query.priority);
  }
  if (query.assignedAgentId) {
    request = request.eq('assigned_agent_id', query.assignedAgentId);
  }
  if (query.customerId) {
    request = request.eq('customer_id', query.customerId);
  }

  const { data, error, count } = await request
    .order(SORT_COLUMN_MAP[query.sortBy], { ascending: query.sortDir === 'asc' })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to list tickets: ${error.message}`);
  }

  return {
    items: (data ?? []).map((row) => toTicket(row as unknown as TicketRow)),
    total: count ?? 0,
  };
}

export async function getTicketById(
  organizationId: string,
  ticketId: string,
): Promise<Ticket | null> {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select(SELECT_COLUMNS)
    .eq('organization_id', organizationId)
    .eq('id', ticketId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return null;
  return toTicket(data as unknown as TicketRow);
}

export async function createTicket(
  organizationId: string,
  createdBy: string,
  input: CreateTicketInput,
): Promise<Ticket> {
  const normalized = normalizeOptionalStrings(input);

  const { data, error } = await supabaseAdmin
    .from('tickets')
    .insert({
      organization_id: organizationId,
      title: normalized.title,
      description: normalized.description ?? null,
      customer_id: normalized.customerId ?? null,
      priority: normalized.priority,
      status: normalized.status,
      category: normalized.category ?? null,
      assigned_agent_id: normalized.assignedAgentId ?? null,
      created_by: createdBy,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(`Failed to create ticket: ${error?.message}`);
  }

  return toTicket(data as unknown as TicketRow);
}

export async function updateTicket(
  organizationId: string,
  ticketId: string,
  input: UpdateTicketInput,
): Promise<Ticket | null> {
  const normalized = normalizeOptionalStrings(input);

  const patch: Record<string, unknown> = {};
  if (normalized.title !== undefined) patch.title = normalized.title;
  if (normalized.description !== undefined) patch.description = normalized.description ?? null;
  if (normalized.customerId !== undefined) patch.customer_id = normalized.customerId ?? null;
  if (normalized.priority !== undefined) patch.priority = normalized.priority;
  if (normalized.category !== undefined) patch.category = normalized.category ?? null;
  if (normalized.assignedAgentId !== undefined)
    patch.assigned_agent_id = normalized.assignedAgentId ?? null;

  if (normalized.status !== undefined) {
    patch.status = normalized.status;
    if (normalized.status === 'RESOLVED') {
      patch.resolved_at = new Date().toISOString();
    } else if (normalized.status === 'CLOSED') {
      patch.closed_at = new Date().toISOString();
    } else {
      patch.resolved_at = null;
      patch.closed_at = null;
    }
  }

  const { data, error } = await supabaseAdmin
    .from('tickets')
    .update(patch)
    .eq('organization_id', organizationId)
    .eq('id', ticketId)
    .is('deleted_at', null)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error || !data) return null;
  return toTicket(data as unknown as TicketRow);
}

export async function softDeleteTicket(organizationId: string, ticketId: string): Promise<boolean> {
  const { error, data } = await supabaseAdmin
    .from('tickets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('id', ticketId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  return !error && Boolean(data);
}
