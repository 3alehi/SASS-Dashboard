import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuditActionBadge } from '@/pages/audit-logs/audit-action-badge';

describe('AuditActionBadge', () => {
  it('formats "customer.delete" as "Deleted customer"', () => {
    render(<AuditActionBadge action="customer.delete" />);
    expect(screen.getByText('Deleted customer')).toBeInTheDocument();
  });

  it('formats "team_member.role_change" as "Changed role team member"', () => {
    render(<AuditActionBadge action="team_member.role_change" />);
    expect(screen.getByText('Changed role team member')).toBeInTheDocument();
  });

  it('falls back to the raw action string for an unknown format', () => {
    render(<AuditActionBadge action="mystery" />);
    expect(screen.getByText('mystery')).toBeInTheDocument();
  });
});
