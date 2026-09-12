import type { WonLostPoint } from '@nexora/shared';
import { format, parseISO } from 'date-fns';
import { Scale } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
  CHART_GRID_DARK,
  CHART_GRID_LIGHT,
  CHART_STATUS,
} from '@/lib/chart-colors';
import { ChartTooltipContent } from '@/pages/dashboard/chart-tooltip';

interface WonLostChartProps {
  points: WonLostPoint[] | undefined;
  isLoading: boolean;
}

export function WonLostChart({ points, isLoading }: WonLostChartProps) {
  const isDark = useIsDarkMode();
  const gridColor = isDark ? CHART_GRID_DARK : CHART_GRID_LIGHT;
  const axisColor = isDark ? CHART_AXIS_DARK : CHART_AXIS_LIGHT;
  const goodColor = isDark ? CHART_STATUS.good.dark : CHART_STATUS.good.light;
  const criticalColor = isDark ? CHART_STATUS.critical.dark : CHART_STATUS.critical.light;

  if (isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }

  if (
    !points ||
    points.length === 0 ||
    points.every((point) => point.won === 0 && point.lost === 0)
  ) {
    return (
      <EmptyState
        icon={Scale}
        title="No closed deals in this period"
        description="Deals moved to a won or lost stage will appear here."
        className="h-72"
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <BarChart data={points} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
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
          allowDecimals={false}
          width={32}
        />
        <Tooltip
          cursor={{ fill: gridColor, opacity: 0.4 }}
          content={({ active, payload, label }) => {
            if (!active || !payload || payload.length === 0) return null;
            const rows = payload.map((entry) => ({
              label: entry.dataKey === 'won' ? 'Won' : 'Lost',
              value: String(entry.value),
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
        <Legend
          verticalAlign="top"
          height={32}
          formatter={(value: string) => (
            <span className="text-xs text-muted-foreground">{value}</span>
          )}
        />
        <Bar dataKey="won" name="Won" fill={goodColor} radius={[4, 4, 0, 0]} maxBarSize={16} />
        <Bar
          dataKey="lost"
          name="Lost"
          fill={criticalColor}
          radius={[4, 4, 0, 0]}
          maxBarSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
