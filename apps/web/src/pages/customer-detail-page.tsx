import { Building2 } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <Breadcrumb
        items={[{ label: 'Customers', href: '/app/customers' }, { label: id ?? 'Customer' }]}
        className="mb-3"
      />
      <PageHeader title="Customer detail" description={`Viewing customer ${id}`} />
      <EmptyState
        icon={Building2}
        title="Customer profile coming in Phase 6"
        description="Overview, contacts, deals, activities, tasks, notes, tickets and timeline will appear here."
      />
    </div>
  );
}
