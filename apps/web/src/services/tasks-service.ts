import type {
  CreateTaskCommentInput,
  CreateTaskInput,
  PaginatedResult,
  Task,
  TaskComment,
  TaskListQuery,
  UpdateTaskInput,
} from '@nexora/shared';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/services/api-client';

function basePath(organizationId: string): string {
  return `/organizations/${organizationId}/tasks`;
}

export function fetchTasks(
  organizationId: string,
  query: Partial<TaskListQuery>,
): Promise<PaginatedResult<Task>> {
  return apiGet<PaginatedResult<Task>>(basePath(organizationId), {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    status: query.status,
    priority: query.priority,
    assigneeId: query.assigneeId,
    customerId: query.customerId,
    dealId: query.dealId,
    dueBefore: query.dueBefore,
    dueAfter: query.dueAfter,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
  });
}

export function fetchTaskBoard(organizationId: string): Promise<Task[]> {
  return apiGet<Task[]>(`${basePath(organizationId)}/board`);
}

export function fetchTask(organizationId: string, taskId: string): Promise<Task> {
  return apiGet<Task>(`${basePath(organizationId)}/${taskId}`);
}

export function createTask(organizationId: string, input: CreateTaskInput): Promise<Task> {
  return apiPost<Task>(basePath(organizationId), input);
}

export function updateTask(
  organizationId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<Task> {
  return apiPatch<Task>(`${basePath(organizationId)}/${taskId}`, input);
}

export function deleteTask(organizationId: string, taskId: string): Promise<{ ok: true }> {
  return apiDelete<{ ok: true }>(`${basePath(organizationId)}/${taskId}`);
}

export function fetchTaskComments(organizationId: string, taskId: string): Promise<TaskComment[]> {
  return apiGet<TaskComment[]>(`${basePath(organizationId)}/${taskId}/comments`);
}

export function createTaskComment(
  organizationId: string,
  taskId: string,
  input: CreateTaskCommentInput,
): Promise<TaskComment> {
  return apiPost<TaskComment>(`${basePath(organizationId)}/${taskId}/comments`, input);
}
