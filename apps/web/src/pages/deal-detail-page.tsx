import { Handshake } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';

export function DealDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <Breadcrumb
        items={[{ label: 'Deals', href: '/app/deals' }, { label: id ?? 'Deal' }]}
        className="mb-3"
      />
      <PageHeader title="Deal detail" description={`Viewing deal ${id}`} />
      <EmptyState
        icon={Handshake}
        title="Deal detail coming in Phase 8"
        description="Products, activities, tasks, notes and timeline will appear here."
      />
    </div>
  );
}
