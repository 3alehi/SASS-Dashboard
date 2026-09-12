import type { AuditLog, AuditLogListQuery, PaginatedResult } from '@nexora/shared';

import { apiGet } from '@/services/api-client';

export function fetchAuditLogs(
  organizationId: string,
  query: Partial<AuditLogListQuery>,
): Promise<PaginatedResult<AuditLog>> {
  return apiGet<PaginatedResult<AuditLog>>(`/organizations/${organizationId}/audit-logs`, {
    page: query.page,
    pageSize: query.pageSize,
    entityType: query.entityType,
    action: query.action,
    actorId: query.actorId,
    from: query.from,
    to: query.to,
  });
}
