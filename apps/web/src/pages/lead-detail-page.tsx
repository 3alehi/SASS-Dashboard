import { Target } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <Breadcrumb
        items={[{ label: 'Leads', href: '/app/leads' }, { label: id ?? 'Lead' }]}
        className="mb-3"
      />
      <PageHeader title="Lead detail" description={`Viewing lead ${id}`} />
      <EmptyState
        icon={Target}
        title="Lead detail coming in Phase 7"
        description="Status, conversion workflow, activities and notes will appear here."
      />
    </div>
  );
}
