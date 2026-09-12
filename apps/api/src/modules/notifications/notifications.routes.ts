import { notificationListQuerySchema, notificationSchema } from '@nexora/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/modules/notifications/notifications.repository.js';

const paramsSchema = z.object({ organizationId: z.string().uuid() });
const notificationParamsSchema = paramsSchema.extend({ notificationId: z.string().uuid() });

const notificationListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(notificationSchema),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
const unreadCountResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ count: z.number() }),
});
const notificationResponseSchema = z.object({
  success: z.literal(true),
  data: notificationSchema,
});
const okResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ ok: z.literal(true) }),
});
const notFoundResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }),
});

/**
 * No permission gate beyond authentication: notifications are strictly
 * per-user (the repository always filters by request.user.id), so there is
 * nothing here a permission check would additionally protect — the same
 * design as the notifications RLS policies, which key on auth.uid() alone.
 */
export const notificationsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/organizations/:organizationId/notifications',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['notifications'],
        summary: "List the current user's notifications (paginated)",
        params: paramsSchema,
        querystring: notificationListQuerySchema,
        response: { 200: notificationListResponseSchema },
      },
    },
    async (request) => {
      const { organizationId } = request.params;
      const query = request.query;
      const { items, total } = await listNotifications(organizationId, request.user.id, query);

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
    '/organizations/:organizationId/notifications/unread-count',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['notifications'],
        summary: 'Unread notification count for the current user',
        params: paramsSchema,
        response: { 200: unreadCountResponseSchema },
      },
    },
    async (request) => {
      const { organizationId } = request.params;
      const count = await getUnreadCount(organizationId, request.user.id);
      return { success: true as const, data: { count } };
    },
  );

  app.post(
    '/organizations/:organizationId/notifications/read-all',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['notifications'],
        summary: "Mark every one of the current user's notifications as read",
        params: paramsSchema,
        response: { 200: okResponseSchema },
      },
    },
    async (request) => {
      const { organizationId } = request.params;
      await markAllNotificationsRead(organizationId, request.user.id);
      return { success: true as const, data: { ok: true as const } };
    },
  );

  app.post(
    '/organizations/:organizationId/notifications/:notificationId/read',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['notifications'],
        summary: 'Mark a single notification as read',
        params: notificationParamsSchema,
        response: { 200: notificationResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, notificationId } = request.params;
      const notification = await markNotificationRead(
        organizationId,
        request.user.id,
        notificationId,
      );

      if (!notification) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Notification not found or already read.' },
        });
      }

      return { success: true as const, data: notification };
    },
  );
};
