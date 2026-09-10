export const PERMISSIONS = [
  'customers.read',
  'customers.create',
  'customers.update',
  'customers.delete',

  'leads.read',
  'leads.create',
  'leads.update',
  'leads.delete',

  'deals.read',
  'deals.create',
  'deals.update',
  'deals.delete',

  'tasks.read',
  'tasks.create',
  'tasks.update',
  'tasks.delete',

  'tickets.read',
  'tickets.create',
  'tickets.update',
  'tickets.delete',

  'reports.read',

  'settings.manage',
  'team.manage',
  'billing.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];
