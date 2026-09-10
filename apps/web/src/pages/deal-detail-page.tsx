import { format } from 'date-fns';
import { CalendarClock, ClipboardList, DollarSign, Percent, StickyNote, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Can } from '@/components/auth/can';
import { PageHeader } from '@/components/layout/page-header';
import { Timeline, type TimelineItem } from '@/components/timeline/timeline';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeal } from '@/hooks/use-deals';
import { usePipelines } from '@/hooks/use-pipelines';
import { CustomerTabPlaceholder } from '@/pages/customers/customer-tab-placeholder';
import { DealFormDialog } from '@/pages/pipeline/deal-form-dialog';

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: deal, isLoading, isError, refetch } = useDeal(id);
  const { data: pipelines } = usePipelines();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !deal) {
    return <ErrorState title="Couldn't load this deal" onRetry={() => refetch()} />;
  }

  const pipeline = pipelines?.find((item) => item.id === deal.pipelineId);
  const stage = pipeline?.stages.find((item) => item.id === deal.stageId);

  const timelineItems: TimelineItem[] = [
    {
      id: 'created',
      icon: ClipboardList,
      title: 'Deal created',
      description: pipeline ? `Added to ${pipeline.name}` : undefined,
      timestamp: deal.createdAt,
      iconClassName: 'bg-primary/10 text-primary',
    },
  ];

  return (
    <div>
      <Breadcrumb
        items={[{ label: 'Deals', href: '/app/deals' }, { label: deal.title }]}
        className="mb-3"
      />
      <PageHeader
        title={deal.title}
        description={deal.customerName ?? undefined}
        actions={
          <>
            {stage && <Badge variant="secondary">{stage.name}</Badge>}
            <Can permission="deals.update">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
            </Can>
          </>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow
                  icon={DollarSign}
                  label="Value"
                  value={deal.value.toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'USD',
                  })}
                />
                <InfoRow icon={Percent} label="Probability" value={`${deal.probability}%`} />
                {deal.expectedCloseDate && (
                  <InfoRow
                    icon={CalendarClock}
                    label="Expected close"
                    value={format(new Date(deal.expectedCloseDate), 'MMMM d, yyyy')}
                  />
                )}
                {deal.customerId && (
                  <InfoRow
                    icon={User}
                    label="Customer"
                    value={deal.customerName ?? deal.customerId}
                  />
                )}
              </CardContent>
            </Card>

            {deal.notes && (
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{deal.notes}</p>
                </CardContent>
              </Card>
            )}

            {deal.customerId && (
              <p className="text-sm text-muted-foreground lg:col-span-3">
                <Link
                  to={`/app/customers/${deal.customerId}`}
                  className="font-medium text-primary hover:underline"
                >
                  View customer
                </Link>
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activities">
          <CustomerTabPlaceholder
            icon={ClipboardList}
            title="Activities"
            phaseLabel="Phase 8 follow-up"
          />
        </TabsContent>
        <TabsContent value="tasks">
          <CustomerTabPlaceholder icon={ClipboardList} title="Tasks" phaseLabel="Phase 9" />
        </TabsContent>
        <TabsContent value="notes">
          <CustomerTabPlaceholder icon={StickyNote} title="Notes" phaseLabel="Phase 8 follow-up" />
        </TabsContent>
        <TabsContent value="timeline">
          <Timeline items={timelineItems} />
        </TabsContent>
      </Tabs>

      {pipeline && (
        <DealFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          pipeline={pipeline}
          deal={deal}
        />
      )}
    </div>
  );
}
