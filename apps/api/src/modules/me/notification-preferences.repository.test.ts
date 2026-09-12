import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabaseAdmin } from '@/lib/supabase-admin.js';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/modules/me/notification-preferences.repository.js';

function makeSelectStub(result: { data: unknown }) {
  const builder: Record<string, (...args: unknown[]) => unknown> = {};
  builder.select = () => builder;
  builder.eq = () => builder;
  builder.maybeSingle = () => Promise.resolve({ data: result.data, error: null });
  return builder;
}

describe('notification-preferences.repository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getNotificationPreferences defaults every preference to true for a user with no row yet', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () => makeSelectStub({ data: null }) as never,
    );

    const preferences = await getNotificationPreferences('user-1');
    expect(preferences).toEqual({
      taskAssigned: true,
      taskDue: true,
      dealUpdated: true,
      leadAssigned: true,
      ticketAssigned: true,
      mention: true,
    });
  });

  it('getNotificationPreferences returns the stored overrides merged with defaults', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () =>
        makeSelectStub({ data: { notification_settings: { taskAssigned: false } } }) as never,
    );

    const preferences = await getNotificationPreferences('user-1');
    expect(preferences.taskAssigned).toBe(false);
    expect(preferences.mention).toBe(true);
  });

  it('updateNotificationPreferences merges the partial input onto the current preferences and upserts', async () => {
    const upsertSpy = vi.fn().mockReturnValue(Promise.resolve({ data: null, error: null }));

    vi.spyOn(supabaseAdmin, 'from').mockImplementation(
      () =>
        ({
          ...makeSelectStub({ data: { notification_settings: { taskAssigned: true } } }),
          upsert: upsertSpy,
        }) as never,
    );

    const result = await updateNotificationPreferences('user-1', { taskAssigned: false });

    expect(result.taskAssigned).toBe(false);
    expect(result.mention).toBe(true);
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        notification_settings: expect.objectContaining({ taskAssigned: false }),
      }),
      { onConflict: 'user_id' },
    );
  });
});
