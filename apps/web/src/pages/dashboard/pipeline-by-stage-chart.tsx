import type { StageValue } from '@nexora/shared';
import { KanbanSquare } from 'lucide-react';
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

interface PipelineByStageChartProps {
  stages: StageValue[] | undefined;
  isLoading: boolean;
}

export function PipelineByStageChart({ stages, isLoading }: PipelineByStageChartProps) {
  const isDark = useIsDarkMode();
  const categorical = isDark ? CHART_CATEGORICAL_DARK : CHART_CATEGORICAL_LIGHT;
  const gridColor = isDark ? CHART_GRID_DARK : CHART_GRID_LIGHT;
  const axisColor = isDark ? CHART_AXIS_DARK : CHART_AXIS_LIGHT;

  if (isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }

  if (!stages || stages.length === 0) {
    return (
      <EmptyState
        icon={KanbanSquare}
        title="No open deals"
        description="Open deal value grouped by stage will appear here."
        className="h-72"
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <BarChart data={stages} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="stageName"
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
          cursor={{ fill: gridColor, opacity: 0.4 }}
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const point = payload[0]!.payload as StageValue;
            return (
              <ChartTooltipContent
                title={point.stageName}
                rows={[
                  {
                    label: 'Open value',
                    value: formatCurrency(point.value),
                    color: categorical[0],
                  },
                  { label: 'Deal count', value: String(point.count), color: categorical[0] },
                ]}
              />
            );
          }}
        />
        <Bar
          dataKey="value"
          name="Open value"
          fill={categorical[0]}
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
