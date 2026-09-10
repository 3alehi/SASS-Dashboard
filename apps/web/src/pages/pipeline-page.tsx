import { KanbanSquare } from 'lucide-react';

import { PlaceholderPage } from '@/components/layout/placeholder-page';

export function PipelinePage() {
  return (
    <PlaceholderPage
      title="Pipeline"
      description="Visualize and drag deals through your sales stages."
      icon={KanbanSquare}
      phaseLabel="Phase 8"
    />
  );
}
