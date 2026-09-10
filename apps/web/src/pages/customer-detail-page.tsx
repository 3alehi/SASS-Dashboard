import { ClipboardList, Handshake, History, LifeBuoy, StickyNote, Users } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { Can } from '@/components/auth/can';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomer } from '@/hooks/use-customers';
import { CustomerFormDialog } from '@/pages/customers/customer-form-dialog';
import { CustomerOverviewTab } from '@/pages/customers/customer-overview-tab';
import { CustomerStatusBadge } from '@/pages/customers/customer-status-badge';
import { CustomerTabPlaceholder } from '@/pages/customers/customer-tab-placeholder';
import { CustomerTimelineTab } from '@/pages/customers/customer-timeline-tab';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading, isError, refetch } = useCustomer(id);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !customer) {
    return <ErrorState title="Couldn't load this customer" onRetry={() => refetch()} />;
  }

  return (
    <div>
      <Breadcrumb
        items={[{ label: 'Customers', href: '/app/customers' }, { label: customer.name }]}
        className="mb-3"
      />
      <PageHeader
        title={customer.name}
        description={customer.company ?? undefined}
        actions={
          <>
            <CustomerStatusBadge status={customer.status} />
            <Can permission="customers.update">
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
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CustomerOverviewTab customer={customer} />
        </TabsContent>
        <TabsContent value="contacts">
          <CustomerTabPlaceholder icon={Users} title="Contacts" phaseLabel="Phase 6 follow-up" />
        </TabsContent>
        <TabsContent value="deals">
          <CustomerTabPlaceholder icon={Handshake} title="Deals" phaseLabel="Phase 8" />
        </TabsContent>
        <TabsContent value="activities">
          <CustomerTabPlaceholder icon={History} title="Activities" phaseLabel="Phase 8" />
        </TabsContent>
        <TabsContent value="tasks">
          <CustomerTabPlaceholder icon={ClipboardList} title="Tasks" phaseLabel="Phase 9" />
        </TabsContent>
        <TabsContent value="notes">
          <CustomerTabPlaceholder icon={StickyNote} title="Notes" phaseLabel="Phase 8" />
        </TabsContent>
        <TabsContent value="tickets">
          <CustomerTabPlaceholder icon={LifeBuoy} title="Tickets" phaseLabel="Phase 10" />
        </TabsContent>
        <TabsContent value="timeline">
          <CustomerTimelineTab customer={customer} />
        </TabsContent>
      </Tabs>

      <CustomerFormDialog open={editOpen} onOpenChange={setEditOpen} customer={customer} />
    </div>
  );
}
