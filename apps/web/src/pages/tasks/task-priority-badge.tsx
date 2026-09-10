import type { TaskPriority } from '@nexora/shared';

import { Badge } from '@/components/ui/badge';

const PRIORITY_VARIANT: Record<TaskPriority, 'secondary' | 'default' | 'warning' | 'destructive'> =
  {
    LOW: 'secondary',
    MEDIUM: 'default',
    HIGH: 'warning',
    URGENT: 'destructive',
  };

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}
