import type { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import { writeAuditLog } from '@/modules/audit/audit.repository.js';

export interface AuditRouteConfig {
  /** e.g. 'customer.create', 'deal.delete', 'team_member.role_change' */
  action: string;
  entityType: string;
}

declare module 'fastify' {
  interface FastifyContextConfig {
    audit?: AuditRouteConfig;
  }
}

function extractEntityId(request: FastifyRequest, payload: unknown): string | null {
  // DELETE (and most single-resource mutations) carry the id in the route
  // params under a `<name>Id` key — take the last one, since nested params
  // like { organizationId, dealId } should resolve to the deal, not the org.
  const params = request.params as Record<string, string> | undefined;
  if (params) {
    const idKeys = Object.keys(params).filter(
      (key) => key.endsWith('Id') && key !== 'organizationId',
    );
    const lastKey = idKeys.at(-1);
    if (lastKey) return params[lastKey] ?? null;
  }

  // POST (create) has no id in the URL yet — read it back from the
  // { success, data: { id, ... } } response body the API always returns.
  if (typeof payload === 'string') {
    try {
      const body = JSON.parse(payload) as { data?: { id?: string } };
      return body.data?.id ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Writes an audit_logs row for every mutating route that opts in via
 * `config: { audit: { action, entityType } }`. Centralizing this in one
 * onSend hook — rather than a writeAuditLog() call hand-added to each of
 * the ~28 mutating handlers — means a route can't forget to log: adding
 * the config is the only step, and it fires only on a successful (2xx)
 * response, so a failed write is never logged as having happened.
 */
export default fp(async function auditLogPlugin(app) {
  app.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
    const auditConfig = request.routeOptions.config?.audit;
    if (!auditConfig) return payload;
    if (reply.statusCode < 200 || reply.statusCode >= 300) return payload;

    const params = request.params as Record<string, string> | undefined;
    const organizationId = params?.organizationId;
    if (!organizationId) return payload;

    const entityId = extractEntityId(request, payload);

    await writeAuditLog({
      organizationId,
      actorId: request.user?.id ?? null,
      action: auditConfig.action,
      entityType: auditConfig.entityType,
      entityId,
      ipAddress: request.ip,
    });

    return payload;
  });
});
