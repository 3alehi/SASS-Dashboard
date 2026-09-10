import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TaskStatusBadge } from '@/pages/tasks/task-status-badge';

describe('TaskStatusBadge', () => {
  it('renders In Progress for IN_PROGRESS status', () => {
    render(<TaskStatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders Completed for COMPLETED status', () => {
    render(<TaskStatusBadge status="COMPLETED" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});
