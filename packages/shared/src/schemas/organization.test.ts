import { describe, expect, it } from 'vitest';

import { updateOrganizationSchema, updateOrganizationSettingsSchema } from './organization.js';

describe('updateOrganizationSchema', () => {
  it('accepts a partial update with just a name', () => {
    const result = updateOrganizationSchema.safeParse({ name: 'Acme Inc' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = updateOrganizationSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid website URL', () => {
    const result = updateOrganizationSchema.safeParse({ website: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('allows clearing an optional field with an empty string', () => {
    const result = updateOrganizationSchema.safeParse({ website: '' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid billing email', () => {
    const result = updateOrganizationSchema.safeParse({ billingEmail: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});

describe('updateOrganizationSettingsSchema', () => {
  it('accepts a partial update', () => {
    const result = updateOrganizationSettingsSchema.safeParse({ dateFormat: 'DD/MM/YYYY' });
    expect(result.success).toBe(true);
  });

  it('rejects a currency code that is not 3 letters', () => {
    const result = updateOrganizationSettingsSchema.safeParse({ defaultCurrency: 'US' });
    expect(result.success).toBe(false);
  });

  it('rejects a fiscalYearStart outside 1-12', () => {
    const result = updateOrganizationSettingsSchema.safeParse({ fiscalYearStart: 13 });
    expect(result.success).toBe(false);
  });
});
