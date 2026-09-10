import type { MemberStatus } from '@nexora/shared';

import { Badge } from '@/components/ui/badge';

const STATUS_VARIANT: Record<MemberStatus, 'success' | 'secondary' | 'outline'> = {
  ACTIVE: 'success',
  INVITED: 'secondary',
  DEACTIVATED: 'outline',
};

const STATUS_LABEL: Record<MemberStatus, string> = {
  ACTIVE: 'Active',
  INVITED: 'Invited',
  DEACTIVATED: 'Deactivated',
};

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
