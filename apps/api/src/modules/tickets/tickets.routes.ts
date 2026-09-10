import {
  createTicketMessageSchema,
  createTicketSchema,
  ticketListQuerySchema,
  ticketMessageSchema,
  ticketSchema,
  updateTicketSchema,
} from '@nexora/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requirePermission } from '@/modules/rbac/require-permission.js';
import {
  createTicketMessage,
  listTicketMessages,
} from '@/modules/tickets/ticket-messages.repository.js';
import {
  createTicket,
  getTicketById,
  listTickets,
  softDeleteTicket,
  updateTicket,
} from '@/modules/tickets/tickets.repository.js';

const paramsSchema = z.object({ organizationId: z.string().uuid() });
const ticketParamsSchema = paramsSchema.extend({ ticketId: z.string().uuid() });

const ticketResponseSchema = z.object({ success: z.literal(true), data: ticketSchema });
const ticketListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(ticketSchema),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
const messageListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(ticketMessageSchema),
});
const messageResponseSchema = z.object({ success: z.literal(true), data: ticketMessageSchema });
const okResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ ok: z.literal(true) }),
});
const notFoundResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }),
});

export const ticketsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/organizations/:organizationId/tickets',
    {
      preHandler: [app.authenticate, requirePermission('tickets.read')],
      schema: {
        tags: ['tickets'],
        summary: 'List tickets (paginated)',
        params: paramsSchema,
        querystring: ticketListQuerySchema,
        response: { 200: ticketListResponseSchema },
      },
    },
    async (request) => {
      const { organizationId } = request.params;
      const query = request.query;
      const { items, total } = await listTickets(organizationId, query);

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
    '/organizations/:organizationId/tickets/:ticketId',
    {
      preHandler: [app.authenticate, requirePermission('tickets.read')],
      schema: {
        tags: ['tickets'],
        summary: 'Get a ticket by id',
        params: ticketParamsSchema,
        response: { 200: ticketResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, ticketId } = request.params;
      const ticket = await getTicketById(organizationId, ticketId);

      if (!ticket) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Ticket not found.' },
        });
      }

      return { success: true as const, data: ticket };
    },
  );

  app.post(
    '/organizations/:organizationId/tickets',
    {
      preHandler: [app.authenticate, requirePermission('tickets.create')],
      schema: {
        tags: ['tickets'],
        summary: 'Create a ticket',
        params: paramsSchema,
        body: createTicketSchema,
        response: { 201: ticketResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId } = request.params;
      const ticket = await createTicket(organizationId, request.user.id, request.body);
      return reply.code(201).send({ success: true as const, data: ticket });
    },
  );

  app.patch(
    '/organizations/:organizationId/tickets/:ticketId',
    {
      preHandler: [app.authenticate, requirePermission('tickets.update')],
      schema: {
        tags: ['tickets'],
        summary: 'Update a ticket (status → RESOLVED/CLOSED stamps the matching timestamp)',
        params: ticketParamsSchema,
        body: updateTicketSchema,
        response: { 200: ticketResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, ticketId } = request.params;
      const ticket = await updateTicket(organizationId, ticketId, request.body);

      if (!ticket) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Ticket not found.' },
        });
      }

      return { success: true as const, data: ticket };
    },
  );

  app.delete(
    '/organizations/:organizationId/tickets/:ticketId',
    {
      preHandler: [app.authenticate, requirePermission('tickets.delete')],
      schema: {
        tags: ['tickets'],
        summary: 'Delete a ticket',
        params: ticketParamsSchema,
        response: { 200: okResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, ticketId } = request.params;
      const ok = await softDeleteTicket(organizationId, ticketId);

      if (!ok) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Ticket not found.' },
        });
      }

      return { success: true as const, data: { ok: true as const } };
    },
  );

  app.get(
    '/organizations/:organizationId/tickets/:ticketId/messages',
    {
      preHandler: [app.authenticate, requirePermission('tickets.read')],
      schema: {
        tags: ['tickets'],
        summary: 'List the conversation + internal notes on a ticket',
        params: ticketParamsSchema,
        response: { 200: messageListResponseSchema },
      },
    },
    async (request) => {
      const { organizationId, ticketId } = request.params;
      const messages = await listTicketMessages(organizationId, ticketId);
      return { success: true as const, data: messages };
    },
  );

  app.post(
    '/organizations/:organizationId/tickets/:ticketId/messages',
    {
      preHandler: [app.authenticate, requirePermission('tickets.update')],
      schema: {
        tags: ['tickets'],
        summary: 'Reply on a ticket, or add an internal note (isInternal: true)',
        params: ticketParamsSchema,
        body: createTicketMessageSchema,
        response: { 201: messageResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, ticketId } = request.params;
      const message = await createTicketMessage(
        organizationId,
        ticketId,
        request.user.id,
        request.body.body,
        request.body.isInternal,
      );
      return reply.code(201).send({ success: true as const, data: message });
    },
  );
};
