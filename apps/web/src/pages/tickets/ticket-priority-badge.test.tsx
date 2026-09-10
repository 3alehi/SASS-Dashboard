import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TicketPriorityBadge } from '@/pages/tickets/ticket-priority-badge';

describe('TicketPriorityBadge', () => {
  it('renders Urgent for URGENT priority', () => {
    render(<TicketPriorityBadge priority="URGENT" />);
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });
});
