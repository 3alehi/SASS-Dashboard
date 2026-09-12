import { searchQuerySchema, searchResultSchema } from '@nexora/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { globalSearch } from '@/modules/search/search.repository.js';

const paramsSchema = z.object({ organizationId: z.string().uuid() });

const searchResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(searchResultSchema),
});

/**
 * No requirePermission() gate here beyond authentication: the global_search()
 * SQL function checks organization membership and, per entity type, the
 * matching .read permission itself — a caller without leads.read simply
 * never sees lead rows in the union, the same shape of enforcement as every
 * other module, just centralized in one function instead of one preHandler
 * per resource.
 */
export const searchRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/organizations/:organizationId/search',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['search'],
        summary: 'Search across customers, leads, deals, tasks, and tickets',
        params: paramsSchema,
        querystring: searchQuerySchema,
        response: { 200: searchResponseSchema },
      },
    },
    async (request) => {
      const { organizationId } = request.params;
      const { q, limit } = request.query;
      const data = await globalSearch(organizationId, q, limit);
      return { success: true as const, data };
    },
  );
};
