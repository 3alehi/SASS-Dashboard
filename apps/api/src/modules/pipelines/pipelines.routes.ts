import { pipelineSchema } from '@nexora/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { listPipelines } from '@/modules/pipelines/pipelines.repository.js';
import { requirePermission } from '@/modules/rbac/require-permission.js';

const paramsSchema = z.object({ organizationId: z.string().uuid() });
const pipelineListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(pipelineSchema),
});

export const pipelinesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/organizations/:organizationId/pipelines',
    {
      preHandler: [app.authenticate, requirePermission('deals.read')],
      schema: {
        tags: ['pipelines'],
        summary: 'List pipelines with their stages',
        params: paramsSchema,
        response: { 200: pipelineListResponseSchema },
      },
    },
    async (request) => {
      const { organizationId } = request.params;
      const pipelines = await listPipelines(organizationId);
      return { success: true as const, data: pipelines };
    },
  );
};
