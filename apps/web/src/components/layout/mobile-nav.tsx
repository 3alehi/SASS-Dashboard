import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { OrgSwitcher } from '@/components/layout/org-switcher';
import { UserMenu } from '@/components/layout/user-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { NAV_SECTIONS } from '@/lib/nav-config';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';

export function MobileNav() {
  const open = useUiStore((state) => state.mobileNavOpen);
  const setOpen = useUiStore((state) => state.setMobileNavOpen);
  const { hasPermission } = usePermissions();

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.permission || hasPermission(item.permission)),
  })).filter((section) => section.items.length > 0);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] md:hidden" />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar md:hidden',
          )}
        >
          <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
                <span className="text-sm font-bold">N</span>
              </div>
              <span className="text-sm font-semibold tracking-tight">NEXORA</span>
            </div>
            <DialogPrimitive.Close className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="px-3 pt-3">
            <OrgSwitcher />
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-4">
            {visibleSections.map((section) => (
              <div key={section.label} className="mb-4">
                <p className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <NavLink
                          to={item.href}
                          onClick={() => setOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                              isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent',
                            )
                          }
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-2">
            <UserMenu />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
