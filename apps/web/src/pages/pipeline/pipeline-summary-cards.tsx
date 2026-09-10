import type { PipelineSummary } from '@nexora/shared';
import { Percent, Target, TrendingUp, Trophy } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

interface PipelineSummaryCardsProps {
  summary?: PipelineSummary;
  isLoading: boolean;
}

export function PipelineSummaryCards({ summary, isLoading }: PipelineSummaryCardsProps) {
  const cards = [
    {
      label: 'Pipeline Value',
      value: summary ? formatCurrency(summary.totalValue) : undefined,
      icon: Target,
    },
    {
      label: 'Weighted Value',
      value: summary ? formatCurrency(summary.weightedValue) : undefined,
      icon: TrendingUp,
    },
    {
      label: 'Won Revenue',
      value: summary ? formatCurrency(summary.wonValue) : undefined,
      icon: Trophy,
    },
    {
      label: 'Conversion Rate',
      value: summary ? `${summary.conversionRate.toFixed(1)}%` : undefined,
      icon: Percent,
    },
  ];

  return (
    <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading || !card.value ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight">{card.value}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
