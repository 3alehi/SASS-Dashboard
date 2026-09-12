import {
  createCustomerSchema,
  customerListQuerySchema,
  customerSchema,
  updateCustomerSchema,
} from '@nexora/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  createCustomer,
  getCustomerById,
  listCustomers,
  restoreCustomer,
  softDeleteCustomer,
  updateCustomer,
} from '@/modules/customers/customers.repository.js';
import { requirePermission } from '@/modules/rbac/require-permission.js';

const paramsSchema = z.object({ organizationId: z.string().uuid() });
const customerParamsSchema = paramsSchema.extend({ customerId: z.string().uuid() });

const customerResponseSchema = z.object({ success: z.literal(true), data: customerSchema });
const customerListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(customerSchema),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
const okResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ ok: z.literal(true) }),
});
const notFoundResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }),
});

export const customersRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/organizations/:organizationId/customers',
    {
      preHandler: [app.authenticate, requirePermission('customers.read')],
      schema: {
        tags: ['customers'],
        summary: 'List customers',
        params: paramsSchema,
        querystring: customerListQuerySchema,
        response: { 200: customerListResponseSchema },
      },
    },
    async (request) => {
      const { organizationId } = request.params;
      const query = request.query;

      const { items, total } = await listCustomers(organizationId, query);

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
    '/organizations/:organizationId/customers/:customerId',
    {
      preHandler: [app.authenticate, requirePermission('customers.read')],
      schema: {
        tags: ['customers'],
        summary: 'Get a customer by id',
        params: customerParamsSchema,
        response: { 200: customerResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, customerId } = request.params;
      const customer = await getCustomerById(organizationId, customerId);

      if (!customer) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Customer not found.' },
        });
      }

      return { success: true as const, data: customer };
    },
  );

  app.post(
    '/organizations/:organizationId/customers',
    {
      preHandler: [app.authenticate, requirePermission('customers.create')],
      config: { audit: { action: 'customer.create', entityType: 'customer' } },
      schema: {
        tags: ['customers'],
        summary: 'Create a customer',
        params: paramsSchema,
        body: createCustomerSchema,
        response: { 201: customerResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId } = request.params;
      const customer = await createCustomer(organizationId, request.user.id, request.body);
      return reply.code(201).send({ success: true as const, data: customer });
    },
  );

  app.patch(
    '/organizations/:organizationId/customers/:customerId',
    {
      preHandler: [app.authenticate, requirePermission('customers.update')],
      config: { audit: { action: 'customer.update', entityType: 'customer' } },
      schema: {
        tags: ['customers'],
        summary: 'Update a customer',
        params: customerParamsSchema,
        body: updateCustomerSchema,
        response: { 200: customerResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, customerId } = request.params;
      const customer = await updateCustomer(organizationId, customerId, request.body);

      if (!customer) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Customer not found.' },
        });
      }

      return { success: true as const, data: customer };
    },
  );

  app.delete(
    '/organizations/:organizationId/customers/:customerId',
    {
      preHandler: [app.authenticate, requirePermission('customers.delete')],
      config: { audit: { action: 'customer.delete', entityType: 'customer' } },
      schema: {
        tags: ['customers'],
        summary: 'Archive (soft-delete) a customer',
        params: customerParamsSchema,
        response: { 200: okResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, customerId } = request.params;
      const ok = await softDeleteCustomer(organizationId, customerId);

      if (!ok) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Customer not found.' },
        });
      }

      return { success: true as const, data: { ok: true as const } };
    },
  );

  app.post(
    '/organizations/:organizationId/customers/:customerId/restore',
    {
      preHandler: [app.authenticate, requirePermission('customers.update')],
      config: { audit: { action: 'customer.restore', entityType: 'customer' } },
      schema: {
        tags: ['customers'],
        summary: 'Restore an archived customer',
        params: customerParamsSchema,
        response: { 200: okResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, customerId } = request.params;
      const ok = await restoreCustomer(organizationId, customerId);

      if (!ok) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Archived customer not found.' },
        });
      }

      return { success: true as const, data: { ok: true as const } };
    },
  );
};
