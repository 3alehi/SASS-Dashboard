import { Handshake, ListChecks, TrendingUp, Users } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

const KPI_CARDS = [
  { label: 'Revenue', value: '$0', icon: TrendingUp },
  { label: 'Pipeline Value', value: '$0', icon: Handshake },
  { label: 'Won Deals', value: '0', icon: Handshake },
  { label: 'Conversion Rate', value: '0%', icon: TrendingUp },
  { label: 'New Customers', value: '0', icon: Users },
  { label: 'Open Tasks', value: '0', icon: ListChecks },
];

export function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="An overview of your organization's sales performance."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-tight">{kpi.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={TrendingUp}
            title="Analytics charts coming in Phase 12"
            description="Revenue trends, pipeline breakdowns, and conversion analytics will render here once connected to live data."
          />
        </CardContent>
      </Card>
    </div>
  );
}
