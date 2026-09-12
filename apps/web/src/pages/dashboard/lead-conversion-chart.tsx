import type { LeadConversionStage } from '@nexora/shared';
import { Filter } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsDarkMode } from '@/hooks/use-is-dark-mode';
import {
  CHART_AXIS_DARK,
  CHART_AXIS_LIGHT,
  CHART_GRID_DARK,
  CHART_GRID_LIGHT,
  CHART_SEQUENTIAL_BLUE,
} from '@/lib/chart-colors';
import { ChartTooltipContent } from '@/pages/dashboard/chart-tooltip';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  CONVERTED: 'Converted',
};

interface LeadConversionChartProps {
  stages: LeadConversionStage[] | undefined;
  isLoading: boolean;
}

export function LeadConversionChart({ stages, isLoading }: LeadConversionChartProps) {
  const isDark = useIsDarkMode();
  const gridColor = isDark ? CHART_GRID_DARK : CHART_GRID_LIGHT;
  const axisColor = isDark ? CHART_AXIS_DARK : CHART_AXIS_LIGHT;
  // Deepest step of the sequential ramp reads clearly against both surfaces.
  const barColor = CHART_SEQUENTIAL_BLUE[3];

  if (isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }

  if (!stages || stages.every((stage) => stage.count === 0)) {
    return (
      <EmptyState
        icon={Filter}
        title="No leads in this period"
        description="Lead counts by funnel stage will appear here."
        className="h-72"
      />
    );
  }

  const data = stages.map((stage) => ({
    ...stage,
    label: STATUS_LABELS[stage.status] ?? stage.status,
  }));

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
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          stroke={axisColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={88}
        />
        <Tooltip
          cursor={{ fill: gridColor, opacity: 0.4 }}
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const point = payload[0]!.payload as { label: string; count: number };
            return (
              <ChartTooltipContent
                title={point.label}
                rows={[{ label: 'Leads', value: String(point.count), color: barColor }]}
              />
            );
          }}
        />
        <Bar dataKey="count" name="Leads" fill={barColor} radius={[0, 4, 4, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
