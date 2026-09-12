import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabaseAdmin } from '@/lib/supabase-admin.js';
import { getRoleMatrix } from '@/modules/rbac/rbac.repository.js';

function makeQueryStub(result: { data: unknown; error?: unknown }) {
  const builder: Record<string, (...args: unknown[]) => unknown> = {};
  const thenable = Promise.resolve({ data: result.data, error: result.error ?? null });

  builder.select = () => builder;
  builder.order = () => thenable;
  Object.assign(builder, { then: thenable.then.bind(thenable) });

  return builder;
}

describe('getRoleMatrix', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('groups permission grants by role, in role id order', async () => {
    const rolesResult = {
      data: [
        { id: 1, name: 'OWNER' },
        { id: 6, name: 'MEMBER' },
      ],
    };
    const grantsResult = {
      data: [
        { role_id: 1, permissions: { key: 'customers.read' } },
        { role_id: 1, permissions: { key: 'settings.manage' } },
      ],
    };

    vi.spyOn(supabaseAdmin, 'from').mockImplementation((table: string) => {
      if (table === 'roles') return makeQueryStub(rolesResult) as never;
      return makeQueryStub(grantsResult) as never;
    });

    const matrix = await getRoleMatrix();

    expect(matrix).toEqual([
      { role: 'OWNER', permissions: ['customers.read', 'settings.manage'] },
      { role: 'MEMBER', permissions: [] },
    ]);
  });

  it('returns an empty array when the roles query fails', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () => makeQueryStub({ data: null, error: new Error('boom') }) as never,
    );

    expect(await getRoleMatrix()).toEqual([]);
  });
});
