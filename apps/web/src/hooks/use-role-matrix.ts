import { useQuery } from '@tanstack/react-query';

import { usePermissions } from '@/hooks/use-permissions';
import { fetchRoleMatrix } from '@/services/rbac-service';

export function useRoleMatrix() {
  const organizationId = usePermissions().activeMembership?.organizationId;

  return useQuery({
    queryKey: ['role-matrix', organizationId],
    queryFn: () => fetchRoleMatrix(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 5 * 60 * 1000,
  });
}
