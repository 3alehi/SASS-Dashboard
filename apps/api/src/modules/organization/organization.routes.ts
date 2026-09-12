import {
  organizationSchema,
  organizationSettingsSchema,
  updateOrganizationSchema,
  updateOrganizationSettingsSchema,
} from '@nexora/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  getOrganizationById,
  getOrganizationSettings,
  updateOrganization,
  updateOrganizationSettings,
} from '@/modules/organization/organization.repository.js';
import { requirePermission } from '@/modules/rbac/require-permission.js';

const paramsSchema = z.object({ organizationId: z.string().uuid() });

const organizationResponseSchema = z.object({ success: z.literal(true), data: organizationSchema });
const organizationSettingsResponseSchema = z.object({
  success: z.literal(true),
  data: organizationSettingsSchema,
});
const notFoundResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }),
});

export const organizationRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/organizations/:organizationId',
    {
      preHandler: [app.authenticate, requirePermission('settings.manage')],
      schema: {
        tags: ['organization'],
        summary: 'Get organization profile',
        params: paramsSchema,
        response: { 200: organizationResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId } = request.params;
      const organization = await getOrganizationById(organizationId);

      if (!organization) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Organization not found.' },
        });
      }

      return { success: true as const, data: organization };
    },
  );

  app.patch(
    '/organizations/:organizationId',
    {
      preHandler: [app.authenticate, requirePermission('settings.manage')],
      config: { audit: { action: 'organization.update', entityType: 'organization' } },
      schema: {
        tags: ['organization'],
        summary: 'Update organization profile (name, industry, size, website, billing email, logo)',
        params: paramsSchema,
        body: updateOrganizationSchema,
        response: { 200: organizationResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId } = request.params;
      const organization = await updateOrganization(organizationId, request.body);

      if (!organization) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Organization not found.' },
        });
      }

      return { success: true as const, data: organization };
    },
  );

  app.get(
    '/organizations/:organizationId/settings',
    {
      preHandler: [app.authenticate, requirePermission('settings.manage')],
      schema: {
        tags: ['organization'],
        summary: 'Get organization settings (currency, fiscal year, date format)',
        params: paramsSchema,
        response: { 200: organizationSettingsResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId } = request.params;
      const settings = await getOrganizationSettings(organizationId);

      if (!settings) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Organization settings not found.' },
        });
      }

      return { success: true as const, data: settings };
    },
  );

  app.patch(
    '/organizations/:organizationId/settings',
    {
      preHandler: [app.authenticate, requirePermission('settings.manage')],
      config: { audit: { action: 'organization.update_settings', entityType: 'organization' } },
      schema: {
        tags: ['organization'],
        summary: 'Update organization settings (partial)',
        params: paramsSchema,
        body: updateOrganizationSettingsSchema,
        response: { 200: organizationSettingsResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId } = request.params;
      const settings = await updateOrganizationSettings(organizationId, request.body);

      if (!settings) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Could not update organization settings.' },
        });
      }

      return { success: true as const, data: settings };
    },
  );
};
