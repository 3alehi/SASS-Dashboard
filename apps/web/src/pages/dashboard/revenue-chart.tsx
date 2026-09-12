import type { RevenueSeries } from '@nexora/shared';
import { format, parseISO } from 'date-fns';
import { TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsDarkMode } from '@/hooks/use-is-dark-mode';
import {
  CHART_AXIS_DARK,
  CHART_AXIS_LIGHT,
  CHART_CATEGORICAL_DARK,
  CHART_CATEGORICAL_LIGHT,
  CHART_GRID_DARK,
  CHART_GRID_LIGHT,
} from '@/lib/chart-colors';
import { ChartTooltipContent } from '@/pages/dashboard/chart-tooltip';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

interface RevenueChartProps {
  series: RevenueSeries | undefined;
  isLoading: boolean;
  compare: boolean;
}

export function RevenueChart({ series, isLoading, compare }: RevenueChartProps) {
  const isDark = useIsDarkMode();
  const categorical = isDark ? CHART_CATEGORICAL_DARK : CHART_CATEGORICAL_LIGHT;
  const gridColor = isDark ? CHART_GRID_DARK : CHART_GRID_LIGHT;
  const axisColor = isDark ? CHART_AXIS_DARK : CHART_AXIS_LIGHT;

  const data = useMemo(() => {
    if (!series) return [];
    return series.current.map((point, index) => ({
      date: point.date,
      current: point.value,
      previous: compare ? (series.previous[index]?.value ?? 0) : undefined,
    }));
  }, [series, compare]);

  if (isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }

  if (!series || data.length === 0 || data.every((point) => point.current === 0)) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No revenue in this period"
        description="Won deals in the selected date range will appear here."
        className="h-72"
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(value: string) => format(parseISO(value), 'MMM d')}
          stroke={axisColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={axisColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => formatCurrency(value)}
          width={72}
        />
        <Tooltip
          cursor={{ stroke: axisColor, strokeWidth: 1 }}
          content={({ active, payload, label }) => {
            if (!active || !payload || payload.length === 0) return null;
            const rows = payload
              .filter((entry) => entry.value !== undefined)
              .map((entry) => ({
                label: entry.dataKey === 'previous' ? 'Previous period' : 'Revenue',
                value: formatCurrency(Number(entry.value)),
                color: String(entry.color),
              }));
            return (
              <ChartTooltipContent
                title={format(parseISO(String(label)), 'MMM d, yyyy')}
                rows={rows}
              />
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="current"
          name="Revenue"
          stroke={categorical[0]}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
        />
        {compare && (
          <Line
            type="monotone"
            dataKey="previous"
            name="Previous period"
            stroke={axisColor}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
