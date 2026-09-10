import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const healthResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    status: z.literal('ok'),
    timestamp: z.string(),
  }),
});

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        summary: 'Liveness check',
        response: { 200: healthResponseSchema },
      },
    },
    async () => ({
      success: true,
      data: { status: 'ok' as const, timestamp: new Date().toISOString() },
    }),
  );
};
