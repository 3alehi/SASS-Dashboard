import type { TicketPriority } from '@nexora/shared';

import { Badge } from '@/components/ui/badge';

const PRIORITY_VARIANT: Record<
  TicketPriority,
  'secondary' | 'default' | 'warning' | 'destructive'
> = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'warning',
  URGENT: 'destructive',
};

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}
