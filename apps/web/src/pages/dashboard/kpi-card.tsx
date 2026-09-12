import type { KpiValue } from '@nexora/shared';
import type { LucideIcon } from 'lucide-react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  icon: LucideIcon;
  kpi: KpiValue | undefined;
  isLoading: boolean;
  format: (value: number) => string;
  /** Whether an increase is the desired direction (revenue: true, open tasks: false). */
  higherIsBetter?: boolean;
}

export function KpiCard({
  label,
  icon: Icon,
  kpi,
  isLoading,
  format,
  higherIsBetter = true,
}: KpiCardProps) {
  if (isLoading || !kpi) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24" />
        </CardContent>
      </Card>
    );
  }

  const change = kpi.changePercent;
  const isFlat = change === null || Math.abs(change) < 0.05;
  const isUp = change !== null && change > 0;
  const isGood = isFlat ? null : isUp === higherIsBetter;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{format(kpi.current)}</p>
        {change !== null && (
          <p
            className={cn(
              'mt-1 flex items-center gap-1 text-xs font-medium',
              isFlat && 'text-muted-foreground',
              !isFlat && isGood && 'text-success',
              !isFlat && !isGood && 'text-destructive',
            )}
          >
            {isFlat ? (
              <Minus className="h-3 w-3" />
            ) : isUp ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(change).toFixed(1)}% vs previous period
          </p>
        )}
      </CardContent>
    </Card>
  );
}
