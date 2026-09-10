import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TeamPage } from '@/pages/team-page';
import * as meService from '@/services/me-service';
import * as teamService from '@/services/team-service';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('TeamPage', () => {
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
          permissions: ['team.manage'],
        },
      ],
    });
    vi.spyOn(teamService, 'fetchTeamMembers').mockResolvedValue([
      {
        id: 'member-owner',
        organizationId: 'org-1',
        userId: 'user-1',
        fullName: 'Amir Owner',
        email: 'owner@example.com',
        role: 'OWNER',
        status: 'ACTIVE',
        invitedAt: null,
        joinedAt: '2024-01-01T00:00:00.000Z',
        deactivatedAt: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'member-sales',
        organizationId: 'org-1',
        userId: 'user-2',
        fullName: 'Sales Person',
        email: 'sales@example.com',
        role: 'SALES',
        status: 'ACTIVE',
        invitedAt: null,
        joinedAt: '2024-01-02T00:00:00.000Z',
        deactivatedAt: null,
        createdAt: '2024-01-02T00:00:00.000Z',
      },
    ]);
  });

  it("shows a locked Owner badge with no actions menu for the organization's owner", async () => {
    render(<TeamPage />, { wrapper });

    const ownerRow = (await screen.findByText('Amir Owner')).closest('tr');
    expect(ownerRow).not.toBeNull();
    expect(within(ownerRow!).getByText('Owner')).toBeInTheDocument();
    // No role <select> and no actions button for the owner's row.
    expect(within(ownerRow!).queryByRole('combobox')).not.toBeInTheDocument();
    expect(
      within(ownerRow!).queryByRole('button', { name: /member actions/i }),
    ).not.toBeInTheDocument();
  });

  it('shows an editable role selector and actions menu for a non-owner member', async () => {
    render(<TeamPage />, { wrapper });

    const salesRow = (await screen.findByText('Sales Person')).closest('tr');
    expect(salesRow).not.toBeNull();
    expect(within(salesRow!).getByRole('combobox')).toBeInTheDocument();
    expect(within(salesRow!).getByRole('button', { name: /member actions/i })).toBeInTheDocument();
  });
});
