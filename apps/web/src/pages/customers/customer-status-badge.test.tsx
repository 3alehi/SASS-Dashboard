import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CustomerStatusBadge } from '@/pages/customers/customer-status-badge';

describe('CustomerStatusBadge', () => {
  it('renders Active for ACTIVE status', () => {
    render(<CustomerStatusBadge status="ACTIVE" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders Archived for ARCHIVED status', () => {
    render(<CustomerStatusBadge status="ARCHIVED" />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });
});
