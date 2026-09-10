import { BarChart3, Building2, Handshake, KanbanSquare, LayoutDashboard } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { cn } from '@/lib/utils';

const BOTTOM_NAV_ITEMS = [
  { label: 'Home', href: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Customers', href: '/app/customers', icon: Building2 },
  { label: 'Pipeline', href: '/app/pipeline', icon: KanbanSquare },
  { label: 'Deals', href: '/app/deals', icon: Handshake },
  { label: 'Reports', href: '/app/reports', icon: BarChart3 },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center border-t border-border bg-background/95 backdrop-blur md:hidden">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
