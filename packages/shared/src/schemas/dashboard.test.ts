import { describe, expect, it } from 'vitest';

import { dashboardQuerySchema } from './dashboard.js';

describe('dashboardQuerySchema', () => {
  it('applies defaults', () => {
    const result = dashboardQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preset).toBe('30d');
      expect(result.data.compare).toBe(false);
    }
  });

  it('rejects an invalid preset', () => {
    const result = dashboardQuerySchema.safeParse({ preset: '6mo' });
    expect(result.success).toBe(false);
  });

  it('coerces the compare flag from a query string', () => {
    const result = dashboardQuerySchema.safeParse({ compare: 'true' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.compare).toBe(true);
    }
  });

  it('accepts a custom range with from/to', () => {
    const result = dashboardQuerySchema.safeParse({
      preset: 'custom',
      from: '2024-01-01',
      to: '2024-01-31',
    });
    expect(result.success).toBe(true);
  });
});
