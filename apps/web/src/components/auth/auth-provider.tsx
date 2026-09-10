import type { ReactNode } from 'react';

import { useAuthListener } from '@/hooks/use-auth-listener';

export function AuthProvider({ children }: { children: ReactNode }) {
  useAuthListener();
  return <>{children}</>;
}
