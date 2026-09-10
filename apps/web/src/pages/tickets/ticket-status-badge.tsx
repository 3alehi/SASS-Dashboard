import type { TicketStatus } from '@nexora/shared';

import { Badge } from '@/components/ui/badge';

const STATUS_VARIANT: Record<
  TicketStatus,
  'secondary' | 'default' | 'warning' | 'success' | 'outline'
> = {
  OPEN: 'secondary',
  IN_PROGRESS: 'default',
  WAITING: 'warning',
  RESOLVED: 'success',
  CLOSED: 'outline',
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING: 'Waiting',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
