import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Can } from '@/components/auth/can';
import * as meService from '@/services/me-service';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('Can', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ session: {} as never, user: {} as never, isInitialized: true });
    useUiStore.setState({ activeOrganizationId: null });
  });

  it('renders children when the user has the required permission', async () => {
    vi.spyOn(meService, 'fetchMe').mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      organizations: [
        {
          organizationId: 'org-1',
          organizationName: 'Acme',
          organizationSlug: 'acme',
          role: 'ADMIN',
          permissions: ['customers.delete'],
        },
      ],
    });

    render(
      <Can permission="customers.delete">
        <span>Delete button</span>
      </Can>,
      { wrapper },
    );

    expect(await screen.findByText('Delete button')).toBeInTheDocument();
  });

  it('renders the fallback when the user lacks the required permission', async () => {
    vi.spyOn(meService, 'fetchMe').mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      organizations: [
        {
          organizationId: 'org-1',
          organizationName: 'Acme',
          organizationSlug: 'acme',
          role: 'MEMBER',
          permissions: ['customers.read'],
        },
      ],
    });

    render(
      <Can permission="customers.delete" fallback={<span>No access</span>}>
        <span>Delete button</span>
      </Can>,
      { wrapper },
    );

    expect(await screen.findByText('No access')).toBeInTheDocument();
    expect(screen.queryByText('Delete button')).not.toBeInTheDocument();
  });
});
