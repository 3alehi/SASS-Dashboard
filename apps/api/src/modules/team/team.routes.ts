import { inviteMemberSchema, teamMemberSchema, updateMemberRoleSchema } from '@nexora/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requirePermission } from '@/modules/rbac/require-permission.js';
import {
  deactivateMember,
  inviteMember,
  isLastActiveOwner,
  listMembers,
  reactivateMember,
  removeMember,
  updateMemberRole,
} from '@/modules/team/team.repository.js';

const paramsSchema = z.object({ organizationId: z.string().uuid() });
const memberParamsSchema = paramsSchema.extend({ memberId: z.string().uuid() });

const teamListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(teamMemberSchema),
});
const teamMemberResponseSchema = z.object({ success: z.literal(true), data: teamMemberSchema });
const okResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ ok: z.literal(true) }),
});
const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }),
});

export const teamRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/organizations/:organizationId/team',
    {
      preHandler: [app.authenticate, requirePermission('team.manage')],
      schema: {
        tags: ['team'],
        summary: 'List organization members',
        params: paramsSchema,
        response: { 200: teamListResponseSchema },
      },
    },
    async (request) => {
      const { organizationId } = request.params;
      const members = await listMembers(organizationId);
      return { success: true as const, data: members };
    },
  );

  app.post(
    '/organizations/:organizationId/team/invite',
    {
      preHandler: [app.authenticate, requirePermission('team.manage')],
      schema: {
        tags: ['team'],
        summary: 'Invite a new team member by email (sends a real invitation via Supabase Auth)',
        params: paramsSchema,
        body: inviteMemberSchema,
        response: { 201: teamMemberResponseSchema, 400: errorResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId } = request.params;
      const { email, role } = request.body;

      const { member, error } = await inviteMember(organizationId, request.user.id, email, role);

      if (!member) {
        return reply.code(400).send({
          success: false as const,
          error: { code: 'INVITE_FAILED', message: error ?? 'Could not invite member.' },
        });
      }

      return reply.code(201).send({ success: true as const, data: member });
    },
  );

  app.patch(
    '/organizations/:organizationId/team/:memberId/role',
    {
      preHandler: [app.authenticate, requirePermission('team.manage')],
      schema: {
        tags: ['team'],
        summary: "Change a member's role (OWNER is not assignable through this endpoint)",
        params: memberParamsSchema,
        body: updateMemberRoleSchema,
        response: {
          200: teamMemberResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { organizationId, memberId } = request.params;

      if (await isLastActiveOwner(organizationId, memberId)) {
        return reply.code(400).send({
          success: false as const,
          error: {
            code: 'LAST_OWNER',
            message: "This organization's only owner cannot be demoted.",
          },
        });
      }

      const member = await updateMemberRole(organizationId, memberId, request.body.role);

      if (!member) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Member not found.' },
        });
      }

      return { success: true as const, data: member };
    },
  );

  app.post(
    '/organizations/:organizationId/team/:memberId/deactivate',
    {
      preHandler: [app.authenticate, requirePermission('team.manage')],
      schema: {
        tags: ['team'],
        summary: 'Deactivate a team member (revokes access without deleting their history)',
        params: memberParamsSchema,
        response: { 200: okResponseSchema, 400: errorResponseSchema, 404: errorResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, memberId } = request.params;

      if (await isLastActiveOwner(organizationId, memberId)) {
        return reply.code(400).send({
          success: false as const,
          error: {
            code: 'LAST_OWNER',
            message: "This organization's only owner cannot be deactivated.",
          },
        });
      }

      const ok = await deactivateMember(organizationId, memberId);

      if (!ok) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Member not found.' },
        });
      }

      return { success: true as const, data: { ok: true as const } };
    },
  );

  app.post(
    '/organizations/:organizationId/team/:memberId/reactivate',
    {
      preHandler: [app.authenticate, requirePermission('team.manage')],
      schema: {
        tags: ['team'],
        summary: 'Reactivate a deactivated team member',
        params: memberParamsSchema,
        response: { 200: okResponseSchema, 404: errorResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, memberId } = request.params;
      const ok = await reactivateMember(organizationId, memberId);

      if (!ok) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Member not found.' },
        });
      }

      return { success: true as const, data: { ok: true as const } };
    },
  );

  app.delete(
    '/organizations/:organizationId/team/:memberId',
    {
      preHandler: [app.authenticate, requirePermission('team.manage')],
      schema: {
        tags: ['team'],
        summary: 'Remove a team member from the organization',
        params: memberParamsSchema,
        response: { 200: okResponseSchema, 400: errorResponseSchema, 404: errorResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, memberId } = request.params;

      if (await isLastActiveOwner(organizationId, memberId)) {
        return reply.code(400).send({
          success: false as const,
          error: {
            code: 'LAST_OWNER',
            message: "This organization's only owner cannot be removed.",
          },
        });
      }

      const ok = await removeMember(organizationId, memberId);

      if (!ok) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Member not found.' },
        });
      }

      return { success: true as const, data: { ok: true as const } };
    },
  );
};
