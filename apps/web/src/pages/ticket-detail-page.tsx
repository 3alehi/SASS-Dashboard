import { Building2, ClipboardList, Tag, User } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { Can } from '@/components/auth/can';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useTicket } from '@/hooks/use-tickets';
import { TicketConversation } from '@/pages/tickets/ticket-conversation';
import { TicketFormDialog } from '@/pages/tickets/ticket-form-dialog';
import { TicketPriorityBadge } from '@/pages/tickets/ticket-priority-badge';
import { TicketStatusBadge } from '@/pages/tickets/ticket-status-badge';

function InfoRow({ icon: Icon, label, value }: { icon: typeof Tag; label: string; value: string }) {
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

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: ticket, isLoading, isError, refetch } = useTicket(id);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !ticket) {
    return <ErrorState title="Couldn't load this ticket" onRetry={() => refetch()} />;
  }

  return (
    <div>
      <Breadcrumb
        items={[{ label: 'Tickets', href: '/app/tickets' }, { label: `#${ticket.ticketNumber}` }]}
        className="mb-3"
      />
      <PageHeader
        title={ticket.title}
        description={`Ticket #${ticket.ticketNumber}`}
        actions={
          <>
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            <Can permission="tickets.update">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
            </Can>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketConversation ticketId={ticket.id} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.customerName && (
                <InfoRow icon={Building2} label="Customer" value={ticket.customerName} />
              )}
              {ticket.category && <InfoRow icon={Tag} label="Category" value={ticket.category} />}
              <InfoRow icon={User} label="Agent" value={ticket.assignedAgentName ?? 'Unassigned'} />
              {ticket.description && (
                <InfoRow icon={ClipboardList} label="Description" value={ticket.description} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <TicketFormDialog open={editOpen} onOpenChange={setEditOpen} ticket={ticket} />
    </div>
  );
}
