import type { Deal } from '@nexora/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMoveDeal } from '@/hooks/use-deals';
import { usePermissions } from '@/hooks/use-permissions';
import * as dealsService from '@/services/deals-service';
import * as meService from '@/services/me-service';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

function makeDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'deal-1',
    organizationId: 'org-1',
    title: 'Deal',
    customerId: null,
    customerName: null,
    pipelineId: 'pipeline-1',
    stageId: 'stage-open',
    ownerId: null,
    value: 1000,
    probability: 50,
    expectedCloseDate: null,
    closedAt: null,
    leadId: null,
    notes: null,
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

describe('useMoveDeal', () => {
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
          permissions: ['deals.update'],
        },
      ],
    });
  });

  it('optimistically updates the cached deal stage before the request resolves', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const queryKey = ['deals', 'org-1', 'pipeline', 'pipeline-1'];
    queryClient.setQueryData(queryKey, [makeDeal({ stageId: 'stage-open' })]);

    let resolveMove!: (deal: Deal) => void;
    vi.spyOn(dealsService, 'moveDeal').mockReturnValue(
      new Promise((resolve) => {
        resolveMove = resolve;
      }),
    );

    const { result } = renderHook(() => ({ move: useMoveDeal(), permissions: usePermissions() }), {
      wrapper: wrapperFor(queryClient),
    });

    await waitFor(() =>
      expect(result.current.permissions.activeMembership?.organizationId).toBe('org-1'),
    );

    result.current.move.mutate({
      dealId: 'deal-1',
      stageId: 'stage-won',
      pipelineId: 'pipeline-1',
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Deal[]>(queryKey);
      expect(cached?.[0]?.stageId).toBe('stage-won');
    });

    resolveMove(makeDeal({ stageId: 'stage-won' }));
  });

  it('rolls back the cache to the pre-drag snapshot when the request fails', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const queryKey = ['deals', 'org-1', 'pipeline', 'pipeline-1'];
    queryClient.setQueryData(queryKey, [makeDeal({ stageId: 'stage-open' })]);

    vi.spyOn(dealsService, 'moveDeal').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => ({ move: useMoveDeal(), permissions: usePermissions() }), {
      wrapper: wrapperFor(queryClient),
    });

    await waitFor(() =>
      expect(result.current.permissions.activeMembership?.organizationId).toBe('org-1'),
    );

    result.current.move.mutate({
      dealId: 'deal-1',
      stageId: 'stage-won',
      pipelineId: 'pipeline-1',
    });

    await waitFor(() => expect(result.current.move.isError).toBe(true));

    const cached = queryClient.getQueryData<Deal[]>(queryKey);
    expect(cached?.[0]?.stageId).toBe('stage-open');
  });
});
