import { NavLink, Outlet } from 'react-router-dom';

import { PageHeader } from '@/components/layout/page-header';
import { cn } from '@/lib/utils';

const SETTINGS_NAV = [
  { label: 'Profile', href: '/app/settings/profile' },
  { label: 'Organization', href: '/app/settings/organization' },
  { label: 'Team', href: '/app/settings/team' },
  { label: 'Roles & Permissions', href: '/app/settings/roles' },
  { label: 'Notifications', href: '/app/settings/notifications' },
  { label: 'Appearance', href: '/app/settings/appearance' },
  { label: 'Security', href: '/app/settings/security' },
];

export function SettingsLayout() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account and organization preferences."
      />
      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible">
          {SETTINGS_NAV.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
