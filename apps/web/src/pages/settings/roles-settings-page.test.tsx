import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RolesSettingsPage } from '@/pages/settings/roles-settings-page';
import * as meService from '@/services/me-service';
import * as rbacService from '@/services/rbac-service';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('RolesSettingsPage', () => {
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
    vi.spyOn(rbacService, 'fetchRoleMatrix').mockResolvedValue([
      { role: 'OWNER', permissions: ['customers.read', 'settings.manage'] },
      { role: 'MEMBER', permissions: [] },
    ]);
  });

  it('renders a column per role and marks granted permissions', async () => {
    render(<RolesSettingsPage />, { wrapper });

    expect(await screen.findByText('OWNER')).toBeInTheDocument();
    expect(screen.getByText('MEMBER')).toBeInTheDocument();
    expect(screen.getByText('customers.read')).toBeInTheDocument();
    expect(screen.getByText('settings.manage')).toBeInTheDocument();
  });
});
