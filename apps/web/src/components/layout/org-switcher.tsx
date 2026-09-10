import { Check, ChevronsUpDown, Plus } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';

export function OrgSwitcher() {
  const { organizations, activeMembership, isLoading } = usePermissions();
  const setActiveOrganizationId = useUiStore((state) => state.setActiveOrganizationId);

  if (isLoading) {
    return <div className="h-11 animate-pulse rounded-md bg-sidebar-accent" />;
  }

  if (organizations.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-sidebar-border px-2.5 py-2 text-xs text-muted-foreground">
        No organizations yet
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar px-2.5 py-2 text-left',
            'transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
            {activeMembership?.organizationName.charAt(0)}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {activeMembership?.organizationName}
            </span>
            <span className="text-xs text-muted-foreground">{activeMembership?.role}</span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.organizationId}
            onSelect={() => setActiveOrganizationId(org.organizationId)}
            className="gap-2"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary text-[10px] font-semibold text-primary-foreground">
              {org.organizationName.charAt(0)}
            </div>
            <span className="flex-1 truncate">{org.organizationName}</span>
            {org.organizationId === activeMembership?.organizationId && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2">
          <Plus className="h-4 w-4" />
          Create organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
