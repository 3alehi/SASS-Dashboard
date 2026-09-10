import { useDroppable } from '@dnd-kit/core';
import type { Deal, PipelineStage } from '@nexora/shared';

import { cn } from '@/lib/utils';
import { DealCard } from '@/pages/pipeline/deal-card';

interface PipelineStageColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
}

export function PipelineStageColumn({ stage, deals, onDealClick }: PipelineStageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id, data: { stage } });

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/30">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{stage.name}</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {deals.length}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {totalValue.toLocaleString(undefined, {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          })}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2 overflow-y-auto rounded-b-lg p-2 transition-colors',
          isOver && 'bg-primary/5 ring-2 ring-inset ring-primary/30',
        )}
      >
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onClick={() => onDealClick(deal)} />
        ))}
        {deals.length === 0 && (
          <div className="flex h-16 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
            No deals
          </div>
        )}
      </div>
    </div>
  );
}
