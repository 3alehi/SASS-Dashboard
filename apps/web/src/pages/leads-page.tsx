import { Target } from 'lucide-react';

import { PlaceholderPage } from '@/components/layout/placeholder-page';

export function LeadsPage() {
  return (
    <PlaceholderPage
      title="Leads"
      description="Track and qualify incoming leads through your funnel."
      icon={Target}
      phaseLabel="Phase 7"
    />
  );
}
