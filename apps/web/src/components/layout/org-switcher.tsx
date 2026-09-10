import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Organization {
  id: string;
  name: string;
  plan: 'Free' | 'Pro' | 'Business';
}

const MOCK_ORGS: Organization[] = [{ id: 'org_1', name: 'Northwind Retail', plan: 'Pro' }];

export function OrgSwitcher() {
  const [activeOrgId, setActiveOrgId] = useState(MOCK_ORGS[0]?.id);
  const activeOrg = MOCK_ORGS.find((org) => org.id === activeOrgId) ?? MOCK_ORGS[0];

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
            {activeOrg?.name.charAt(0)}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {activeOrg?.name}
            </span>
            <span className="text-xs text-muted-foreground">{activeOrg?.plan} plan</span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {MOCK_ORGS.map((org) => (
          <DropdownMenuItem key={org.id} onSelect={() => setActiveOrgId(org.id)} className="gap-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary text-[10px] font-semibold text-primary-foreground">
              {org.name.charAt(0)}
            </div>
            <span className="flex-1 truncate">{org.name}</span>
            {org.id === activeOrgId && <Check className="h-4 w-4 text-primary" />}
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
