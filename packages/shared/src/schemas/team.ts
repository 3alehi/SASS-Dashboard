import { z } from 'zod';

import { ORGANIZATION_ROLES } from '../constants/roles.js';

export const MEMBER_STATUSES = ['ACTIVE', 'INVITED', 'DEACTIVATED'] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const teamMemberSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  fullName: z.string().nullable(),
  email: z.string().nullable(),
  role: z.enum(ORGANIZATION_ROLES),
  status: z.enum(MEMBER_STATUSES),
  invitedAt: z.string().nullable(),
  joinedAt: z.string().nullable(),
  deactivatedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type TeamMember = z.infer<typeof teamMemberSchema>;

/**
 * OWNER is deliberately excluded here — assigning it via invite or a role
 * change would let any team.manage holder mint a second owner (or overwrite
 * the existing one), which is a distinct, higher-stakes operation this API
 * does not expose yet. Only ADMIN and below are assignable through these
 * endpoints.
 */
export const ASSIGNABLE_ROLES = ['ADMIN', 'MANAGER', 'SALES', 'SUPPORT', 'MEMBER'] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  role: z.enum(ASSIGNABLE_ROLES).default('MEMBER'),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum(ASSIGNABLE_ROLES),
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
