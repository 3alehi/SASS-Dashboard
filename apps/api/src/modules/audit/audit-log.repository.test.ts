import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabaseAdmin } from '@/lib/supabase-admin.js';
import { listAuditLogs } from '@/modules/audit/audit-log.repository.js';

function auditLogRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'log-1',
    organization_id: 'org-1',
    actor_id: 'user-1',
    action: 'customer.delete',
    entity_type: 'customer',
    entity_id: 'cust-1',
    metadata: {},
    ip_address: '127.0.0.1',
    created_at: '2024-01-01T00:00:00.000Z',
    profiles: { full_name: 'Amir Owner' },
    ...overrides,
  };
}

function makeQueryStub(result: { data: unknown; error?: unknown; count?: number | null }) {
  const builder: Record<string, (...args: unknown[]) => unknown> = {};
  const resolved = { data: result.data, error: result.error ?? null, count: result.count ?? null };
  const thenable = Promise.resolve(resolved);

  builder.select = () => builder;
  builder.eq = () => builder;
  builder.gte = () => builder;
  builder.lte = () => builder;
  builder.order = () => builder;
  builder.range = () => thenable;
  Object.assign(builder, { then: thenable.then.bind(thenable) });

  return builder;
}

describe('listAuditLogs', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps rows into camelCase AuditLog objects with the actor name unwrapped', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () => makeQueryStub({ data: [auditLogRow()], count: 1 }) as never,
    );

    const result = await listAuditLogs('org-1', {
      page: 1,
      pageSize: 25,
    } as never);

    expect(result.total).toBe(1);
    expect(result.items[0]).toEqual({
      id: 'log-1',
      organizationId: 'org-1',
      actorId: 'user-1',
      actorName: 'Amir Owner',
      action: 'customer.delete',
      entityType: 'customer',
      entityId: 'cust-1',
      metadata: {},
      ipAddress: '127.0.0.1',
      createdAt: '2024-01-01T00:00:00.000Z',
    });
  });

  it('throws when the query errors', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () => makeQueryStub({ data: null, error: new Error('boom') }) as never,
    );

    await expect(listAuditLogs('org-1', { page: 1, pageSize: 25 } as never)).rejects.toThrow(
      'Failed to list audit logs',
    );
  });
});
