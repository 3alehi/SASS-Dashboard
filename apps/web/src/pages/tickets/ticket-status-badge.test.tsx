import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TicketStatusBadge } from '@/pages/tickets/ticket-status-badge';

describe('TicketStatusBadge', () => {
  it('renders Waiting for WAITING status', () => {
    render(<TicketStatusBadge status="WAITING" />);
    expect(screen.getByText('Waiting')).toBeInTheDocument();
  });

  it('renders Resolved for RESOLVED status', () => {
    render(<TicketStatusBadge status="RESOLVED" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });
});
