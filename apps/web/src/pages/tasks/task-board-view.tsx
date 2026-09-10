import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskStatus } from '@nexora/shared';
import { TASK_STATUSES } from '@nexora/shared';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';

import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useMoveTask, useTaskBoard } from '@/hooks/use-tasks';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { TaskPriorityBadge } from '@/pages/tasks/task-priority-badge';

const STATUS_LABEL: Record<TaskStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
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
      <p className="text-sm font-medium leading-snug text-foreground">{task.title}</p>
      <div className="flex items-center justify-between">
        <TaskPriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className="text-xs text-muted-foreground">
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </Card>
  );
}

function StatusColumn({
  status,
  tasks,
  onTaskClick,
}: {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { status } });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/30">
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-sm font-medium text-foreground">{STATUS_LABEL[status]}</span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2 overflow-y-auto rounded-b-lg p-2 transition-colors',
          isOver && 'bg-primary/5 ring-2 ring-inset ring-primary/30',
        )}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
        {tasks.length === 0 && (
          <div className="flex h-16 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

interface TaskBoardViewProps {
  onTaskClick: (task: Task) => void;
}

export function TaskBoardView({ onTaskClick }: TaskBoardViewProps) {
  const { data: tasks, isLoading, isError, refetch } = useTaskBoard();
  const moveMutation = useMoveTask();
  const { toast } = useToast();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const tasksByStatus = useMemo(() => {
    const grouped = new Map<TaskStatus, Task[]>();
    for (const task of tasks ?? []) {
      const list = grouped.get(task.status) ?? [];
      list.push(task);
      grouped.set(task.status, list);
    }
    return grouped;
  }, [tasks]);

  function handleDragStart(event: DragStartEvent) {
    const task = event.active.data.current?.task as Task | undefined;
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const targetStatus = over.id as TaskStatus;
    const task = (tasks ?? []).find((item) => item.id === taskId);

    if (!task || task.status === targetStatus) return;

    moveMutation.mutate(
      { taskId, status: targetStatus },
      {
        onError: (error) => {
          toast({
            variant: 'destructive',
            title: 'Could not move task',
            description: error instanceof Error ? error.message : undefined,
          });
        },
      },
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-96 w-72 shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {TASK_STATUSES.map((status) => (
          <StatusColumn
            key={status}
            status={status}
            tasks={tasksByStatus.get(status) ?? []}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
      <DragOverlay>{activeTask && <TaskCard task={activeTask} onClick={() => {}} />}</DragOverlay>
    </DndContext>
  );
}
