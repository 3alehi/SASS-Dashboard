import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LeadStatusBadge } from '@/pages/leads/lead-status-badge';

describe('LeadStatusBadge', () => {
  it('renders New for NEW status', () => {
    render(<LeadStatusBadge status="NEW" />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders Won for WON status', () => {
    render(<LeadStatusBadge status="WON" />);
    expect(screen.getByText('Won')).toBeInTheDocument();
  });

  it('renders Lost for LOST status', () => {
    render(<LeadStatusBadge status="LOST" />);
    expect(screen.getByText('Lost')).toBeInTheDocument();
  });
});
