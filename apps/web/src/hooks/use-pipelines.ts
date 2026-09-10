import { useQuery } from '@tanstack/react-query';

import { usePermissions } from '@/hooks/use-permissions';
import { fetchPipelines } from '@/services/pipelines-service';

export function usePipelines() {
  const organizationId = usePermissions().activeMembership?.organizationId;

  return useQuery({
    queryKey: ['pipelines', organizationId],
    queryFn: () => fetchPipelines(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 5 * 60 * 1000,
  });
}
