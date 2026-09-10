import type { Task } from '@nexora/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePermissions } from '@/hooks/use-permissions';
import { useToggleTaskComplete } from '@/hooks/use-tasks';
import * as meService from '@/services/me-service';
import * as tasksService from '@/services/tasks-service';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    organizationId: 'org-1',
    title: 'Follow up',
    description: null,
    status: 'OPEN',
    priority: 'MEDIUM',
    dueDate: null,
    completedAt: null,
    assigneeId: null,
    assigneeName: null,
    customerId: null,
    customerName: null,
    dealId: null,
    dealTitle: null,
    createdBy: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useToggleTaskComplete', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ session: {} as never, user: {} as never, isInitialized: true });
    useUiStore.setState({ activeOrganizationId: 'org-1' });
    vi.spyOn(meService, 'fetchMe').mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      organizations: [
        {
          organizationId: 'org-1',
          organizationName: 'Acme',
          organizationSlug: 'acme',
          role: 'OWNER',
          permissions: ['tasks.update'],
        },
      ],
    });
  });

  it('optimistically marks the task complete on the board before the request resolves', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const boardKey = ['tasks', 'org-1', 'board'];
    queryClient.setQueryData(boardKey, [makeTask({ status: 'OPEN' })]);

    let resolveUpdate!: (task: Task) => void;
    vi.spyOn(tasksService, 'updateTask').mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );

    const { result } = renderHook(
      () => ({ toggle: useToggleTaskComplete(), permissions: usePermissions() }),
      { wrapper: wrapperFor(queryClient) },
    );

    await waitFor(() =>
      expect(result.current.permissions.activeMembership?.organizationId).toBe('org-1'),
    );

    result.current.toggle.mutate({ taskId: 'task-1', completed: true });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Task[]>(boardKey);
      expect(cached?.[0]?.status).toBe('COMPLETED');
    });

    resolveUpdate(makeTask({ status: 'COMPLETED' }));
  });

  it('rolls back to OPEN when the server rejects the completion', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const boardKey = ['tasks', 'org-1', 'board'];
    queryClient.setQueryData(boardKey, [makeTask({ status: 'OPEN' })]);

    vi.spyOn(tasksService, 'updateTask').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => ({ toggle: useToggleTaskComplete(), permissions: usePermissions() }),
      { wrapper: wrapperFor(queryClient) },
    );

    await waitFor(() =>
      expect(result.current.permissions.activeMembership?.organizationId).toBe('org-1'),
    );

    result.current.toggle.mutate({ taskId: 'task-1', completed: true });

    await waitFor(() => expect(result.current.toggle.isError).toBe(true));

    const cached = queryClient.getQueryData<Task[]>(boardKey);
    expect(cached?.[0]?.status).toBe('OPEN');
  });
});
