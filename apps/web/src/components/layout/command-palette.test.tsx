import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CommandPalette } from '@/components/layout/command-palette';
import * as meService from '@/services/me-service';
import * as searchService from '@/services/search-service';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ session: {} as never, user: {} as never, isInitialized: true });
    useUiStore.setState({
      activeOrganizationId: 'org-1',
      commandPaletteOpen: true,
      theme: 'light',
    });
    vi.spyOn(meService, 'fetchMe').mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com',
      organizations: [
        {
          organizationId: 'org-1',
          organizationName: 'Acme',
          organizationSlug: 'acme',
          role: 'OWNER',
          permissions: ['customers.read', 'leads.read', 'deals.read', 'tasks.read', 'tickets.read'],
        },
      ],
    });
  });

  it('shows only static commands with an empty query', async () => {
    render(<CommandPalette />, { wrapper });
    expect(await screen.findByText('Create customer')).toBeInTheDocument();
  });

  it('shows ranked search results ahead of static commands once a query is typed', async () => {
    const searchSpy = vi
      .spyOn(searchService, 'searchOrganization')
      .mockResolvedValue([
        {
          entityType: 'customer',
          entityId: 'cust-1',
          title: 'Acme Corp',
          subtitle: 'acme@example.com',
          rank: 0.8,
        },
      ]);

    render(<CommandPalette />, { wrapper });
    const input = await screen.findByPlaceholderText('Type a command or search…');

    fireEvent.change(input, { target: { value: 'acme' } });

    await waitFor(() => expect(searchSpy).toHaveBeenCalled(), { timeout: 2000 });
    expect(await screen.findByText('Acme Corp')).toBeInTheDocument();
  });
});
