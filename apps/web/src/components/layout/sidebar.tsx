import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { OrgSwitcher } from '@/components/layout/org-switcher';
import { UserMenu } from '@/components/layout/user-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePermissions } from '@/hooks/use-permissions';
import { NAV_SECTIONS } from '@/lib/nav-config';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';

export function Sidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const { hasPermission } = usePermissions();

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.permission || hasPermission(item.permission)),
  })).filter((section) => section.items.length > 0);

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
          <span className="text-sm font-bold">N</span>
        </div>
        {!collapsed && <span className="text-sm font-semibold tracking-tight">NEXORA</span>}
      </div>

      {!collapsed && (
        <div className="px-3 pt-3">
          <OrgSwitcher />
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {visibleSections.map((section) => (
          <div key={section.label} className="mb-4">
            {!collapsed && (
              <p className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavItemLink item={item} collapsed={collapsed} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <button
          type="button"
          onClick={toggleSidebar}
          className="mb-1 flex w-full items-center justify-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
          {!collapsed && 'Collapse'}
        </button>
        {!collapsed && <UserMenu />}
      </div>
    </aside>
  );
}

function NavItemLink({
  item,
  collapsed,
}: {
  item: (typeof NAV_SECTIONS)[number]['items'][number];
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const link = (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-sidebar-foreground hover:bg-sidebar-accent',
          collapsed && 'justify-center',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}
