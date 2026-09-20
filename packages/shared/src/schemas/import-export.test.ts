import { describe, expect, it } from 'vitest';

import { importResultSchema } from './import-export.js';

describe('importResultSchema', () => {
  it('accepts a mix of successful and failed rows', () => {
    const result = importResultSchema.safeParse({
      totalRows: 2,
      successCount: 1,
      errorCount: 1,
      results: [
        { row: 1, success: true, id: '00000000-0000-0000-0000-000000000001', error: null },
        { row: 2, success: false, id: null, error: 'Name is required' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a negative row number', () => {
    const result = importResultSchema.safeParse({
      totalRows: 1,
      successCount: 0,
      errorCount: 1,
      results: [{ row: -1, success: false, id: null, error: 'boom' }],
    });
    expect(result.success).toBe(false);
  });
});
