import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabaseAdmin } from '@/lib/supabase-admin.js';
import { exportEntityToCsv } from '@/modules/import-export/export.service.js';

function customerRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cust-1',
    organization_id: 'org-1',
    name: 'Acme Corp',
    company: 'Acme',
    email: 'acme@example.com',
    phone: null,
    website: null,
    status: 'ACTIVE',
    source: null,
    industry: null,
    value: 1000,
    owner_id: null,
    notes: null,
    last_activity_at: null,
    created_by: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    ...overrides,
  };
}

function makeQueryStub(result: { data: unknown; error?: unknown; count?: number | null }) {
  const builder: Record<string, (...args: unknown[]) => unknown> = {};
  const thenable = Promise.resolve({
    data: result.data,
    error: result.error ?? null,
    count: result.count ?? null,
  });

  builder.select = () => builder;
  builder.eq = () => builder;
  builder.is = () => builder;
  builder.ilike = () => builder;
  builder.or = () => builder;
  builder.order = () => builder;
  builder.range = () => thenable;

  return builder;
}

describe('exportEntityToCsv', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('produces a CSV header row plus one data row per customer', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () => makeQueryStub({ data: [customerRow()], count: 1 }) as never,
    );

    const csv = await exportEntityToCsv('org-1', 'customers');
    const lines = csv.trim().split('\n');

    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('Name');
    expect(lines[0]).toContain('Company');
    expect(lines[1]).toContain('Acme Corp');
  });

  it('produces only a header row when there are no customers', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () => makeQueryStub({ data: [], count: 0 }) as never,
    );

    const csv = await exportEntityToCsv('org-1', 'customers');
    const lines = csv.trim().split('\n');

    expect(lines).toHaveLength(1);
  });

  it('loops pages until every row has been fetched', async () => {
    const page1 = Array.from({ length: 100 }, (_, index) =>
      customerRow({ id: `cust-${index}`, name: `Customer ${index}` }),
    );
    const page2 = [customerRow({ id: 'cust-100', name: 'Customer 100' })];

    let callCount = 0;
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(() => {
      callCount += 1;
      const data = callCount === 1 ? page1 : page2;
      return makeQueryStub({ data, count: 101 }) as never;
    });

    const csv = await exportEntityToCsv('org-1', 'customers');
    const lines = csv.trim().split('\n');

    // 1 header + 101 data rows
    expect(lines).toHaveLength(102);
    expect(csv).toContain('Customer 100');
  });
});
