import { render, screen } from '@testing-library/react';
import { TrendingUp } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { KpiCard } from '@/pages/dashboard/kpi-card';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

describe('KpiCard', () => {
  it('shows a skeleton while loading', () => {
    const { container } = render(
      <KpiCard
        label="Revenue"
        icon={TrendingUp}
        kpi={undefined}
        isLoading
        format={formatCurrency}
      />,
    );
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders the formatted current value and a positive change as good when higherIsBetter', () => {
    render(
      <KpiCard
        label="Revenue"
        icon={TrendingUp}
        kpi={{ current: 15000, previous: 10000, changePercent: 50 }}
        isLoading={false}
        format={formatCurrency}
      />,
    );

    expect(screen.getByText('$15,000')).toBeInTheDocument();
    expect(screen.getByText('50.0% vs previous period')).toBeInTheDocument();
  });

  it('treats a rise in open tasks as bad when higherIsBetter is false', () => {
    render(
      <KpiCard
        label="Open tasks"
        icon={TrendingUp}
        kpi={{ current: 20, previous: 10, changePercent: 100 }}
        isLoading={false}
        format={(value) => String(value)}
        higherIsBetter={false}
      />,
    );

    const change = screen.getByText('100.0% vs previous period');
    expect(change).toHaveClass('text-destructive');
  });

  it('renders no change indicator when there is no previous period', () => {
    render(
      <KpiCard
        label="Pipeline value"
        icon={TrendingUp}
        kpi={{ current: 5000, previous: null, changePercent: null }}
        isLoading={false}
        format={formatCurrency}
      />,
    );

    expect(screen.queryByText(/vs previous period/)).not.toBeInTheDocument();
  });
});
