import {
  createDealSchema,
  dealListQuerySchema,
  dealSchema,
  moveDealSchema,
  pipelineSummarySchema,
  updateDealSchema,
} from '@nexora/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  createDeal,
  getDealById,
  getPipelineSummary,
  listDeals,
  listDealsForPipeline,
  moveDealToStage,
  softDeleteDeal,
  updateDeal,
} from '@/modules/deals/deals.repository.js';
import { requirePermission } from '@/modules/rbac/require-permission.js';

const paramsSchema = z.object({ organizationId: z.string().uuid() });
const dealParamsSchema = paramsSchema.extend({ dealId: z.string().uuid() });
const pipelineParamsSchema = paramsSchema.extend({ pipelineId: z.string().uuid() });

const dealResponseSchema = z.object({ success: z.literal(true), data: dealSchema });
const dealListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(dealSchema),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
const dealArrayResponseSchema = z.object({ success: z.literal(true), data: z.array(dealSchema) });
const summaryResponseSchema = z.object({ success: z.literal(true), data: pipelineSummarySchema });
const okResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ ok: z.literal(true) }),
});
const notFoundResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }),
});

export const dealsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/organizations/:organizationId/deals',
    {
      preHandler: [app.authenticate, requirePermission('deals.read')],
      schema: {
        tags: ['deals'],
        summary: 'List deals (paginated)',
        params: paramsSchema,
        querystring: dealListQuerySchema,
        response: { 200: dealListResponseSchema },
      },
    },
    async (request) => {
      const { organizationId } = request.params;
      const query = request.query;
      const { items, total } = await listDeals(organizationId, query);

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

  app.get(
    '/organizations/:organizationId/pipelines/:pipelineId/deals',
    {
      preHandler: [app.authenticate, requirePermission('deals.read')],
      schema: {
        tags: ['deals'],
        summary: 'List every open+closed deal in a pipeline, unpaginated (for the Kanban board)',
        params: pipelineParamsSchema,
        response: { 200: dealArrayResponseSchema },
      },
    },
    async (request) => {
      const { organizationId, pipelineId } = request.params;
      const deals = await listDealsForPipeline(organizationId, pipelineId);
      return { success: true as const, data: deals };
    },
  );

  app.get(
    '/organizations/:organizationId/pipelines/:pipelineId/summary',
    {
      preHandler: [app.authenticate, requirePermission('deals.read')],
      schema: {
        tags: ['deals'],
        summary: 'Pipeline value summary: total, weighted, won, conversion rate',
        params: pipelineParamsSchema,
        response: { 200: summaryResponseSchema },
      },
    },
    async (request) => {
      const { organizationId, pipelineId } = request.params;
      const summary = await getPipelineSummary(organizationId, pipelineId);
      return { success: true as const, data: summary };
    },
  );

  app.get(
    '/organizations/:organizationId/deals/:dealId',
    {
      preHandler: [app.authenticate, requirePermission('deals.read')],
      schema: {
        tags: ['deals'],
        summary: 'Get a deal by id',
        params: dealParamsSchema,
        response: { 200: dealResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, dealId } = request.params;
      const deal = await getDealById(organizationId, dealId);

      if (!deal) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Deal not found.' },
        });
      }

      return { success: true as const, data: deal };
    },
  );

  app.post(
    '/organizations/:organizationId/deals',
    {
      preHandler: [app.authenticate, requirePermission('deals.create')],
      config: { audit: { action: 'deal.create', entityType: 'deal' } },
      schema: {
        tags: ['deals'],
        summary: 'Create a deal',
        params: paramsSchema,
        body: createDealSchema,
        response: { 201: dealResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId } = request.params;
      const deal = await createDeal(organizationId, request.user.id, request.body);
      return reply.code(201).send({ success: true as const, data: deal });
    },
  );

  app.patch(
    '/organizations/:organizationId/deals/:dealId',
    {
      preHandler: [app.authenticate, requirePermission('deals.update')],
      config: { audit: { action: 'deal.update', entityType: 'deal' } },
      schema: {
        tags: ['deals'],
        summary: 'Update a deal',
        params: dealParamsSchema,
        body: updateDealSchema,
        response: { 200: dealResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, dealId } = request.params;
      const deal = await updateDeal(organizationId, dealId, request.body);

      if (!deal) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Deal not found.' },
        });
      }

      return { success: true as const, data: deal };
    },
  );

  app.post(
    '/organizations/:organizationId/deals/:dealId/move',
    {
      preHandler: [app.authenticate, requirePermission('deals.update')],
      config: { audit: { action: 'deal.move_stage', entityType: 'deal' } },
      schema: {
        tags: ['deals'],
        summary: 'Move a deal to a different stage (drag-and-drop on the Kanban board)',
        params: dealParamsSchema,
        body: moveDealSchema,
        response: { 200: dealResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, dealId } = request.params;
      const deal = await moveDealToStage(organizationId, dealId, request.body.stageId);

      if (!deal) {
        return reply.code(404).send({
          success: false as const,
          error: {
            code: 'NOT_FOUND',
            message:
              'Deal or target stage not found, or the stage belongs to a different pipeline.',
          },
        });
      }

      return { success: true as const, data: deal };
    },
  );

  app.delete(
    '/organizations/:organizationId/deals/:dealId',
    {
      preHandler: [app.authenticate, requirePermission('deals.delete')],
      config: { audit: { action: 'deal.delete', entityType: 'deal' } },
      schema: {
        tags: ['deals'],
        summary: 'Delete a deal',
        params: dealParamsSchema,
        response: { 200: okResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, dealId } = request.params;
      const ok = await softDeleteDeal(organizationId, dealId);

      if (!ok) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Deal not found.' },
        });
      }

      return { success: true as const, data: { ok: true as const } };
    },
  );
};
