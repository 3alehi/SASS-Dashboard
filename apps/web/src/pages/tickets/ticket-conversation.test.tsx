import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TicketConversation } from '@/pages/tickets/ticket-conversation';
import * as meService from '@/services/me-service';
import * as ticketsService from '@/services/tickets-service';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('TicketConversation', () => {
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
          role: 'SUPPORT',
          permissions: ['tickets.update'],
        },
      ],
    });
  });

  it('visually marks internal notes as distinct from customer-facing replies', async () => {
    vi.spyOn(ticketsService, 'fetchTicketMessages').mockResolvedValue([
      {
        id: 'msg-1',
        organizationId: 'org-1',
        ticketId: 'ticket-1',
        authorId: 'agent-1',
        authorName: 'Support Agent',
        body: 'Thanks for reaching out, looking into this now.',
        isInternal: false,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'msg-2',
        organizationId: 'org-1',
        ticketId: 'ticket-1',
        authorId: 'agent-2',
        authorName: 'Senior Agent',
        body: 'This looks like the billing bug from last week.',
        isInternal: true,
        createdAt: '2024-01-01T00:05:00.000Z',
      },
    ]);

    render(<TicketConversation ticketId="ticket-1" />, { wrapper });

    const customerFacingMessage = await screen.findByText(
      'Thanks for reaching out, looking into this now.',
    );
    const internalMessage = screen.getByText('This looks like the billing bug from last week.');
    expect(customerFacingMessage).toBeInTheDocument();
    expect(internalMessage).toBeInTheDocument();

    // The customer-facing message's card has no "Internal note" indicator...
    const customerFacingCard = customerFacingMessage.closest('.p-4');
    expect(customerFacingCard).not.toBeNull();
    expect(customerFacingCard!.textContent).not.toContain('Internal note');

    // ...while the internal note's card does.
    const internalCard = internalMessage.closest('.p-4');
    expect(internalCard).not.toBeNull();
    expect(internalCard!.textContent).toContain('Internal note');
  });
});
