import type { NotificationListQuery, UpdateNotificationPreferencesInput } from '@nexora/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { usePermissions } from '@/hooks/use-permissions';
import { supabase } from '@/lib/supabase';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '@/services/notification-preferences-service';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications-service';

function useActiveOrganizationId(): string | undefined {
  return usePermissions().activeMembership?.organizationId;
}

export function useNotifications(query: Partial<NotificationListQuery>) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['notifications', organizationId, query],
    queryFn: () => fetchNotifications(organizationId!, query),
    enabled: Boolean(organizationId),
    placeholderData: (previousData) => previousData,
    staleTime: 15 * 1000,
  });
}

export function useUnreadNotificationCount() {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['notifications', organizationId, 'unread-count'],
    queryFn: () => fetchUnreadCount(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 15 * 1000,
  });
}

export function useMarkNotificationRead() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(organizationId!, notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', organizationId] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(organizationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', organizationId] });
    },
  });
}

/**
 * Subscribes to Supabase Realtime for new rows in `notifications` scoped to
 * the current user, so the bell badge and list update the instant the
 * server creates one — no polling. Only invalidates the cache (rather than
 * writing the payload directly into it) so the unread count and list stay
 * derived from one source of truth: the paginated/filtered query response.
 */
export function useNotificationsRealtime() {
  const organizationId = useActiveOrganizationId();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!organizationId || !user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', organizationId] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [organizationId, user, queryClient]);
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: fetchNotificationPreferences,
    staleTime: 60 * 1000,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateNotificationPreferencesInput) => updateNotificationPreferences(input),
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-preferences'], data);
    },
  });
}
