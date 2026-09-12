import type { Notification } from '@nexora/shared';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { NotificationItem } from '@/pages/notifications/notification-item';

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'notif-1',
    organizationId: 'org-1',
    userId: 'user-1',
    type: 'TASK_ASSIGNED',
    title: 'You were assigned a task',
    body: 'Follow up with customer',
    link: '/app/tasks/task-1',
    readAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('NotificationItem', () => {
  it('shows an unread dot and calls onRead when clicked', () => {
    const onRead = vi.fn();
    render(
      <MemoryRouter>
        <NotificationItem notification={makeNotification()} onRead={onRead} />
      </MemoryRouter>,
    );

    expect(screen.getByText('You were assigned a task')).toBeInTheDocument();
    act(() => {
      screen.getByRole('button').click();
    });
    expect(onRead).toHaveBeenCalledWith('notif-1');
  });

  it('does not call onRead again for an already-read notification', () => {
    const onRead = vi.fn();
    render(
      <MemoryRouter>
        <NotificationItem
          notification={makeNotification({ readAt: new Date().toISOString() })}
          onRead={onRead}
        />
      </MemoryRouter>,
    );

    act(() => {
      screen.getByRole('button').click();
    });
    expect(onRead).not.toHaveBeenCalled();
  });
});
