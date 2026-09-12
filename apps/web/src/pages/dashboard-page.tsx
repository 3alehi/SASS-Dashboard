import { dashboardQuerySchema, type DashboardQuery } from '@nexora/shared';
import { Handshake, ListChecks, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useDashboardOverview,
  useLeadConversionFunnel,
  usePipelineByStage,
  useRevenueSeries,
  useSalesPerformance,
  useWonLostSeries,
} from '@/hooks/use-dashboard';
import { DashboardDateRangeFilter } from '@/pages/dashboard/dashboard-date-range-filter';
import { KpiCard } from '@/pages/dashboard/kpi-card';
import { LeadConversionChart } from '@/pages/dashboard/lead-conversion-chart';
import { PipelineByStageChart } from '@/pages/dashboard/pipeline-by-stage-chart';
import { RevenueChart } from '@/pages/dashboard/revenue-chart';
import { SalesPerformanceChart } from '@/pages/dashboard/sales-performance-chart';
import { WonLostChart } from '@/pages/dashboard/won-lost-chart';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function DashboardPage() {
  const [query, setQuery] = useState<DashboardQuery>(() => dashboardQuerySchema.parse({}));

  const { data: overview, isLoading: overviewLoading } = useDashboardOverview(query);
  const { data: revenue, isLoading: revenueLoading } = useRevenueSeries(query);
  const { data: stages, isLoading: stagesLoading } = usePipelineByStage();
  const { data: wonLost, isLoading: wonLostLoading } = useWonLostSeries(query);
  const { data: funnel, isLoading: funnelLoading } = useLeadConversionFunnel(query);
  const { data: performance, isLoading: performanceLoading } = useSalesPerformance(query);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="An overview of your organization's sales performance."
      />

      <DashboardDateRangeFilter value={query} onChange={setQuery} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Revenue"
          icon={TrendingUp}
          kpi={overview?.revenue}
          isLoading={overviewLoading}
          format={formatCurrency}
        />
        <KpiCard
          label="Pipeline value"
          icon={Handshake}
          kpi={overview?.pipelineValue}
          isLoading={overviewLoading}
          format={formatCurrency}
        />
        <KpiCard
          label="Won deals"
          icon={Handshake}
          kpi={overview?.wonDeals}
          isLoading={overviewLoading}
          format={formatNumber}
        />
        <KpiCard
          label="Conversion rate"
          icon={TrendingUp}
          kpi={overview?.conversionRate}
          isLoading={overviewLoading}
          format={formatPercent}
        />
        <KpiCard
          label="New customers"
          icon={Users}
          kpi={overview?.newCustomers}
          isLoading={overviewLoading}
          format={formatNumber}
        />
        <KpiCard
          label="Open tasks"
          icon={ListChecks}
          kpi={overview?.openTasks}
          isLoading={overviewLoading}
          format={formatNumber}
          higherIsBetter={false}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue over time</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart series={revenue} isLoading={revenueLoading} compare={query.compare} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline by stage</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineByStageChart stages={stages} isLoading={stagesLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deals won vs. lost</CardTitle>
          </CardHeader>
          <CardContent>
            <WonLostChart points={wonLost} isLoading={wonLostLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead conversion funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadConversionChart stages={funnel} isLoading={funnelLoading} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales performance by owner</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesPerformanceChart entries={performance} isLoading={performanceLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
