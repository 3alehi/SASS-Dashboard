import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TaskPriorityBadge } from '@/pages/tasks/task-priority-badge';

describe('TaskPriorityBadge', () => {
  it('renders Urgent for URGENT priority', () => {
    render(<TaskPriorityBadge priority="URGENT" />);
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('renders Low for LOW priority', () => {
    render(<TaskPriorityBadge priority="LOW" />);
    expect(screen.getByText('Low')).toBeInTheDocument();
  });
});
