import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabaseAdmin } from '@/lib/supabase-admin.js';
import { getPipelineSummary } from '@/modules/deals/deals.repository.js';

function dealRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'deal-1',
    organization_id: 'org-1',
    title: 'Deal',
    customer_id: null,
    customers: null,
    pipeline_id: 'pipeline-1',
    stage_id: 'stage-open',
    owner_id: null,
    value: 1000,
    probability: 50,
    expected_close_date: null,
    closed_at: null,
    lead_id: null,
    notes: null,
    created_by: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    ...overrides,
  };
}

/**
 * Minimal chainable query-builder stub matching the subset of the
 * supabase-js fluent API deals.repository.ts actually calls
 * (.select/.eq/.is/.order resolving to {data, error}, or .eq resolving
 * directly for the two-arg stage lookup).
 */
function makeQueryStub(result: { data: unknown; error?: unknown }) {
  const builder: Record<string, (...args: unknown[]) => unknown> = {};
  const thenable = Promise.resolve({ data: result.data, error: result.error ?? null });

  builder.select = () => builder;
  builder.eq = () => builder;
  builder.is = () => builder;
  builder.order = () => thenable;
  // stage lookup path: select(...).eq(...) resolves directly (no .order call)
  Object.assign(builder, { then: thenable.then.bind(thenable) });

  return builder;
}

describe('getPipelineSummary', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('computes total, weighted, won, lost, open, and conversion rate correctly', async () => {
    const dealsResult = {
      data: [
        dealRow({ id: '1', stage_id: 'stage-open', value: 1000, probability: 50 }),
        dealRow({ id: '2', stage_id: 'stage-open', value: 2000, probability: 25 }),
        dealRow({ id: '3', stage_id: 'stage-won', value: 5000, probability: 100 }),
        dealRow({ id: '4', stage_id: 'stage-lost', value: 3000, probability: 0 }),
      ],
    };
    const stagesResult = {
      data: [
        { id: 'stage-open', kind: 'OPEN' },
        { id: 'stage-won', kind: 'WON' },
        { id: 'stage-lost', kind: 'LOST' },
      ],
    };

    vi.spyOn(supabaseAdmin, 'from').mockImplementation((table: string) => {
      if (table === 'deals') return makeQueryStub(dealsResult) as never;
      return makeQueryStub(stagesResult) as never;
    });

    const summary = await getPipelineSummary('org-1', 'pipeline-1');

    // open deals only: 1000 + 2000 = 3000 total; weighted = 1000*0.5 + 2000*0.25 = 1000
    expect(summary.totalValue).toBe(3000);
    expect(summary.weightedValue).toBe(1000);
    expect(summary.wonValue).toBe(5000);
    expect(summary.wonCount).toBe(1);
    expect(summary.lostCount).toBe(1);
    expect(summary.openCount).toBe(2);
    // 1 won / (1 won + 1 lost) = 50%
    expect(summary.conversionRate).toBe(50);
  });

  it('returns a 0% conversion rate when no deals are closed yet', async () => {
    const dealsResult = {
      data: [dealRow({ id: '1', stage_id: 'stage-open', value: 1000, probability: 50 })],
    };
    const stagesResult = { data: [{ id: 'stage-open', kind: 'OPEN' }] };

    vi.spyOn(supabaseAdmin, 'from').mockImplementation((table: string) => {
      if (table === 'deals') return makeQueryStub(dealsResult) as never;
      return makeQueryStub(stagesResult) as never;
    });

    const summary = await getPipelineSummary('org-1', 'pipeline-1');

    expect(summary.conversionRate).toBe(0);
    expect(summary.wonCount).toBe(0);
    expect(summary.lostCount).toBe(0);
  });
});
