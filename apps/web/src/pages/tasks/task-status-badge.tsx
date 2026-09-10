import type { TaskStatus } from '@nexora/shared';

import { Badge } from '@/components/ui/badge';

const STATUS_VARIANT: Record<TaskStatus, 'secondary' | 'default' | 'success' | 'outline'> = {
  OPEN: 'secondary',
  IN_PROGRESS: 'default',
  COMPLETED: 'success',
  CANCELLED: 'outline',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
