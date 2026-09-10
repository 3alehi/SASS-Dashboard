import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Deal } from '@nexora/shared';
import { format } from 'date-fns';
import { Building2, CalendarClock } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DealCardProps {
  deal: Deal;
  onClick?: () => void;
}

export function DealCard({ deal, onClick }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        'cursor-grab space-y-2 p-3 shadow-subtle transition-shadow hover:shadow-panel active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
    >
      <p className="text-sm font-medium leading-snug text-foreground">{deal.title}</p>

      {deal.customerName && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{deal.customerName}</span>
        </p>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-sm font-semibold text-foreground">
          {deal.value.toLocaleString(undefined, {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          })}
        </span>
        {deal.expectedCloseDate && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3 w-3" />
            {format(new Date(deal.expectedCloseDate), 'MMM d')}
          </span>
        )}
      </div>
    </Card>
  );
}
