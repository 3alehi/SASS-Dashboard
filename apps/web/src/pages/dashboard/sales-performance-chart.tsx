import type { SalesPerformanceEntry } from '@nexora/shared';
import { Trophy } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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

interface SalesPerformanceChartProps {
  entries: SalesPerformanceEntry[] | undefined;
  isLoading: boolean;
}

export function SalesPerformanceChart({ entries, isLoading }: SalesPerformanceChartProps) {
  const isDark = useIsDarkMode();
  const categorical = isDark ? CHART_CATEGORICAL_DARK : CHART_CATEGORICAL_LIGHT;
  const gridColor = isDark ? CHART_GRID_DARK : CHART_GRID_LIGHT;
  const axisColor = isDark ? CHART_AXIS_DARK : CHART_AXIS_LIGHT;

  if (isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }

  if (!entries || entries.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No won deals in this period"
        description="Won deal value grouped by owner will appear here."
        className="h-72"
      />
    );
  }

  const data = entries.slice(0, 8);

  return (
    <ResponsiveContainer width="100%" height={288}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={gridColor} horizontal={false} />
        <XAxis
          type="number"
          stroke={axisColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => formatCurrency(value)}
        />
        <YAxis
          type="category"
          dataKey="ownerName"
          stroke={axisColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={104}
        />
        <Tooltip
          cursor={{ fill: gridColor, opacity: 0.4 }}
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const point = payload[0]!.payload as SalesPerformanceEntry;
            return (
              <ChartTooltipContent
                title={point.ownerName}
                rows={[
                  {
                    label: 'Won value',
                    value: formatCurrency(point.wonValue),
                    color: categorical[0],
                  },
                  { label: 'Deals won', value: String(point.dealCount), color: categorical[0] },
                ]}
              />
            );
          }}
        />
        <Bar
          dataKey="wonValue"
          name="Won value"
          fill={categorical[0]}
          radius={[0, 4, 4, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
