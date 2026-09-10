import { ClipboardList } from 'lucide-react';

import { PlaceholderPage } from '@/components/layout/placeholder-page';

export function TasksPage() {
  return (
    <PlaceholderPage
      title="Tasks"
      description="Track work across your team with lists, boards, and calendars."
      icon={ClipboardList}
      phaseLabel="Phase 9"
    />
  );
}
