import type { Permission } from '@nexora/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { getMembership, getRolePermissions } from '@/modules/rbac/rbac.repository.js';

declare module 'fastify' {
  interface FastifyRequest {
    membership?: {
      organizationId: string;
      roleId: number;
      roleName: string;
    };
  }
}

/**
 * Resolves organization_id strictly from the route param (never trusts a
 * body/query value for authorization), loads the caller's membership and
 * role permissions from the database, and rejects the request with 403 if
 * the required permission isn't granted. On success, attaches the resolved
 * membership to request.membership so the route handler can reuse it
 * without a second lookup.
 *
 * This is the server-side enforcement layer described in
 * docs/authorization.md — it exists independently of, and in addition to,
 * the Postgres RLS policies. A request that somehow bypassed this check
 * would still be blocked at the database layer, and vice versa.
 */
export function requirePermission(permission: Permission) {
  return async function requirePermissionHandler(request: FastifyRequest, reply: FastifyReply) {
    const organizationId = (request.params as Record<string, string> | undefined)?.organizationId;

    if (!organizationId) {
      return reply.code(400).send({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'organizationId route parameter is required.' },
      });
    }

    const membership = await getMembership(request.user.id, organizationId);

    if (!membership) {
      return reply.code(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not a member of this organization.' },
      });
    }

    const permissions = await getRolePermissions(membership.roleId);

    if (!permissions.has(permission)) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Missing required permission: ${permission}`,
        },
      });
    }

    request.membership = {
      organizationId: membership.organizationId,
      roleId: membership.roleId,
      roleName: membership.roleName,
    };
  };
}
