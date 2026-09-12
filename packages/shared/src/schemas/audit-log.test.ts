import { describe, expect, it } from 'vitest';

import { auditLogListQuerySchema } from './audit-log.js';

describe('auditLogListQuerySchema', () => {
  it('applies defaults', () => {
    const result = auditLogListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(25);
    }
  });

  it('rejects a pageSize above the max', () => {
    const result = auditLogListQuerySchema.safeParse({ pageSize: 500 });
    expect(result.success).toBe(false);
  });

  it('accepts optional filters', () => {
    const result = auditLogListQuerySchema.safeParse({
      entityType: 'customer',
      action: 'customer.delete',
      actorId: '00000000-0000-0000-0000-000000000001',
    });
    expect(result.success).toBe(true);
  });
});
