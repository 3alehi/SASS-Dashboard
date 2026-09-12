import { PERMISSIONS, type Permission } from '@nexora/shared';
import { Check, Minus } from 'lucide-react';
import { Fragment } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useRoleMatrix } from '@/hooks/use-role-matrix';
import { cn } from '@/lib/utils';

const RESOURCE_LABELS: Record<string, string> = {
  customers: 'Customers',
  leads: 'Leads',
  deals: 'Deals',
  tasks: 'Tasks',
  tickets: 'Tickets',
  reports: 'Reports',
  settings: 'Settings',
  team: 'Team',
  billing: 'Billing',
};

function groupPermissionsByResource(): Array<{ resource: string; permissions: Permission[] }> {
  const groups = new Map<string, Permission[]>();
  for (const permission of PERMISSIONS) {
    const resource = permission.split('.')[0] ?? permission;
    const list = groups.get(resource) ?? [];
    list.push(permission);
    groups.set(resource, list);
  }
  return Array.from(groups.entries()).map(([resource, permissions]) => ({ resource, permissions }));
}

const PERMISSION_GROUPS = groupPermissionsByResource();

export function RolesSettingsPage() {
  const { data: matrix, isLoading, isError, refetch } = useRoleMatrix();

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>
            Configure granular, role-based access control for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorState onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles & Permissions</CardTitle>
        <CardDescription>
          Every role and the permissions it grants. Roles are fixed system roles and cannot be
          renamed or have custom permissions added — this is a reference view.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !matrix ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Permission
                  </th>
                  {matrix.map((entry) => (
                    <th
                      key={entry.role}
                      className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {entry.role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_GROUPS.map((group) => (
                  <Fragment key={group.resource}>
                    <tr className="border-b border-border bg-muted/20">
                      <td
                        colSpan={matrix.length + 1}
                        className="px-4 py-1.5 text-xs font-semibold text-foreground"
                      >
                        {RESOURCE_LABELS[group.resource] ?? group.resource}
                      </td>
                    </tr>
                    {group.permissions.map((permission) => (
                      <tr key={permission} className="border-b border-border last:border-0">
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                          {permission}
                        </td>
                        {matrix.map((entry) => {
                          const granted = entry.permissions.includes(permission);
                          return (
                            <td key={entry.role} className="px-4 py-2 text-center">
                              {granted ? (
                                <Check className={cn('mx-auto h-4 w-4 text-success')} />
                              ) : (
                                <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
