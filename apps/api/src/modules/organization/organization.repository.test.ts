import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabaseAdmin } from '@/lib/supabase-admin.js';
import {
  getOrganizationById,
  updateOrganization,
  updateOrganizationSettings,
} from '@/modules/organization/organization.repository.js';

function organizationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'org-1',
    name: 'Acme Inc',
    slug: 'acme',
    logo_url: null,
    industry: 'Software',
    size: '11-50',
    website: 'https://acme.example.com',
    billing_email: 'billing@acme.example.com',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeQueryStub(result: { data: unknown; error?: unknown }) {
  const builder: Record<string, (...args: unknown[]) => unknown> = {};
  const thenable = Promise.resolve({ data: result.data, error: result.error ?? null });

  builder.select = () => builder;
  builder.eq = () => builder;
  builder.is = () => builder;
  builder.update = () => builder;
  builder.upsert = () => builder;
  builder.maybeSingle = () => thenable;

  return builder;
}

describe('organization.repository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getOrganizationById maps a row into camelCase', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () => makeQueryStub({ data: organizationRow() }) as never,
    );

    const organization = await getOrganizationById('org-1');
    expect(organization).toEqual({
      id: 'org-1',
      name: 'Acme Inc',
      slug: 'acme',
      logoUrl: null,
      industry: 'Software',
      size: '11-50',
      website: 'https://acme.example.com',
      billingEmail: 'billing@acme.example.com',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });
  });

  it('getOrganizationById returns null when not found', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () => makeQueryStub({ data: null }) as never,
    );

    expect(await getOrganizationById('missing')).toBeNull();
  });

  it('updateOrganization converts an empty-string field to null', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () => makeQueryStub({ data: organizationRow({ website: null }) }) as never,
    );

    const result = await updateOrganization('org-1', { website: '' });
    expect(result?.website).toBeNull();
  });

  it('updateOrganizationSettings returns null on a query error', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () => makeQueryStub({ data: null, error: new Error('boom') }) as never,
    );

    expect(await updateOrganizationSettings('org-1', { dateFormat: 'DD/MM/YYYY' })).toBeNull();
  });
});
