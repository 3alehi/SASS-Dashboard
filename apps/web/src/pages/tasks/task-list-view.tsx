import type { Task, TaskPriority, TaskStatus } from '@nexora/shared';
import { TASK_PRIORITIES, TASK_STATUSES } from '@nexora/shared';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ClipboardList, MoreHorizontal, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Can } from '@/components/auth/can';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useDeleteTask, useTasks, useToggleTaskComplete } from '@/hooks/use-tasks';
import { useToast } from '@/hooks/use-toast';
import { TaskPriorityBadge } from '@/pages/tasks/task-priority-badge';
import { TaskStatusBadge } from '@/pages/tasks/task-status-badge';

interface TaskListViewProps {
  onEdit: (task: Task) => void;
}

export function TaskListView({ onEdit }: TaskListViewProps) {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError, refetch } = useTasks({
    page,
    pageSize: 20,
    search: debouncedSearch || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
  });

  const toggleComplete = useToggleTaskComplete();
  const deleteMutation = useDeleteTask();

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({ title: 'Task deleted' });
      setDeleteTarget(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not delete task',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  const columns = useMemo<ColumnDef<Task, unknown>[]>(
    () => [
      {
        id: 'complete',
        header: '',
        cell: ({ row }) => (
          <Checkbox
            checked={row.original.status === 'COMPLETED'}
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={(checked) =>
              toggleComplete.mutate({ taskId: row.original.id, completed: Boolean(checked) })
            }
            aria-label="Toggle complete"
          />
        ),
      },
      {
        accessorKey: 'title',
        header: 'Task',
        cell: ({ row }) => (
          <p
            className={
              row.original.status === 'COMPLETED'
                ? 'text-muted-foreground line-through'
                : 'font-medium text-foreground'
            }
          >
            {row.original.title}
          </p>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <TaskStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => <TaskPriorityBadge priority={row.original.priority} />,
      },
      {
        accessorKey: 'assigneeName',
        header: 'Assignee',
        cell: ({ row }) =>
          row.original.assigneeName || <span className="text-muted-foreground">—</span>,
      },
      {
        accessorKey: 'dueDate',
        header: 'Due date',
        cell: ({ row }) =>
          row.original.dueDate ? format(new Date(row.original.dueDate), 'MMM d, yyyy') : '—',
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(event) => event.stopPropagation()}
                aria-label="Task actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
              <Can permission="tasks.update">
                <DropdownMenuItem onSelect={() => onEdit(row.original)}>Edit</DropdownMenuItem>
              </Can>
              <Can permission="tasks.delete">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => setDeleteTarget(row.original)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </Can>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onEdit, toggleComplete],
  );

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as TaskStatus | 'ALL');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {TASK_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(value) => {
            setPriorityFilter(value as TaskPriority | 'ALL');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All priorities</SelectItem>
            {TASK_PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority.charAt(0) + priority.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={(row) => onEdit(row)}
        emptyState={
          <EmptyState
            icon={ClipboardList}
            title={debouncedSearch ? 'No matching tasks' : 'No tasks yet'}
            description={
              debouncedSearch
                ? 'Try adjusting your search or filters.'
                : 'Create your first task to get started.'
            }
          />
        }
      />

      {data && data.total > 0 && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={setPage}
          className="mt-4"
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this task?"
        description={`"${deleteTarget?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
