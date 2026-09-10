import type { Permission } from '@nexora/shared';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { AuthLoadingScreen } from '@/components/auth/auth-loading-screen';
import { usePermissions } from '@/hooks/use-permissions';

interface PermissionRouteProps {
  permission: Permission;
  children: ReactNode;
}

export function PermissionRoute({ permission, children }: PermissionRouteProps) {
  const { isLoading, hasPermission } = usePermissions();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
