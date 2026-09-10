import { describe, expect, it } from 'vitest';

import { createCustomerSchema, customerListQuerySchema, updateCustomerSchema } from './customer.js';

describe('createCustomerSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = createCustomerSchema.safeParse({ name: 'Acme Inc' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('ACTIVE');
      expect(result.data.value).toBe(0);
    }
  });

  it('rejects an empty name', () => {
    const result = createCustomerSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = createCustomerSchema.safeParse({ name: 'Acme', email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('accepts an empty string email as optional', () => {
    const result = createCustomerSchema.safeParse({ name: 'Acme', email: '' });
    expect(result.success).toBe(true);
  });

  it('rejects a negative value', () => {
    const result = createCustomerSchema.safeParse({ name: 'Acme', value: -100 });
    expect(result.success).toBe(false);
  });

  it('coerces a numeric string value', () => {
    const result = createCustomerSchema.safeParse({ name: 'Acme', value: '1500' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(1500);
    }
  });
});

describe('updateCustomerSchema', () => {
  it('accepts a partial payload with a single field', () => {
    const result = updateCustomerSchema.safeParse({ status: 'INACTIVE' });
    expect(result.success).toBe(true);
  });

  it('accepts an empty object', () => {
    const result = updateCustomerSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('customerListQuerySchema', () => {
  it('applies defaults when no query params are given', () => {
    const result = customerListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
      expect(result.data.sortBy).toBe('createdAt');
      expect(result.data.sortDir).toBe('desc');
    }
  });

  it('rejects a pageSize above the max', () => {
    const result = customerListQuerySchema.safeParse({ pageSize: 1000 });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid sortBy value', () => {
    const result = customerListQuerySchema.safeParse({ sortBy: 'notAField' });
    expect(result.success).toBe(false);
  });
});
