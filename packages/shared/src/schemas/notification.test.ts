import { describe, expect, it } from 'vitest';

import { notificationListQuerySchema } from './notification.js';

describe('notificationListQuerySchema', () => {
  it('applies defaults', () => {
    const result = notificationListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
      expect(result.data.unreadOnly).toBe(false);
    }
  });

  it('coerces unreadOnly from a query string', () => {
    const result = notificationListQuerySchema.safeParse({ unreadOnly: 'true' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unreadOnly).toBe(true);
    }
  });

  it('rejects a pageSize above the max', () => {
    const result = notificationListQuerySchema.safeParse({ pageSize: 500 });
    expect(result.success).toBe(false);
  });
});
