import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabaseAdmin } from '@/lib/supabase-admin.js';
import { globalSearch } from '@/modules/search/search.repository.js';

describe('globalSearch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps RPC rows into camelCase SearchResult objects', async () => {
    vi.spyOn(supabaseAdmin, 'rpc').mockResolvedValue({
      data: [
        {
          entity_type: 'customer',
          entity_id: 'cust-1',
          title: 'Acme Corp',
          subtitle: 'acme@example.com',
          rank: 0.8,
        },
        {
          entity_type: 'deal',
          entity_id: 'deal-1',
          title: 'Acme Renewal',
          subtitle: 'Acme Corp',
          rank: 0.6,
        },
      ],
      error: null,
    } as never);

    const results = await globalSearch('org-1', 'acme', 8);

    expect(results).toEqual([
      {
        entityType: 'customer',
        entityId: 'cust-1',
        title: 'Acme Corp',
        subtitle: 'acme@example.com',
        rank: 0.8,
      },
      {
        entityType: 'deal',
        entityId: 'deal-1',
        title: 'Acme Renewal',
        subtitle: 'Acme Corp',
        rank: 0.6,
      },
    ]);
  });

  it('returns an empty array on an RPC error rather than throwing', async () => {
    vi.spyOn(supabaseAdmin, 'rpc').mockResolvedValue({
      data: null,
      error: new Error('boom'),
    } as never);

    const results = await globalSearch('org-1', 'acme', 8);
    expect(results).toEqual([]);
  });

  it('passes the organization, query, and limit through to the RPC call', async () => {
    const rpcSpy = vi
      .spyOn(supabaseAdmin, 'rpc')
      .mockResolvedValue({ data: [], error: null } as never);

    await globalSearch('org-1', 'acme', 5);

    expect(rpcSpy).toHaveBeenCalledWith('global_search', {
      target_organization_id: 'org-1',
      search_query: 'acme',
      result_limit: 5,
    });
  });
});
