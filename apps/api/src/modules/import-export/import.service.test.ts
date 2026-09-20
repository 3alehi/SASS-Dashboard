import type { Customer } from '@nexora/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as customersRepository from '@/modules/customers/customers.repository.js';
import * as leadsRepository from '@/modules/leads/leads.repository.js';
import { importEntityFromCsv } from '@/modules/import-export/import.service.js';

function customer(overrides: Partial<Customer> = {}) {
  return {
    id: 'cust-1',
    organizationId: 'org-1',
    name: 'Acme Corp',
    company: null,
    email: null,
    phone: null,
    website: null,
    status: 'ACTIVE' as const,
    source: null,
    industry: null,
    value: 0,
    ownerId: null,
    notes: null,
    lastActivityAt: null,
    createdBy: 'user-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

describe('importEntityFromCsv', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates one customer per data row and reports success', async () => {
    const createSpy = vi
      .spyOn(customersRepository, 'createCustomer')
      .mockResolvedValue(customer());

    const csv = 'Name,Company,Email\nAcme Corp,Acme,acme@example.com\n';
    const result = await importEntityFromCsv('org-1', 'user-1', 'customers', csv);

    expect(result.totalRows).toBe(1);
    expect(result.successCount).toBe(1);
    expect(result.errorCount).toBe(0);
    expect(result.results[0]).toEqual({ row: 2, success: true, id: 'cust-1', error: null });
    expect(createSpy).toHaveBeenCalledWith(
      'org-1',
      'user-1',
      expect.objectContaining({ name: 'Acme Corp', company: 'Acme', email: 'acme@example.com' }),
    );
  });

  it('records a per-row validation error without aborting the rest of the file', async () => {
    vi.spyOn(customersRepository, 'createCustomer').mockResolvedValue(customer());

    const csv = 'Name,Email\n,bad-email\nAcme Corp,acme@example.com\n';
    const result = await importEntityFromCsv('org-1', 'user-1', 'customers', csv);

    expect(result.totalRows).toBe(2);
    expect(result.successCount).toBe(1);
    expect(result.errorCount).toBe(1);
    expect(result.results[0]!.success).toBe(false);
    expect(result.results[0]!.error).toContain('name');
    expect(result.results[1]!.success).toBe(true);
  });

  it('matches columns case-insensitively and accepts the raw field name as a fallback', async () => {
    const createSpy = vi
      .spyOn(customersRepository, 'createCustomer')
      .mockResolvedValue(customer());

    const csv = 'name,company\nAcme Corp,Acme\n';
    await importEntityFromCsv('org-1', 'user-1', 'customers', csv);

    expect(createSpy).toHaveBeenCalledWith(
      'org-1',
      'user-1',
      expect.objectContaining({ name: 'Acme Corp' }),
    );
  });

  it('imports leads using the Full Name column', async () => {
    const createLeadSpy = vi.spyOn(leadsRepository, 'createLead').mockResolvedValue({
      id: 'lead-1',
      organizationId: 'org-1',
      fullName: 'Jane Doe',
      company: null,
      email: null,
      phone: null,
      status: 'NEW',
      source: null,
      value: null,
      ownerId: null,
      notes: null,
      convertedCustomerId: null,
      convertedAt: null,
      createdBy: 'user-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      deletedAt: null,
    });

    const csv = 'Full Name,Email\nJane Doe,jane@example.com\n';
    const result = await importEntityFromCsv('org-1', 'user-1', 'leads', csv);

    expect(result.successCount).toBe(1);
    expect(createLeadSpy).toHaveBeenCalledWith(
      'org-1',
      'user-1',
      expect.objectContaining({ fullName: 'Jane Doe' }),
    );
  });

  it('throws a clear error when the file has more rows than the maximum', async () => {
    const header = 'Name\n';
    const rows = Array.from({ length: 2001 }, (_, index) => `Customer ${index}\n`).join('');

    await expect(importEntityFromCsv('org-1', 'user-1', 'customers', header + rows)).rejects.toThrow(
      /maximum/,
    );
  });
});
