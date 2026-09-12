import type { Notification } from '@nexora/shared';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Bell, CheckSquare, Handshake, Mail, Target, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { cn } from '@/lib/utils';

const TYPE_ICON: Record<Notification['type'], typeof Bell> = {
  TASK_ASSIGNED: CheckSquare,
  TASK_DUE: CheckSquare,
  DEAL_UPDATED: Handshake,
  LEAD_ASSIGNED: Target,
  TICKET_ASSIGNED: Mail,
  TEAM_INVITATION: UserPlus,
  MENTION: Users,
  SYSTEM: Bell,
};

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  className?: string;
}

export function NotificationItem({ notification, onRead, className }: NotificationItemProps) {
  const navigate = useNavigate();
  const Icon = TYPE_ICON[notification.type];
  const isUnread = !notification.readAt;

  function handleClick() {
    if (isUnread) onRead(notification.id);
    if (notification.link) navigate(notification.link);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent',
        className,
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUnread ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', isUnread ? 'font-medium text-foreground' : 'text-foreground')}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{notification.body}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDistanceToNow(parseISO(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />}
    </button>
  );
}
