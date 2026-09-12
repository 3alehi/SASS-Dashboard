import { Badge } from '@/components/ui/badge';

const VERB_LABELS: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  restore: 'Restored',
  convert: 'Converted',
  move_stage: 'Moved stage',
  invite: 'Invited',
  role_change: 'Changed role',
  deactivate: 'Deactivated',
  reactivate: 'Reactivated',
  remove: 'Removed',
};

const ENTITY_LABELS: Record<string, string> = {
  customer: 'customer',
  lead: 'lead',
  deal: 'deal',
  task: 'task',
  ticket: 'ticket',
  team_member: 'team member',
};

interface AuditActionBadgeProps {
  action: string;
}

/** Formats an action key like "customer.delete" into "Deleted customer". */
export function AuditActionBadge({ action }: AuditActionBadgeProps) {
  const [entity, verb] = action.split('.');
  const variant = verb === 'delete' || verb === 'remove' ? 'destructive' : 'default';

  if (!verb) {
    return (
      <Badge variant={variant} className="whitespace-nowrap">
        {action}
      </Badge>
    );
  }

  const verbLabel = VERB_LABELS[verb] ?? verb;
  const entityLabel = (entity && ENTITY_LABELS[entity]) ?? entity;

  return (
    <Badge variant={variant} className="whitespace-nowrap">
      {verbLabel} {entityLabel}
    </Badge>
  );
}
