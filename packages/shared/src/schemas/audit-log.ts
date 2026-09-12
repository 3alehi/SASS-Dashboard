import { z } from 'zod';

export const auditLogSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  actorId: z.string().uuid().nullable(),
  actorName: z.string().nullable(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().uuid().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  ipAddress: z.string().nullable(),
  createdAt: z.string(),
});
export type AuditLog = z.infer<typeof auditLogSchema>;

export const auditLogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  entityType: z.string().trim().optional(),
  action: z.string().trim().optional(),
  actorId: z.string().uuid().optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
});
export type AuditLogListQuery = z.infer<typeof auditLogListQuerySchema>;
