import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { supabaseAdmin } from '@/lib/supabase-admin.js';
import { requirePermission } from '@/modules/rbac/require-permission.js';

const paramsSchema = z.object({ organizationId: z.string().uuid() });

const teamMemberSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  fullName: z.string().nullable(),
  email: z.string().nullable(),
  role: z.string(),
  status: z.string(),
  joinedAt: z.string().nullable(),
});

const teamResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(teamMemberSchema),
});

/**
 * GET /api/v1/organizations/:organizationId/team
 *
 * Demonstrates the RBAC enforcement pattern every future module route
 * follows: authenticate -> requirePermission(the specific permission this
 * action needs) -> handler. team.manage is required to view the roster so
 * this endpoint doubles as the reference implementation for Phase 11.
 */
export const teamRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/organizations/:organizationId/team',
    {
      preHandler: [app.authenticate, requirePermission('team.manage')],
      schema: {
        tags: ['team'],
        summary: 'List organization members',
        params: paramsSchema,
        response: { 200: teamResponseSchema },
      },
    },
    async (request) => {
      const { organizationId } = request.params as z.infer<typeof paramsSchema>;

      const { data, error } = await supabaseAdmin
        .from('organization_members')
        .select(
          'id, user_id, invited_email, status, joined_at, roles!inner(name), profiles(full_name)',
        )
        .eq('organization_id', organizationId);

      if (error || !data) {
        return { success: true, data: [] };
      }

      return {
        success: true,
        data: data.map((row) => {
          const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

          return {
            id: row.id as string,
            userId: row.user_id as string | null,
            fullName: (profile as { full_name: string } | null)?.full_name ?? null,
            email: row.invited_email as string | null,
            role: (role as { name: string } | null)?.name ?? '',
            status: row.status as string,
            joinedAt: row.joined_at as string | null,
          };
        }),
      };
    },
  );
};
