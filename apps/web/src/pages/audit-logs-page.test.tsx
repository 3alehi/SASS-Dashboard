import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditLogsPage } from '@/pages/audit-logs-page';
import * as auditLogService from '@/services/audit-log-service';
import * as meService from '@/services/me-service';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('AuditLogsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ session: {} as never, user: {} as never, isInitialized: true });
    useUiStore.setState({ activeOrganizationId: 'org-1' });
    vi.spyOn(meService, 'fetchMe').mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com',
      organizations: [
        {
          organizationId: 'org-1',
          organizationName: 'Acme',
          organizationSlug: 'acme',
          role: 'OWNER',
          permissions: ['settings.manage'],
        },
      ],
    });
  });

  it('renders the action, actor, and entity for each log row', async () => {
    vi.spyOn(auditLogService, 'fetchAuditLogs').mockResolvedValue({
      items: [
        {
          id: 'log-1',
          organizationId: 'org-1',
          actorId: 'user-1',
          actorName: 'Amir Owner',
          action: 'customer.delete',
          entityType: 'customer',
          entityId: '11111111-1111-1111-1111-111111111111',
          metadata: {},
          ipAddress: '127.0.0.1',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      page: 1,
      pageSize: 25,
      total: 1,
      totalPages: 1,
    });

    render(<AuditLogsPage />, { wrapper });

    expect(await screen.findByText('Amir Owner')).toBeInTheDocument();
    expect(screen.getByText('Deleted customer')).toBeInTheDocument();
    expect(screen.getByText('11111111')).toBeInTheDocument();
  });

  it('shows an empty state when there is no activity yet', async () => {
    vi.spyOn(auditLogService, 'fetchAuditLogs').mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 25,
      total: 0,
      totalPages: 1,
    });

    render(<AuditLogsPage />, { wrapper });

    expect(await screen.findByText('No activity yet')).toBeInTheDocument();
  });
});
