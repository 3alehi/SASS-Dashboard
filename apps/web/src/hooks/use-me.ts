import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { fetchMe } from '@/services/me-service';

export function useMe() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
