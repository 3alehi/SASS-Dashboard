import {
  convertLeadResultSchema,
  convertLeadSchema,
  createLeadSchema,
  leadListQuerySchema,
  leadSchema,
  updateLeadSchema,
} from '@nexora/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { supabaseAdmin } from '@/lib/supabase-admin.js';
import {
  createLead,
  getLeadById,
  listLeads,
  softDeleteLead,
  updateLead,
} from '@/modules/leads/leads.repository.js';
import { requireAllPermissions, requirePermission } from '@/modules/rbac/require-permission.js';

const paramsSchema = z.object({ organizationId: z.string().uuid() });
const leadParamsSchema = paramsSchema.extend({ leadId: z.string().uuid() });

const leadResponseSchema = z.object({ success: z.literal(true), data: leadSchema });
const leadListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(leadSchema),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
const okResponseSchema = z.object({ success: z.literal(true), data: z.object({ ok: z.literal(true) }) });
const convertResponseSchema = z.object({ success: z.literal(true), data: convertLeadResultSchema });
const notFoundResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }),
});

export const leadsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/organizations/:organizationId/leads',
    {
      preHandler: [app.authenticate, requirePermission('leads.read')],
      schema: {
        tags: ['leads'],
        summary: 'List leads',
        params: paramsSchema,
        querystring: leadListQuerySchema,
        response: { 200: leadListResponseSchema },
      },
    },
    async (request) => {
      const { organizationId } = request.params;
      const query = request.query;

      const { items, total } = await listLeads(organizationId, query);

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
    '/organizations/:organizationId/leads/:leadId',
    {
      preHandler: [app.authenticate, requirePermission('leads.read')],
      schema: {
        tags: ['leads'],
        summary: 'Get a lead by id',
        params: leadParamsSchema,
        response: { 200: leadResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, leadId } = request.params;
      const lead = await getLeadById(organizationId, leadId);

      if (!lead) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Lead not found.' },
        });
      }

      return { success: true as const, data: lead };
    },
  );

  app.post(
    '/organizations/:organizationId/leads',
    {
      preHandler: [app.authenticate, requirePermission('leads.create')],
      schema: {
        tags: ['leads'],
        summary: 'Create a lead',
        params: paramsSchema,
        body: createLeadSchema,
        response: { 201: leadResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId } = request.params;
      const lead = await createLead(organizationId, request.user.id, request.body);
      return reply.code(201).send({ success: true as const, data: lead });
    },
  );

  app.patch(
    '/organizations/:organizationId/leads/:leadId',
    {
      preHandler: [app.authenticate, requirePermission('leads.update')],
      schema: {
        tags: ['leads'],
        summary: 'Update a lead',
        params: leadParamsSchema,
        body: updateLeadSchema,
        response: { 200: leadResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, leadId } = request.params;
      const lead = await updateLead(organizationId, leadId, request.body);

      if (!lead) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Lead not found.' },
        });
      }

      return { success: true as const, data: lead };
    },
  );

  app.delete(
    '/organizations/:organizationId/leads/:leadId',
    {
      preHandler: [app.authenticate, requirePermission('leads.delete')],
      schema: {
        tags: ['leads'],
        summary: 'Delete a lead',
        params: leadParamsSchema,
        response: { 200: okResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, leadId } = request.params;
      const ok = await softDeleteLead(organizationId, leadId);

      if (!ok) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Lead not found.' },
        });
      }

      return { success: true as const, data: { ok: true as const } };
    },
  );

  app.post(
    '/organizations/:organizationId/leads/:leadId/convert',
    {
      preHandler: [
        app.authenticate,
        requireAllPermissions(['leads.update', 'customers.create']),
      ],
      schema: {
        tags: ['leads'],
        summary:
          'Convert a lead into a customer (+ primary contact, optionally a deal), preserving lead history',
        params: leadParamsSchema,
        body: convertLeadSchema,
        response: { 200: convertResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { leadId } = request.params;
      const { createDeal, pipelineId, stageId, dealValue } = request.body;

      const { data, error } = await supabaseAdmin.rpc('convert_lead', {
        target_lead_id: leadId,
        create_deal: createDeal,
        deal_pipeline_id: pipelineId ?? null,
        deal_stage_id: stageId ?? null,
        deal_value: dealValue ?? null,
      });

      if (error) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'CONVERSION_FAILED', message: error.message },
        });
      }

      const result = Array.isArray(data) ? data[0] : data;

      return {
        success: true as const,
        data: {
          customerId: result.customer_id,
          contactId: result.contact_id,
          dealId: result.deal_id,
        },
      };
    },
  );
};
