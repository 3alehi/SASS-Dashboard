import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabaseAdmin } from '@/lib/supabase-admin.js';
import {
  createNotification,
  getUnreadCount,
  markNotificationRead,
} from '@/modules/notifications/notifications.repository.js';

function notificationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'notif-1',
    organization_id: 'org-1',
    user_id: 'user-1',
    type: 'TASK_ASSIGNED',
    title: 'You were assigned a task',
    body: 'Follow up with customer',
    link: '/app/tasks/task-1',
    read_at: null,
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/**
 * Minimal chainable query-builder stub matching the subset of the
 * supabase-js fluent API notifications.repository.ts calls.
 */
function makeQueryStub(result: { data: unknown; error?: unknown; count?: number | null }) {
  const builder: Record<string, (...args: unknown[]) => unknown> = {};
  const resolved = {
    data: result.data,
    error: result.error ?? null,
    count: result.count ?? null,
  };
  const thenable = Promise.resolve(resolved);

  builder.select = () => builder;
  builder.eq = () => builder;
  builder.is = () => builder;
  builder.update = () => builder;
  builder.insert = () => thenable;
  builder.maybeSingle = () => thenable;
  Object.assign(builder, { then: thenable.then.bind(thenable) });

  return builder;
}

describe('notifications.repository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getUnreadCount returns the count from the head-only query', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () => makeQueryStub({ data: null, count: 4 }) as never,
    );

    const count = await getUnreadCount('org-1', 'user-1');
    expect(count).toBe(4);
  });

  it('getUnreadCount returns 0 on a query error rather than throwing', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () => makeQueryStub({ data: null, error: new Error('boom') }) as never,
    );

    const count = await getUnreadCount('org-1', 'user-1');
    expect(count).toBe(0);
  });

  it('markNotificationRead returns the updated notification when found', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () =>
        makeQueryStub({ data: notificationRow({ read_at: '2024-01-02T00:00:00.000Z' }) }) as never,
    );

    const result = await markNotificationRead('org-1', 'user-1', 'notif-1');
    expect(result?.readAt).toBe('2024-01-02T00:00:00.000Z');
  });

  it('markNotificationRead returns null when no matching unread row exists', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () => makeQueryStub({ data: null }) as never,
    );

    const result = await markNotificationRead('org-1', 'user-1', 'notif-missing');
    expect(result).toBeNull();
  });

  it('createNotification inserts a row scoped to the organization and target user', async () => {
    const insertSpy = vi.fn().mockReturnValue(Promise.resolve({ data: null, error: null }));
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(() => ({ insert: insertSpy }) as never);

    await createNotification({
      organizationId: 'org-1',
      userId: 'user-2',
      type: 'TASK_ASSIGNED',
      title: 'You were assigned a task',
      body: 'Follow up',
      link: '/app/tasks/task-1',
    });

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        user_id: 'user-2',
        type: 'TASK_ASSIGNED',
      }),
    );
  });
});
