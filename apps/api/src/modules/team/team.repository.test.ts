import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabaseAdmin } from '@/lib/supabase-admin.js';
import { isLastActiveOwner } from '@/modules/team/team.repository.js';

function makeMemberQueryStub(member: { status: string; roleName: string } | null) {
  return {
    select: () => ({
      eq: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: member ? { status: member.status, roles: { name: member.roleName } } : null,
              error: null,
            }),
        }),
      }),
    }),
  };
}

function makeCountQueryStub(count: number) {
  const builder: Record<string, unknown> = {};
  builder.select = () => builder;
  builder.eq = () => builder;
  Object.assign(builder, {
    then: Promise.resolve({ count, error: null }).then.bind(
      Promise.resolve({ count, error: null }),
    ),
  });
  return builder;
}

describe('isLastActiveOwner', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when the member is not an OWNER', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () => makeMemberQueryStub({ status: 'ACTIVE', roleName: 'ADMIN' }) as never,
    );

    const result = await isLastActiveOwner('org-1', 'member-1');
    expect(result).toBe(false);
  });

  it('returns false when the member is an inactive OWNER', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () => makeMemberQueryStub({ status: 'DEACTIVATED', roleName: 'OWNER' }) as never,
    );

    const result = await isLastActiveOwner('org-1', 'member-1');
    expect(result).toBe(false);
  });

  it('returns false when the member does not exist', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(() => makeMemberQueryStub(null) as never);

    const result = await isLastActiveOwner('org-1', 'member-1');
    expect(result).toBe(false);
  });

  it('returns true when the member is the sole active OWNER', async () => {
    let call = 0;
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(() => {
      call += 1;
      if (call === 1) return makeMemberQueryStub({ status: 'ACTIVE', roleName: 'OWNER' }) as never;
      return makeCountQueryStub(1) as never;
    });

    const result = await isLastActiveOwner('org-1', 'member-1');
    expect(result).toBe(true);
  });

  it('returns false when the member is an OWNER but other active owners exist', async () => {
    let call = 0;
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(() => {
      call += 1;
      if (call === 1) return makeMemberQueryStub({ status: 'ACTIVE', roleName: 'OWNER' }) as never;
      return makeCountQueryStub(2) as never;
    });

    const result = await isLastActiveOwner('org-1', 'member-1');
    expect(result).toBe(false);
  });
});
