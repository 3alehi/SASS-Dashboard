import type { FastifyReply, FastifyRequest } from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as rbacRepository from '@/modules/rbac/rbac.repository.js';
import { requirePermission } from '@/modules/rbac/require-permission.js';

function mockReply() {
  const reply = {
    code: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return reply as unknown as FastifyReply;
}

function mockRequest(overrides: Partial<FastifyRequest> = {}) {
  return {
    user: { id: 'user-1', email: 'user@example.com' },
    params: { organizationId: 'org-1' },
    ...overrides,
  } as unknown as FastifyRequest;
}

describe('requirePermission', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 when organizationId is missing from route params', async () => {
    const handler = requirePermission('customers.read');
    const request = mockRequest({ params: {} } as never);
    const reply = mockReply();

    await handler(request, reply);

    expect(reply.code).toHaveBeenCalledWith(400);
  });

  it('returns 403 when the caller is not a member of the organization', async () => {
    vi.spyOn(rbacRepository, 'getMembership').mockResolvedValue(null);
    const handler = requirePermission('customers.read');
    const request = mockRequest();
    const reply = mockReply();

    await handler(request, reply);

    expect(reply.code).toHaveBeenCalledWith(403);
  });

  it('returns 403 when the member lacks the required permission', async () => {
    vi.spyOn(rbacRepository, 'getMembership').mockResolvedValue({
      organizationId: 'org-1',
      roleId: 6,
      roleName: 'MEMBER',
      status: 'ACTIVE',
    });
    vi.spyOn(rbacRepository, 'getRolePermissions').mockResolvedValue(new Set(['customers.read']));

    const handler = requirePermission('customers.delete');
    const request = mockRequest();
    const reply = mockReply();

    await handler(request, reply);

    expect(reply.code).toHaveBeenCalledWith(403);
  });

  it('attaches membership to the request and does not reply when permission is granted', async () => {
    vi.spyOn(rbacRepository, 'getMembership').mockResolvedValue({
      organizationId: 'org-1',
      roleId: 1,
      roleName: 'OWNER',
      status: 'ACTIVE',
    });
    vi.spyOn(rbacRepository, 'getRolePermissions').mockResolvedValue(
      new Set(['customers.read', 'customers.delete']),
    );

    const handler = requirePermission('customers.delete');
    const request = mockRequest();
    const reply = mockReply();

    await handler(request, reply);

    expect(reply.code).not.toHaveBeenCalled();
    expect(request.membership).toEqual({
      organizationId: 'org-1',
      roleId: 1,
      roleName: 'OWNER',
    });
  });
});
