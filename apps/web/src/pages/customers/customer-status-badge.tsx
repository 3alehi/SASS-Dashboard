import type { CustomerStatus } from '@nexora/shared';

import { Badge } from '@/components/ui/badge';

const STATUS_VARIANT: Record<CustomerStatus, 'success' | 'secondary' | 'outline'> = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  ARCHIVED: 'outline',
};

const STATUS_LABEL: Record<CustomerStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ARCHIVED: 'Archived',
};

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
