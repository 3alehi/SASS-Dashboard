import {
  EXPORTABLE_ENTITIES,
  IMPORTABLE_ENTITIES,
  importResultSchema,
  type ExportableEntity,
  type ImportableEntity,
  type Permission,
} from '@nexora/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { writeAuditLog } from '@/modules/audit/audit.repository.js';
import { exportEntityToCsv } from '@/modules/import-export/export.service.js';
import { importEntityFromCsv } from '@/modules/import-export/import.service.js';
import { requireAllPermissions } from '@/modules/rbac/require-permission.js';

const paramsSchema = z.object({ organizationId: z.string().uuid() });
const exportParamsSchema = paramsSchema.extend({ entity: z.enum(EXPORTABLE_ENTITIES) });
const importParamsSchema = paramsSchema.extend({ entity: z.enum(IMPORTABLE_ENTITIES) });

const importBodySchema = z.object({
  csv: z.string().min(1, 'CSV content is required'),
});

const importResponseSchema = z.object({ success: z.literal(true), data: importResultSchema });
const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }),
});

const EXPORT_PERMISSION: Record<ExportableEntity, Permission> = {
  customers: 'customers.read',
  leads: 'leads.read',
  deals: 'deals.read',
  tasks: 'tasks.read',
  tickets: 'tickets.read',
};

const IMPORT_PERMISSION: Record<ImportableEntity, Permission> = {
  customers: 'customers.create',
  leads: 'leads.create',
};

/**
 * The required permission depends on the :entity route param, which isn't
 * known until the request arrives — so, unlike every other module's static
 * requirePermission('x.y') preHandler, this resolves the permission per
 * request and delegates to the same requireAllPermissions() enforcement
 * (membership + role-permission lookup, 403 on a miss) everything else uses.
 */
function requirePermissionForEntity<TEntity extends string>(
  permissionByEntity: Record<TEntity, Permission>,
) {
  return async function requirePermissionForEntityHandler(
    request: Parameters<ReturnType<typeof requireAllPermissions>>[0],
    reply: Parameters<ReturnType<typeof requireAllPermissions>>[1],
  ) {
    const entity = (request.params as { entity: TEntity }).entity;
    const permission = permissionByEntity[entity];
    return requireAllPermissions([permission])(request, reply);
  };
}

export const importExportRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/organizations/:organizationId/export/:entity',
    {
      preHandler: [app.authenticate, requirePermissionForEntity(EXPORT_PERMISSION)],
      schema: {
        tags: ['import-export'],
        summary: 'Export an entity type to CSV',
        params: exportParamsSchema,
      },
    },
    async (request, reply) => {
      const { organizationId, entity } = request.params;
      const csv = await exportEntityToCsv(organizationId, entity);

      reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${entity}-export.csv"`)
        .send(csv);
    },
  );

  app.post(
    '/organizations/:organizationId/import/:entity',
    {
      preHandler: [app.authenticate, requirePermissionForEntity(IMPORT_PERMISSION)],
      schema: {
        tags: ['import-export'],
        summary: 'Import customers or leads from a CSV file (create-only, no updates)',
        params: importParamsSchema,
        body: importBodySchema,
        response: { 200: importResponseSchema, 400: errorResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, entity } = request.params;

      try {
        const result = await importEntityFromCsv(
          organizationId,
          request.user.id,
          entity,
          request.body.csv,
        );

        // Logged directly (not via the generic onSend audit hook) since an
        // import is one event covering many created rows, not a single
        // entity with an id the hook's response-shape convention expects.
        await writeAuditLog({
          organizationId,
          actorId: request.user.id,
          action: `${entity}.import`,
          entityType: entity,
          entityId: null,
          metadata: {
            totalRows: result.totalRows,
            successCount: result.successCount,
            errorCount: result.errorCount,
          },
          ipAddress: request.ip,
        });

        return { success: true as const, data: result };
      } catch (error) {
        return reply.code(400).send({
          success: false as const,
          error: {
            code: 'IMPORT_FAILED',
            message: error instanceof Error ? error.message : 'Could not import CSV.',
          },
        });
      }
    },
  );
};
