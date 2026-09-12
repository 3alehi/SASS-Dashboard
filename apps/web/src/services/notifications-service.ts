import type {
  Notification,
  NotificationListQuery,
  PaginatedResult,
  UnreadCount,
} from '@nexora/shared';

import { apiGet, apiPost } from '@/services/api-client';

function basePath(organizationId: string): string {
  return `/organizations/${organizationId}/notifications`;
}

export function fetchNotifications(
  organizationId: string,
  query: Partial<NotificationListQuery>,
): Promise<PaginatedResult<Notification>> {
  return apiGet<PaginatedResult<Notification>>(basePath(organizationId), {
    page: query.page,
    pageSize: query.pageSize,
    unreadOnly: query.unreadOnly ? 'true' : undefined,
  });
}

export function fetchUnreadCount(organizationId: string): Promise<UnreadCount> {
  return apiGet<UnreadCount>(`${basePath(organizationId)}/unread-count`);
}

export function markNotificationRead(
  organizationId: string,
  notificationId: string,
): Promise<Notification> {
  return apiPost<Notification>(`${basePath(organizationId)}/${notificationId}/read`);
}

export function markAllNotificationsRead(organizationId: string): Promise<{ ok: true }> {
  return apiPost<{ ok: true }>(`${basePath(organizationId)}/read-all`);
}
