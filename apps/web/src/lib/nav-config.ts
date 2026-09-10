import type { Permission } from '@nexora/shared';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Building2,
  ClipboardList,
  Contact2,
  Handshake,
  KanbanSquare,
  LayoutDashboard,
  LifeBuoy,
  ScrollText,
  Settings,
  Target,
  Users,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** If set, this item is hidden unless the user holds this permission. */
  permission?: Permission;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'CRM',
    items: [
      { label: 'Customers', href: '/app/customers', icon: Building2 },
      { label: 'Leads', href: '/app/leads', icon: Target },
      { label: 'Deals', href: '/app/deals', icon: Handshake },
      { label: 'Pipeline', href: '/app/pipeline', icon: KanbanSquare },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Tasks', href: '/app/tasks', icon: ClipboardList },
      { label: 'Tickets', href: '/app/tickets', icon: LifeBuoy },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Reports', href: '/app/reports', icon: BarChart3, permission: 'reports.read' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { label: 'Team', href: '/app/team', icon: Users, permission: 'team.manage' },
      {
        label: 'Audit Logs',
        href: '/app/audit-logs',
        icon: ScrollText,
        permission: 'settings.manage',
      },
      { label: 'Settings', href: '/app/settings', icon: Settings },
    ],
  },
];

export const CONTACTS_NAV_ICON = Contact2;
