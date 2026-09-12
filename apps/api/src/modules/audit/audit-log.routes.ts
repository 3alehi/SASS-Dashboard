import { auditLogListQuerySchema, auditLogSchema } from '@nexora/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { listAuditLogs } from '@/modules/audit/audit-log.repository.js';
import { requirePermission } from '@/modules/rbac/require-permission.js';

const paramsSchema = z.object({ organizationId: z.string().uuid() });

const auditLogListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(auditLogSchema),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const auditLogRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/organizations/:organizationId/audit-logs',
    {
      preHandler: [app.authenticate, requirePermission('settings.manage')],
      schema: {
        tags: ['audit-logs'],
        summary: 'List the organization audit trail (paginated, filterable)',
        params: paramsSchema,
        querystring: auditLogListQuerySchema,
        response: { 200: auditLogListResponseSchema },
      },
    },
    async (request) => {
      const { organizationId } = request.params;
      const query = request.query;
      const { items, total } = await listAuditLogs(organizationId, query);

      return {
        success: true as const,
        data: {
          items,
          page: query.page,
          pageSize: query.pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
        },
      };
    },
  );
};
