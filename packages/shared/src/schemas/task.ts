import { z } from 'zod';

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const taskSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  dueDate: z.string().nullable(),
  completedAt: z.string().nullable(),
  assigneeId: z.string().uuid().nullable(),
  assigneeName: z.string().nullable(),
  customerId: z.string().uuid().nullable(),
  customerName: z.string().nullable(),
  dealId: z.string().uuid().nullable(),
  dealTitle: z.string().nullable(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});
export type Task = z.infer<typeof taskSchema>;

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  status: z.enum(TASK_STATUSES).default('OPEN'),
  priority: z.enum(TASK_PRIORITIES).default('MEDIUM'),
  dueDate: z.string().trim().optional().or(z.literal('')),
  assigneeId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid().optional().nullable(),
  dealId: z.string().uuid().optional().nullable(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial();
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const taskListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().trim().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assigneeId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  dueBefore: z.string().trim().optional(),
  dueAfter: z.string().trim().optional(),
  sortBy: z.enum(['title', 'dueDate', 'priority', 'createdAt']).default('dueDate'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
});
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;

export const taskCommentSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  taskId: z.string().uuid(),
  authorId: z.string().uuid(),
  authorName: z.string().nullable(),
  body: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TaskComment = z.infer<typeof taskCommentSchema>;

export const createTaskCommentSchema = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty').max(5000),
});
export type CreateTaskCommentInput = z.infer<typeof createTaskCommentSchema>;
