import { Users } from 'lucide-react';

import { PlaceholderPage } from '@/components/layout/placeholder-page';

export function TeamPage() {
  return (
    <PlaceholderPage
      title="Team"
      description="Manage members, roles, and invitations for your organization."
      icon={Users}
      phaseLabel="Phase 11"
    />
  );
}
