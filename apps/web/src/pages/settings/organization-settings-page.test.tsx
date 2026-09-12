import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OrganizationSettingsPage } from '@/pages/settings/organization-settings-page';
import * as meService from '@/services/me-service';
import * as organizationService from '@/services/organization-service';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('OrganizationSettingsPage', () => {
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
    vi.spyOn(organizationService, 'fetchOrganization').mockResolvedValue({
      id: 'org-1',
      name: 'Acme Inc',
      slug: 'acme',
      logoUrl: null,
      industry: 'Software',
      size: '11-50',
      website: 'https://acme.example.com',
      billingEmail: 'billing@acme.example.com',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });
    vi.spyOn(organizationService, 'fetchOrganizationSettings').mockResolvedValue({
      organizationId: 'org-1',
      defaultCurrency: 'USD',
      fiscalYearStart: 1,
      dateFormat: 'MM/DD/YYYY',
    });
  });

  it('renders the organization name and workspace slug once loaded', async () => {
    render(<OrganizationSettingsPage />, { wrapper });

    expect(await screen.findByDisplayValue('Acme Inc')).toBeInTheDocument();
    expect(screen.getByDisplayValue('acme')).toBeInTheDocument();
    expect(screen.getByDisplayValue('acme')).toBeDisabled();
  });

  it('renders the default currency from organization settings', async () => {
    render(<OrganizationSettingsPage />, { wrapper });

    expect(await screen.findByDisplayValue('USD')).toBeInTheDocument();
  });
});
