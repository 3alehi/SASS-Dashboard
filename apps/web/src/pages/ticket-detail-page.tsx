import { LifeBuoy } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <Breadcrumb
        items={[{ label: 'Tickets', href: '/app/tickets' }, { label: id ?? 'Ticket' }]}
        className="mb-3"
      />
      <PageHeader title="Ticket detail" description={`Viewing ticket ${id}`} />
      <EmptyState
        icon={LifeBuoy}
        title="Ticket conversation coming in Phase 10"
        description="Conversation thread, internal notes and assignment will appear here."
      />
    </div>
  );
}
