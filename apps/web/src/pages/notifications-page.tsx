import { Bell, CheckCheck } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/hooks/use-notifications';
import { NotificationItem } from '@/pages/notifications/notification-item';

const PAGE_SIZE = 20;

export function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, isLoading, isError, refetch } = useNotifications({
    page,
    pageSize: PAGE_SIZE,
    unreadOnly,
  });
  const { data: unread } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = unread?.count ?? 0;
  const notifications = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Everything that's happened across your organization, for you specifically."
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={() => markAllRead.mutate()}>
              <CheckCheck />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <Button
          variant={unreadOnly ? 'outline' : 'default'}
          size="sm"
          onClick={() => {
            setUnreadOnly(false);
            setPage(1);
          }}
        >
          All
        </Button>
        <Button
          variant={unreadOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setUnreadOnly(true);
            setPage(1);
          }}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </Button>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
          description="You'll see task assignments and other updates here."
        />
      ) : (
        <div className="rounded-lg border border-border">
          {notifications.map((notification, index) => (
            <div key={notification.id}>
              <NotificationItem notification={notification} onRead={(id) => markRead.mutate(id)} />
              {index < notifications.length - 1 && <div className="border-t border-border" />}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
