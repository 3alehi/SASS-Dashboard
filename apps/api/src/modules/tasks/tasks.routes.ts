import {
  createTaskCommentSchema,
  createTaskSchema,
  taskCommentSchema,
  taskListQuerySchema,
  taskSchema,
  updateTaskSchema,
} from '@nexora/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requirePermission } from '@/modules/rbac/require-permission.js';
import { createTaskComment, listTaskComments } from '@/modules/tasks/task-comments.repository.js';
import {
  createTask,
  getTaskById,
  listAllTasks,
  listTasks,
  softDeleteTask,
  updateTask,
} from '@/modules/tasks/tasks.repository.js';

const paramsSchema = z.object({ organizationId: z.string().uuid() });
const taskParamsSchema = paramsSchema.extend({ taskId: z.string().uuid() });

const taskResponseSchema = z.object({ success: z.literal(true), data: taskSchema });
const taskListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(taskSchema),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
const taskArrayResponseSchema = z.object({ success: z.literal(true), data: z.array(taskSchema) });
const commentListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(taskCommentSchema),
});
const commentResponseSchema = z.object({ success: z.literal(true), data: taskCommentSchema });
const okResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ ok: z.literal(true) }),
});
const notFoundResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }),
});

export const tasksRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/organizations/:organizationId/tasks',
    {
      preHandler: [app.authenticate, requirePermission('tasks.read')],
      schema: {
        tags: ['tasks'],
        summary: 'List tasks (paginated)',
        params: paramsSchema,
        querystring: taskListQuerySchema,
        response: { 200: taskListResponseSchema },
      },
    },
    async (request) => {
      const { organizationId } = request.params;
      const query = request.query;
      const { items, total } = await listTasks(organizationId, query);

      return {
        success: true as const,
        data: {
          items,
          page: query.page,
          pageSize: query.pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
        },
      };
    },
  );

  app.get(
    '/organizations/:organizationId/tasks/board',
    {
      preHandler: [app.authenticate, requirePermission('tasks.read')],
      schema: {
        tags: ['tasks'],
        summary: 'Every open task, unpaginated (feeds the board and calendar views)',
        params: paramsSchema,
        response: { 200: taskArrayResponseSchema },
      },
    },
    async (request) => {
      const { organizationId } = request.params;
      const tasks = await listAllTasks(organizationId);
      return { success: true as const, data: tasks };
    },
  );

  app.get(
    '/organizations/:organizationId/tasks/:taskId',
    {
      preHandler: [app.authenticate, requirePermission('tasks.read')],
      schema: {
        tags: ['tasks'],
        summary: 'Get a task by id',
        params: taskParamsSchema,
        response: { 200: taskResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, taskId } = request.params;
      const task = await getTaskById(organizationId, taskId);

      if (!task) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Task not found.' },
        });
      }

      return { success: true as const, data: task };
    },
  );

  app.post(
    '/organizations/:organizationId/tasks',
    {
      preHandler: [app.authenticate, requirePermission('tasks.create')],
      schema: {
        tags: ['tasks'],
        summary: 'Create a task',
        params: paramsSchema,
        body: createTaskSchema,
        response: { 201: taskResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId } = request.params;
      const task = await createTask(organizationId, request.user.id, request.body);
      return reply.code(201).send({ success: true as const, data: task });
    },
  );

  app.patch(
    '/organizations/:organizationId/tasks/:taskId',
    {
      preHandler: [app.authenticate, requirePermission('tasks.update')],
      schema: {
        tags: ['tasks'],
        summary: 'Update a task (status changes stamp/clear completed_at automatically)',
        params: taskParamsSchema,
        body: updateTaskSchema,
        response: { 200: taskResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, taskId } = request.params;
      const task = await updateTask(organizationId, taskId, request.body);

      if (!task) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Task not found.' },
        });
      }

      return { success: true as const, data: task };
    },
  );

  app.delete(
    '/organizations/:organizationId/tasks/:taskId',
    {
      preHandler: [app.authenticate, requirePermission('tasks.delete')],
      schema: {
        tags: ['tasks'],
        summary: 'Delete a task',
        params: taskParamsSchema,
        response: { 200: okResponseSchema, 404: notFoundResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, taskId } = request.params;
      const ok = await softDeleteTask(organizationId, taskId);

      if (!ok) {
        return reply.code(404).send({
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Task not found.' },
        });
      }

      return { success: true as const, data: { ok: true as const } };
    },
  );

  app.get(
    '/organizations/:organizationId/tasks/:taskId/comments',
    {
      preHandler: [app.authenticate, requirePermission('tasks.read')],
      schema: {
        tags: ['tasks'],
        summary: 'List comments on a task',
        params: taskParamsSchema,
        response: { 200: commentListResponseSchema },
      },
    },
    async (request) => {
      const { organizationId, taskId } = request.params;
      const comments = await listTaskComments(organizationId, taskId);
      return { success: true as const, data: comments };
    },
  );

  app.post(
    '/organizations/:organizationId/tasks/:taskId/comments',
    {
      preHandler: [app.authenticate, requirePermission('tasks.update')],
      schema: {
        tags: ['tasks'],
        summary: 'Add a comment to a task',
        params: taskParamsSchema,
        body: createTaskCommentSchema,
        response: { 201: commentResponseSchema },
      },
    },
    async (request, reply) => {
      const { organizationId, taskId } = request.params;
      const comment = await createTaskComment(
        organizationId,
        taskId,
        request.user.id,
        request.body.body,
      );
      return reply.code(201).send({ success: true as const, data: comment });
    },
  );
};
