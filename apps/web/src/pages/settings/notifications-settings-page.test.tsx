import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationsSettingsPage } from '@/pages/settings/notifications-settings-page';
import * as notificationPreferencesService from '@/services/notification-preferences-service';

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('NotificationsSettingsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a switch per preference, reflecting the fetched state', async () => {
    vi.spyOn(notificationPreferencesService, 'fetchNotificationPreferences').mockResolvedValue({
      taskAssigned: false,
      taskDue: true,
      dealUpdated: true,
      leadAssigned: true,
      ticketAssigned: true,
      mention: true,
    });

    render(<NotificationsSettingsPage />, { wrapper });

    const taskAssignedSwitch = await screen.findByLabelText('Task assigned');
    expect(taskAssignedSwitch).toHaveAttribute('data-state', 'unchecked');

    const mentionSwitch = screen.getByLabelText('Mentions');
    expect(mentionSwitch).toHaveAttribute('data-state', 'checked');
  });

  it('calls updateNotificationPreferences with the toggled key when a switch is clicked', async () => {
    vi.spyOn(notificationPreferencesService, 'fetchNotificationPreferences').mockResolvedValue({
      taskAssigned: true,
      taskDue: true,
      dealUpdated: true,
      leadAssigned: true,
      ticketAssigned: true,
      mention: true,
    });
    const updateSpy = vi
      .spyOn(notificationPreferencesService, 'updateNotificationPreferences')
      .mockResolvedValue({
        taskAssigned: false,
        taskDue: true,
        dealUpdated: true,
        leadAssigned: true,
        ticketAssigned: true,
        mention: true,
      });

    render(<NotificationsSettingsPage />, { wrapper });

    const taskAssignedSwitch = await screen.findByLabelText('Task assigned');
    await act(async () => {
      fireEvent.click(taskAssignedSwitch);
    });

    expect(updateSpy).toHaveBeenCalledWith({ taskAssigned: false });
  });
});
