import type { LeadStatus } from '@nexora/shared';

import { Badge } from '@/components/ui/badge';

const STATUS_VARIANT: Record<
  LeadStatus,
  'default' | 'secondary' | 'success' | 'destructive' | 'warning'
> = {
  NEW: 'secondary',
  CONTACTED: 'default',
  QUALIFIED: 'default',
  PROPOSAL: 'warning',
  NEGOTIATION: 'warning',
  WON: 'success',
  LOST: 'destructive',
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
