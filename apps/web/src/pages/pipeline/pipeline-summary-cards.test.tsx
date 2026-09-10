import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PipelineSummaryCards } from '@/pages/pipeline/pipeline-summary-cards';

describe('PipelineSummaryCards', () => {
  it('shows skeletons while loading', () => {
    const { container } = render(<PipelineSummaryCards isLoading summary={undefined} />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders formatted currency and percentage values', () => {
    render(
      <PipelineSummaryCards
        isLoading={false}
        summary={{
          totalValue: 12000,
          weightedValue: 6000,
          wonValue: 25000,
          wonCount: 3,
          lostCount: 1,
          openCount: 5,
          conversionRate: 75,
        }}
      />,
    );

    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(screen.getByText('$12,000')).toBeInTheDocument();
    expect(screen.getByText('$25,000')).toBeInTheDocument();
  });
});
