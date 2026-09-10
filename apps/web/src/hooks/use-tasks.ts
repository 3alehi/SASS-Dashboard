import type {
  CreateTaskCommentInput,
  CreateTaskInput,
  Task,
  TaskListQuery,
  TaskStatus,
  UpdateTaskInput,
} from '@nexora/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePermissions } from '@/hooks/use-permissions';
import {
  createTask,
  createTaskComment,
  deleteTask,
  fetchTask,
  fetchTaskBoard,
  fetchTaskComments,
  fetchTasks,
  updateTask,
} from '@/services/tasks-service';

function useActiveOrganizationId(): string | undefined {
  return usePermissions().activeMembership?.organizationId;
}

export function useTasks(query: Partial<TaskListQuery>) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['tasks', organizationId, query],
    queryFn: () => fetchTasks(organizationId!, query),
    enabled: Boolean(organizationId),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}

export function useTaskBoard() {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['tasks', organizationId, 'board'],
    queryFn: () => fetchTaskBoard(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 15 * 1000,
  });
}

export function useTask(taskId: string | undefined) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['tasks', organizationId, 'detail', taskId],
    queryFn: () => fetchTask(organizationId!, taskId!),
    enabled: Boolean(organizationId) && Boolean(taskId),
  });
}

export function useTaskComments(taskId: string | undefined) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['tasks', organizationId, 'comments', taskId],
    queryFn: () => fetchTaskComments(organizationId!, taskId!),
    enabled: Boolean(organizationId) && Boolean(taskId),
  });
}

export function useCreateTask() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', organizationId] });
    },
  });
}

export function useUpdateTask() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      updateTask(organizationId!, taskId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', organizationId] });
      queryClient.invalidateQueries({
        queryKey: ['tasks', organizationId, 'detail', variables.taskId],
      });
    },
  });
}

export function useDeleteTask() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(organizationId!, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', organizationId] });
    },
  });
}

export function useCreateTaskComment() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: CreateTaskCommentInput }) =>
      createTaskComment(organizationId!, taskId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', organizationId, 'comments', variables.taskId],
      });
    },
  });
}

interface ToggleTaskCompleteVariables {
  taskId: string;
  completed: boolean;
}

/**
 * Optimistically flips a task's completed state on the board view so
 * checking a checkbox feels instant, rolling back on failure — same pattern
 * as useMoveDeal for the Kanban board.
 */
export function useToggleTaskComplete() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, completed }: ToggleTaskCompleteVariables) =>
      updateTask(organizationId!, taskId, { status: completed ? 'COMPLETED' : 'OPEN' }),
    onMutate: async ({ taskId, completed }: ToggleTaskCompleteVariables) => {
      const boardKey = ['tasks', organizationId, 'board'];
      await queryClient.cancelQueries({ queryKey: boardKey });

      const previousBoard = queryClient.getQueryData<Task[]>(boardKey);

      queryClient.setQueryData<Task[]>(boardKey, (current) =>
        current?.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: completed ? 'COMPLETED' : ('OPEN' as TaskStatus),
                completedAt: completed ? new Date().toISOString() : null,
              }
            : task,
        ),
      );

      return { previousBoard, boardKey };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.boardKey, context.previousBoard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', organizationId] });
    },
  });
}

interface MoveTaskVariables {
  taskId: string;
  status: TaskStatus;
}

/** Optimistic status move for the Kanban board's drag-and-drop, mirroring useMoveDeal. */
export function useMoveTask() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: MoveTaskVariables) =>
      updateTask(organizationId!, taskId, { status }),
    onMutate: async ({ taskId, status }: MoveTaskVariables) => {
      const boardKey = ['tasks', organizationId, 'board'];
      await queryClient.cancelQueries({ queryKey: boardKey });

      const previousBoard = queryClient.getQueryData<Task[]>(boardKey);

      queryClient.setQueryData<Task[]>(boardKey, (current) =>
        current?.map((task) => (task.id === taskId ? { ...task, status } : task)),
      );

      return { previousBoard, boardKey };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.boardKey, context.previousBoard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', organizationId] });
    },
  });
}
