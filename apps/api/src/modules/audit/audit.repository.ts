import { supabaseAdmin } from '@/lib/supabase-admin.js';

export interface WriteAuditLogInput {
  organizationId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Fire-and-forget by design, same as notifications: a write to audit_logs
 * is a side effect of the primary action, never something whose own
 * failure should roll back or surface to the caller. audit_logs has no
 * update/delete policy for any role — it is genuinely append-only.
 */
export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  await supabaseAdmin.from('audit_logs').insert({
    organization_id: input.organizationId,
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    metadata: input.metadata ?? {},
    ip_address: input.ipAddress ?? null,
  });
}
