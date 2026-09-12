import { notificationPreferencesSchema, updateNotificationPreferencesSchema } from '@nexora/shared';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { supabaseAdmin } from '@/lib/supabase-admin.js';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/modules/me/notification-preferences.repository.js';

const membershipSchema = z.object({
  organizationId: z.string().uuid(),
  organizationName: z.string(),
  organizationSlug: z.string(),
  role: z.string(),
  permissions: z.array(z.string()),
});

const meResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string().uuid(),
    email: z.string().email().nullable(),
    organizations: z.array(membershipSchema),
  }),
});

/**
 * GET /api/v1/me — returns the authenticated user's identity plus every
 * organization they belong to, with their resolved role and permission set
 * for each. The frontend uses this once after sign-in to drive its
 * permission gates (hide/disable UI) — never as the security boundary,
 * which remains the API's per-route requirePermission() checks and Postgres
 * RLS.
 */
export const meRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/me',
    {
      preHandler: app.authenticate,
      schema: {
        tags: ['me'],
        summary: "Get the current user's profile and organization memberships",
        response: { 200: meResponseSchema },
      },
    },
    async (request) => {
      const { data: memberships, error } = await supabaseAdmin
        .from('organization_members')
        .select(
          'organization_id, organizations!inner(name, slug), role_id, roles!inner(name), status',
        )
        .eq('user_id', request.user.id)
        .eq('status', 'ACTIVE');

      if (error || !memberships) {
        return {
          success: true,
          data: { id: request.user.id, email: request.user.email ?? null, organizations: [] },
        };
      }

      const organizations = await Promise.all(
        memberships.map(async (row) => {
          const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
          const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;

          const { data: rolePermissions } = await supabaseAdmin
            .from('role_permissions')
            .select('permissions!inner(key)')
            .eq('role_id', row.role_id);

          const permissions = (rolePermissions ?? []).map((permissionRow) => {
            const permission = Array.isArray(permissionRow.permissions)
              ? permissionRow.permissions[0]
              : permissionRow.permissions;
            return (permission as { key: string } | null)?.key ?? '';
          });

          return {
            organizationId: row.organization_id as string,
            organizationName: (org as { name: string } | null)?.name ?? '',
            organizationSlug: (org as { slug: string } | null)?.slug ?? '',
            role: (role as { name: string } | null)?.name ?? '',
            permissions: permissions.filter(Boolean),
          };
        }),
      );

      return {
        success: true,
        data: { id: request.user.id, email: request.user.email ?? null, organizations },
      };
    },
  );

  app.get(
    '/me/notification-preferences',
    {
      preHandler: app.authenticate,
      schema: {
        tags: ['me'],
        summary: "Get the current user's notification preferences (defaults to all enabled)",
        response: {
          200: z.object({ success: z.literal(true), data: notificationPreferencesSchema }),
        },
      },
    },
    async (request) => {
      const data = await getNotificationPreferences(request.user.id);
      return { success: true, data };
    },
  );

  app.patch(
    '/me/notification-preferences',
    {
      preHandler: app.authenticate,
      schema: {
        tags: ['me'],
        summary: "Update the current user's notification preferences (partial)",
        response: {
          200: z.object({ success: z.literal(true), data: notificationPreferencesSchema }),
        },
      },
    },
    async (request) => {
      const input = updateNotificationPreferencesSchema.parse(request.body);
      const data = await updateNotificationPreferences(request.user.id, input);
      return { success: true, data };
    },
  );
};
