import type { Task } from '@nexora/shared';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useTaskBoard } from '@/hooks/use-tasks';
import { cn } from '@/lib/utils';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface TaskCalendarViewProps {
  onTaskClick: (task: Task) => void;
}

export function TaskCalendarView({ onTaskClick }: TaskCalendarViewProps) {
  const { data: tasks, isLoading, isError, refetch } = useTaskBoard();
  const [month, setMonth] = useState(() => new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks ?? []) {
      if (!task.dueDate) continue;
      const key = format(new Date(task.dueDate), 'yyyy-MM-dd');
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">{format(month, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth((current) => subMonths(current, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date())}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth((current) => addMonths(current, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="bg-muted/40 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDay.get(key) ?? [];

          return (
            <div
              key={key}
              className={cn(
                'min-h-24 bg-background p-1.5',
                !isSameMonth(day, month) && 'bg-muted/20 text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-5 w-5 items-center justify-center rounded-full text-xs',
                  isToday(day) && 'bg-primary font-medium text-primary-foreground',
                )}
              >
                {format(day, 'd')}
              </span>
              <div className="mt-1 space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className={cn(
                      'block w-full truncate rounded px-1.5 py-0.5 text-left text-xs',
                      'bg-primary/10 text-primary hover:bg-primary/20',
                      task.status === 'COMPLETED' && 'bg-muted text-muted-foreground line-through',
                    )}
                  >
                    {task.title}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <p className="px-1.5 text-xs text-muted-foreground">
                    +{dayTasks.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
