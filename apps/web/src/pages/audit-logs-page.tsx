import { ScrollText } from 'lucide-react';

import { PlaceholderPage } from '@/components/layout/placeholder-page';

export function AuditLogsPage() {
  return (
    <PlaceholderPage
      title="Audit Logs"
      description="A complete, tamper-evident trail of activity in your organization."
      icon={ScrollText}
      phaseLabel="Phase 15"
    />
  );
}
