export const ORGANIZATION_ROLES = [
  'OWNER',
  'ADMIN',
  'MANAGER',
  'SALES',
  'SUPPORT',
  'MEMBER',
] as const;

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];
