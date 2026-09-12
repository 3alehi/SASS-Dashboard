import type { AuditLogListQuery } from '@nexora/shared';
import { useQuery } from '@tanstack/react-query';

import { usePermissions } from '@/hooks/use-permissions';
import { fetchAuditLogs } from '@/services/audit-log-service';

export function useAuditLogs(query: Partial<AuditLogListQuery>) {
  const organizationId = usePermissions().activeMembership?.organizationId;

  return useQuery({
    queryKey: ['audit-logs', organizationId, query],
    queryFn: () => fetchAuditLogs(organizationId!, query),
    enabled: Boolean(organizationId),
    placeholderData: (previousData) => previousData,
    staleTime: 15 * 1000,
  });
}
