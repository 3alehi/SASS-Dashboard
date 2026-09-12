import { roleMatrixSchema } from '@nexora/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { getRoleMatrix } from '@/modules/rbac/rbac.repository.js';
import { requirePermission } from '@/modules/rbac/require-permission.js';

const paramsSchema = z.object({ organizationId: z.string().uuid() });

const roleMatrixResponseSchema = z.object({ success: z.literal(true), data: roleMatrixSchema });

/**
 * Read-only reference view: roles and their permission grants are fixed
 * system data seeded in role_permissions (see
 * database/migrations/0002_tenancy_and_rbac.sql) and are not editable
 * through the API, so this module exposes only a GET.
 */
export const rbacRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/organizations/:organizationId/roles',
    {
      preHandler: [app.authenticate, requirePermission('settings.manage')],
      schema: {
        tags: ['rbac'],
        summary: 'List every system role and the permissions it grants',
        params: paramsSchema,
        response: { 200: roleMatrixResponseSchema },
      },
    },
    async () => {
      const data = await getRoleMatrix();
      return { success: true as const, data };
    },
  );
};
