import { z } from 'zod';

export const NOTIFICATION_TYPES = [
  'TASK_ASSIGNED',
  'TASK_DUE',
  'DEAL_UPDATED',
  'LEAD_ASSIGNED',
  'TICKET_ASSIGNED',
  'TEAM_INVITATION',
  'MENTION',
  'SYSTEM',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const notificationSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(NOTIFICATION_TYPES),
  title: z.string(),
  body: z.string().nullable(),
  link: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type Notification = z.infer<typeof notificationSchema>;

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.coerce.boolean().default(false),
});
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;

export const unreadCountSchema = z.object({ count: z.number() });
export type UnreadCount = z.infer<typeof unreadCountSchema>;

/**
 * One toggle per notification type the product actually generates today.
 * TEAM_INVITATION is intentionally excluded — that email always sends via
 * Supabase Auth regardless of in-app preference, since it's how someone
 * without an account yet gets access at all.
 */
export const NOTIFICATION_PREFERENCE_KEYS = [
  'taskAssigned',
  'taskDue',
  'dealUpdated',
  'leadAssigned',
  'ticketAssigned',
  'mention',
] as const;
export type NotificationPreferenceKey = (typeof NOTIFICATION_PREFERENCE_KEYS)[number];

export const notificationPreferencesSchema = z.object({
  taskAssigned: z.boolean().default(true),
  taskDue: z.boolean().default(true),
  dealUpdated: z.boolean().default(true),
  leadAssigned: z.boolean().default(true),
  ticketAssigned: z.boolean().default(true),
  mention: z.boolean().default(true),
});
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

export const updateNotificationPreferencesSchema = notificationPreferencesSchema.partial();
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
