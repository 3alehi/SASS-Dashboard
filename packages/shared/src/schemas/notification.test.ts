import { describe, expect, it } from 'vitest';

import { notificationListQuerySchema, notificationPreferencesSchema } from './notification.js';

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

describe('notificationPreferencesSchema', () => {
  it('defaults every preference to true when given an empty object', () => {
    const result = notificationPreferencesSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.taskAssigned).toBe(true);
      expect(result.data.mention).toBe(true);
    }
  });

  it('accepts a partial override with some preferences off', () => {
    const result = notificationPreferencesSchema.safeParse({ taskAssigned: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.taskAssigned).toBe(false);
      expect(result.data.leadAssigned).toBe(true);
    }
  });
});
