import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { Deal } from '@nexora/shared';
import { KanbanSquare, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Can } from '@/components/auth/can';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useMoveDeal, usePipelineDeals, usePipelineSummary } from '@/hooks/use-deals';
import { usePipelines } from '@/hooks/use-pipelines';
import { useToast } from '@/hooks/use-toast';
import { DealCard } from '@/pages/pipeline/deal-card';
import { DealFormDialog } from '@/pages/pipeline/deal-form-dialog';
import { PipelineStageColumn } from '@/pages/pipeline/pipeline-stage-column';
import { PipelineSummaryCards } from '@/pages/pipeline/pipeline-summary-cards';

export function PipelinePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    data: pipelines,
    isLoading: pipelinesLoading,
    isError: pipelinesError,
    refetch: refetchPipelines,
  } = usePipelines();

  const activePipeline = pipelines?.[0];

  const {
    data: deals,
    isLoading: dealsLoading,
    isError: dealsError,
    refetch: refetchDeals,
  } = usePipelineDeals(activePipeline?.id);
  const { data: summary, isLoading: summaryLoading } = usePipelineSummary(activePipeline?.id);

  const moveMutation = useMoveDeal();

  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [createStageId, setCreateStageId] = useState<string | undefined>(undefined);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const dealsByStage = useMemo(() => {
    const grouped = new Map<string, Deal[]>();
    for (const deal of deals ?? []) {
      const list = grouped.get(deal.stageId) ?? [];
      list.push(deal);
      grouped.set(deal.stageId, list);
    }
    return grouped;
  }, [deals]);

  function handleDragStart(event: DragStartEvent) {
    const deal = event.active.data.current?.deal as Deal | undefined;
    setActiveDeal(deal ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over || !activePipeline) return;

    const dealId = active.id as string;
    const targetStageId = over.id as string;
    const deal = (deals ?? []).find((item) => item.id === dealId);

    if (!deal || deal.stageId === targetStageId) return;

    moveMutation.mutate(
      { dealId, stageId: targetStageId, pipelineId: activePipeline.id },
      {
        onError: (error) => {
          toast({
            variant: 'destructive',
            title: 'Could not move deal',
            description: error instanceof Error ? error.message : undefined,
          });
        },
      },
    );
  }

  function openCreateDialog(stageId?: string) {
    setCreateStageId(stageId);
    setFormOpen(true);
  }

  if (pipelinesError) {
    return (
      <div>
        <PageHeader
          title="Pipeline"
          description="Visualize and drag deals through your sales stages."
        />
        <ErrorState onRetry={() => refetchPipelines()} />
      </div>
    );
  }

  if (pipelinesLoading) {
    return (
      <div>
        <PageHeader
          title="Pipeline"
          description="Visualize and drag deals through your sales stages."
        />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!activePipeline) {
    return (
      <div>
        <PageHeader
          title="Pipeline"
          description="Visualize and drag deals through your sales stages."
        />
        <EmptyState
          icon={KanbanSquare}
          title="No pipeline configured"
          description="Contact your admin to set up a sales pipeline."
        />
      </div>
    );
  }

  if (dealsError) {
    return (
      <div>
        <PageHeader
          title="Pipeline"
          description="Visualize and drag deals through your sales stages."
        />
        <ErrorState onRetry={() => refetchDeals()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Visualize and drag deals through your sales stages."
        actions={
          <Can permission="deals.create">
            <Button onClick={() => openCreateDialog()}>
              <Plus />
              New deal
            </Button>
          </Can>
        }
      />

      <PipelineSummaryCards summary={summary} isLoading={summaryLoading} />

      {dealsLoading ? (
        <div className="flex gap-3 overflow-x-auto">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-96 w-72 shrink-0" />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {activePipeline.stages.map((stage) => (
              <PipelineStageColumn
                key={stage.id}
                stage={stage}
                deals={dealsByStage.get(stage.id) ?? []}
                onDealClick={(deal) => navigate(`/app/deals/${deal.id}`)}
              />
            ))}
          </div>
          <DragOverlay>{activeDeal && <DealCard deal={activeDeal} />}</DragOverlay>
        </DndContext>
      )}

      <DealFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        pipeline={activePipeline}
        defaultStageId={createStageId}
      />
    </div>
  );
}
