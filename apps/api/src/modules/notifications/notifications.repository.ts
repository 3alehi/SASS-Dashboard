import type { Notification, NotificationListQuery, NotificationType } from '@nexora/shared';

import { supabaseAdmin } from '@/lib/supabase-admin.js';

interface NotificationRow {
  id: string;
  organization_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export interface PaginatedNotifications {
  items: Notification[];
  total: number;
}

export async function listNotifications(
  organizationId: string,
  userId: string,
  query: NotificationListQuery,
): Promise<PaginatedNotifications> {
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  let request = supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .eq('user_id', userId);

  if (query.unreadOnly) {
    request = request.is('read_at', null);
  }

  const { data, error, count } = await request
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to list notifications: ${error.message}`);
  }

  return {
    items: (data ?? []).map((row) => toNotification(row as unknown as NotificationRow)),
    total: count ?? 0,
  };
}

export async function getUnreadCount(organizationId: string, userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) return 0;
  return count ?? 0;
}

export async function markNotificationRead(
  organizationId: string,
  userId: string,
  notificationId: string,
): Promise<Notification | null> {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('id', notificationId)
    .is('read_at', null)
    .select('*')
    .maybeSingle();

  if (error || !data) return null;
  return toNotification(data as unknown as NotificationRow);
}

export async function markAllNotificationsRead(
  organizationId: string,
  userId: string,
): Promise<void> {
  await supabaseAdmin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .is('read_at', null);
}

export interface CreateNotificationInput {
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
}

/**
 * Fire-and-forget by design: notification delivery is a side effect of a
 * primary action (e.g. assigning a task), never something its own failure
 * should roll back or surface to the caller. Errors are swallowed here —
 * callers use this without awaiting error handling.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  await supabaseAdmin.from('notifications').insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
  });
}
