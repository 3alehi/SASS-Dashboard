import type { Customer } from '@nexora/shared';
import { UserPlus } from 'lucide-react';

import { Timeline, type TimelineItem } from '@/components/timeline/timeline';

export function CustomerTimelineTab({ customer }: { customer: Customer }) {
  const items: TimelineItem[] = [
    {
      id: 'created',
      icon: UserPlus,
      title: 'Customer created',
      description: customer.source ? `Sourced from ${customer.source}` : undefined,
      timestamp: customer.createdAt,
      iconClassName: 'bg-primary/10 text-primary',
    },
  ];

  return (
    <div>
      <Timeline items={items} />
      <p className="mt-6 text-xs text-muted-foreground">
        Activity, deal, and task events will appear here automatically as those modules land.
      </p>
    </div>
  );
}
