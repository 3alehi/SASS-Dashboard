import type { AuditLog, AuditLogListQuery } from '@nexora/shared';

import { supabaseAdmin } from '@/lib/supabase-admin.js';

interface AuditLogRow {
  id: string;
  organization_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
}

function unwrap<T>(relation: T | T[] | null): T | null {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

function toAuditLog(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    organizationId: row.organization_id,
    actorId: row.actor_id,
    actorName: unwrap(row.profiles)?.full_name ?? null,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata ?? {},
    ipAddress: row.ip_address,
    createdAt: row.created_at,
  };
}

const SELECT_COLUMNS = '*, profiles!audit_logs_actor_id_fkey(full_name)';

export interface PaginatedAuditLogs {
  items: AuditLog[];
  total: number;
}

export async function listAuditLogs(
  organizationId: string,
  query: AuditLogListQuery,
): Promise<PaginatedAuditLogs> {
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  let request = supabaseAdmin
    .from('audit_logs')
    .select(SELECT_COLUMNS, { count: 'exact' })
    .eq('organization_id', organizationId);

  if (query.entityType) {
    request = request.eq('entity_type', query.entityType);
  }
  if (query.action) {
    request = request.eq('action', query.action);
  }
  if (query.actorId) {
    request = request.eq('actor_id', query.actorId);
  }
  if (query.from) {
    request = request.gte('created_at', query.from);
  }
  if (query.to) {
    request = request.lte('created_at', query.to);
  }

  const { data, error, count } = await request
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to list audit logs: ${error.message}`);
  }

  return {
    items: (data ?? []).map((row) => toAuditLog(row as unknown as AuditLogRow)),
    total: count ?? 0,
  };
}
