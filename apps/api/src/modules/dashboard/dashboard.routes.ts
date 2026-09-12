import {
  dashboardOverviewSchema,
  dashboardQuerySchema,
  leadConversionStageSchema,
  revenueSeriesSchema,
  salesPerformanceEntrySchema,
  stageValueSchema,
  wonLostPointSchema,
} from '@nexora/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  getDashboardOverview,
  getLeadConversionFunnel,
  getPipelineByStage,
  getRevenueSeries,
  getSalesPerformance,
  getWonLostSeries,
} from '@/modules/dashboard/dashboard.repository.js';
import { requirePermission } from '@/modules/rbac/require-permission.js';

const paramsSchema = z.object({ organizationId: z.string().uuid() });

const overviewResponseSchema = z.object({ success: z.literal(true), data: dashboardOverviewSchema });
const revenueResponseSchema = z.object({ success: z.literal(true), data: revenueSeriesSchema });
const stagesResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(stageValueSchema),
});
const wonLostResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(wonLostPointSchema),
});
const leadFunnelResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(leadConversionStageSchema),
});
const salesPerformanceResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(salesPerformanceEntrySchema),
});

export const dashboardRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/organizations/:organizationId/dashboard/overview',
    {
      preHandler: [app.authenticate, requirePermission('reports.read')],
      schema: {
        tags: ['dashboard'],
        summary: 'KPI overview with period-over-period comparison',
        params: paramsSchema,
        querystring: dashboardQuerySchema,
        response: { 200: overviewResponseSchema },
      },
    },
    async (request) => {
      const data = await getDashboardOverview(request.params.organizationId, request.query);
      return { success: true as const, data };
    },
  );

  app.get(
    '/organizations/:organizationId/dashboard/revenue',
    {
      preHandler: [app.authenticate, requirePermission('reports.read')],
      schema: {
        tags: ['dashboard'],
        summary: 'Revenue over time (current vs. previous period)',
        params: paramsSchema,
        querystring: dashboardQuerySchema,
        response: { 200: revenueResponseSchema },
      },
    },
    async (request) => {
      const data = await getRevenueSeries(request.params.organizationId, request.query);
      return { success: true as const, data };
    },
  );

  app.get(
    '/organizations/:organizationId/dashboard/pipeline-by-stage',
    {
      preHandler: [app.authenticate, requirePermission('reports.read')],
      schema: {
        tags: ['dashboard'],
        summary: 'Open deal value and count grouped by pipeline stage',
        params: paramsSchema,
        response: { 200: stagesResponseSchema },
      },
    },
    async (request) => {
      const data = await getPipelineByStage(request.params.organizationId);
      return { success: true as const, data };
    },
  );

  app.get(
    '/organizations/:organizationId/dashboard/won-lost',
    {
      preHandler: [app.authenticate, requirePermission('reports.read')],
      schema: {
        tags: ['dashboard'],
        summary: 'Deals won vs. lost per day',
        params: paramsSchema,
        querystring: dashboardQuerySchema,
        response: { 200: wonLostResponseSchema },
      },
    },
    async (request) => {
      const data = await getWonLostSeries(request.params.organizationId, request.query);
      return { success: true as const, data };
    },
  );

  app.get(
    '/organizations/:organizationId/dashboard/lead-conversion',
    {
      preHandler: [app.authenticate, requirePermission('reports.read')],
      schema: {
        tags: ['dashboard'],
        summary: 'Lead funnel counts by status for the selected period',
        params: paramsSchema,
        querystring: dashboardQuerySchema,
        response: { 200: leadFunnelResponseSchema },
      },
    },
    async (request) => {
      const data = await getLeadConversionFunnel(request.params.organizationId, request.query);
      return { success: true as const, data };
    },
  );

  app.get(
    '/organizations/:organizationId/dashboard/sales-performance',
    {
      preHandler: [app.authenticate, requirePermission('reports.read')],
      schema: {
        tags: ['dashboard'],
        summary: 'Won deal value and count grouped by owner',
        params: paramsSchema,
        querystring: dashboardQuerySchema,
        response: { 200: salesPerformanceResponseSchema },
      },
    },
    async (request) => {
      const data = await getSalesPerformance(request.params.organizationId, request.query);
      return { success: true as const, data };
    },
  );
};
