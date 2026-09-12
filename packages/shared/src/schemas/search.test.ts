import { describe, expect, it } from 'vitest';

import { searchQuerySchema } from './search.js';

describe('searchQuerySchema', () => {
  it('applies the default limit', () => {
    const result = searchQuerySchema.safeParse({ q: 'acme' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(8);
    }
  });

  it('rejects an empty query', () => {
    const result = searchQuerySchema.safeParse({ q: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a limit above the max', () => {
    const result = searchQuerySchema.safeParse({ q: 'acme', limit: 50 });
    expect(result.success).toBe(false);
  });

  it('trims whitespace from the query', () => {
    const result = searchQuerySchema.safeParse({ q: '  acme  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe('acme');
    }
  });
});
