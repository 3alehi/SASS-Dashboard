import { useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePermissions } from '@/hooks/use-permissions';
import { searchOrganization } from '@/services/search-service';

/**
 * Debounces the raw query before it ever reaches the network — the command
 * palette calls this on every keystroke, and firing a request per keystroke
 * would spam the API and make the ranked result list flicker as
 * out-of-order responses land.
 */
export function useGlobalSearch(rawQuery: string) {
  const organizationId = usePermissions().activeMembership?.organizationId;
  const query = useDebouncedValue(rawQuery.trim(), 200);

  return useQuery({
    queryKey: ['global-search', organizationId, query],
    queryFn: () => searchOrganization(organizationId!, { q: query }),
    enabled: Boolean(organizationId) && query.length > 0,
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}
