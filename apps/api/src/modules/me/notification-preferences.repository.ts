import {
  notificationPreferencesSchema,
  type NotificationPreferences,
  type UpdateNotificationPreferencesInput,
} from '@nexora/shared';

import { supabaseAdmin } from '@/lib/supabase-admin.js';

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const { data } = await supabaseAdmin
    .from('user_preferences')
    .select('notification_settings')
    .eq('user_id', userId)
    .maybeSingle();

  // Defaults fill in anything unset (including a brand-new user with no row
  // yet) via the schema's own .default(true) on every field.
  return notificationPreferencesSchema.parse(data?.notification_settings ?? {});
}

export async function updateNotificationPreferences(
  userId: string,
  input: UpdateNotificationPreferencesInput,
): Promise<NotificationPreferences> {
  const current = await getNotificationPreferences(userId);
  const merged = { ...current, ...input };

  await supabaseAdmin
    .from('user_preferences')
    .upsert({ user_id: userId, notification_settings: merged }, { onConflict: 'user_id' });

  return merged;
}
