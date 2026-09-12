import type { NotificationPreferences, UpdateNotificationPreferencesInput } from '@nexora/shared';

import { apiGet, apiPatch } from '@/services/api-client';

export function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  return apiGet<NotificationPreferences>('/me/notification-preferences');
}

export function updateNotificationPreferences(
  input: UpdateNotificationPreferencesInput,
): Promise<NotificationPreferences> {
  return apiPatch<NotificationPreferences>('/me/notification-preferences', input);
}
