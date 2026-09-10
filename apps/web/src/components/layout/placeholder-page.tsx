import type { LucideIcon } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  phaseLabel: string;
}

export function PlaceholderPage({ title, description, icon, phaseLabel }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title={`${title} module coming soon`}
        description={`This area is scaffolded and ready — full functionality lands in ${phaseLabel}.`}
      />
    </div>
  );
}
