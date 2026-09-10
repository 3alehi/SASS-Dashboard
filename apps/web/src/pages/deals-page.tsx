import { Handshake } from 'lucide-react';

import { PlaceholderPage } from '@/components/layout/placeholder-page';

export function DealsPage() {
  return (
    <PlaceholderPage
      title="Deals"
      description="Manage active deals across your sales pipeline."
      icon={Handshake}
      phaseLabel="Phase 8"
    />
  );
}
