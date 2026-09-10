import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MemberStatusBadge } from '@/pages/team/member-status-badge';

describe('MemberStatusBadge', () => {
  it('renders Invited for INVITED status', () => {
    render(<MemberStatusBadge status="INVITED" />);
    expect(screen.getByText('Invited')).toBeInTheDocument();
  });

  it('renders Deactivated for DEACTIVATED status', () => {
    render(<MemberStatusBadge status="DEACTIVATED" />);
    expect(screen.getByText('Deactivated')).toBeInTheDocument();
  });
});
