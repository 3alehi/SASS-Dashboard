import type { CreateTaskInput, Task, TaskListQuery, UpdateTaskInput } from '@nexora/shared';

import { supabaseAdmin } from '@/lib/supabase-admin.js';

interface TaskRow {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  status: Task['status'];
  priority: Task['priority'];
  due_date: string | null;
  completed_at: string | null;
  assignee_id: string | null;
  customer_id: string | null;
  deal_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  profiles: { full_name: string } | { full_name: string }[] | null;
  customers: { name: string } | { name: string }[] | null;
  deals: { title: string } | { title: string }[] | null;
}

function unwrap<T>(relation: T | T[] | null): T | null {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    assigneeId: row.assignee_id,
    assigneeName: unwrap(row.profiles)?.full_name ?? null,
    customerId: row.customer_id,
    customerName: unwrap(row.customers)?.name ?? null,
    dealId: row.deal_id,
    dealTitle: unwrap(row.deals)?.title ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

const SELECT_COLUMNS =
  '*, profiles!tasks_assignee_id_fkey(full_name), customers(name), deals(title)';

const SORT_COLUMN_MAP: Record<TaskListQuery['sortBy'], string> = {
  title: 'title',
  dueDate: 'due_date',
  priority: 'priority',
  createdAt: 'created_at',
};

function normalizeOptionalStrings<T extends Record<string, unknown>>(input: T): T {
  const result = { ...input };
  for (const key of Object.keys(result)) {
    if (result[key as keyof T] === '') {
      (result as Record<string, unknown>)[key] = null;
    }
  }
  return result;
}

export interface PaginatedTasks {
  items: Task[];
  total: number;
}

export async function listTasks(
  organizationId: string,
  query: TaskListQuery,
): Promise<PaginatedTasks> {
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  let request = supabaseAdmin
    .from('tasks')
    .select(SELECT_COLUMNS, { count: 'exact' })
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (query.search) {
    request = request.ilike('title', `%${query.search}%`);
  }
  if (query.status) {
    request = request.eq('status', query.status);
  }
  if (query.priority) {
    request = request.eq('priority', query.priority);
  }
  if (query.assigneeId) {
    request = request.eq('assignee_id', query.assigneeId);
  }
  if (query.customerId) {
    request = request.eq('customer_id', query.customerId);
  }
  if (query.dealId) {
    request = request.eq('deal_id', query.dealId);
  }
  if (query.dueBefore) {
    request = request.lte('due_date', query.dueBefore);
  }
  if (query.dueAfter) {
    request = request.gte('due_date', query.dueAfter);
  }

  const { data, error, count } = await request
    .order(SORT_COLUMN_MAP[query.sortBy], { ascending: query.sortDir === 'asc' })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to list tasks: ${error.message}`);
  }

  return {
    items: (data ?? []).map((row) => toTask(row as unknown as TaskRow)),
    total: count ?? 0,
  };
}

/** Every non-deleted task, unpaginated — used by board/calendar views. */
export async function listAllTasks(organizationId: string): Promise<Task[]> {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select(SELECT_COLUMNS)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('due_date', { ascending: true });

  if (error || !data) return [];
  return (data as unknown as TaskRow[]).map(toTask);
}

export async function getTaskById(organizationId: string, taskId: string): Promise<Task | null> {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select(SELECT_COLUMNS)
    .eq('organization_id', organizationId)
    .eq('id', taskId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return null;
  return toTask(data as unknown as TaskRow);
}

export async function createTask(
  organizationId: string,
  createdBy: string,
  input: CreateTaskInput,
): Promise<Task> {
  const normalized = normalizeOptionalStrings(input);

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .insert({
      organization_id: organizationId,
      title: normalized.title,
      description: normalized.description ?? null,
      status: normalized.status,
      priority: normalized.priority,
      due_date: normalized.dueDate ?? null,
      assignee_id: normalized.assigneeId ?? null,
      customer_id: normalized.customerId ?? null,
      deal_id: normalized.dealId ?? null,
      created_by: createdBy,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(`Failed to create task: ${error?.message}`);
  }

  return toTask(data as unknown as TaskRow);
}

export async function updateTask(
  organizationId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<Task | null> {
  const normalized = normalizeOptionalStrings(input);

  const patch: Record<string, unknown> = {};
  if (normalized.title !== undefined) patch.title = normalized.title;
  if (normalized.description !== undefined) patch.description = normalized.description ?? null;
  if (normalized.priority !== undefined) patch.priority = normalized.priority;
  if (normalized.dueDate !== undefined) patch.due_date = normalized.dueDate ?? null;
  if (normalized.assigneeId !== undefined) patch.assignee_id = normalized.assigneeId ?? null;
  if (normalized.customerId !== undefined) patch.customer_id = normalized.customerId ?? null;
  if (normalized.dealId !== undefined) patch.deal_id = normalized.dealId ?? null;

  if (normalized.status !== undefined) {
    patch.status = normalized.status;
    patch.completed_at = normalized.status === 'COMPLETED' ? new Date().toISOString() : null;
  }

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .update(patch)
    .eq('organization_id', organizationId)
    .eq('id', taskId)
    .is('deleted_at', null)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error || !data) return null;
  return toTask(data as unknown as TaskRow);
}

export async function softDeleteTask(organizationId: string, taskId: string): Promise<boolean> {
  const { error, data } = await supabaseAdmin
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('id', taskId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  return !error && Boolean(data);
}
