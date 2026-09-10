import { describe, expect, it } from 'vitest';

import {
  createTaskCommentSchema,
  createTaskSchema,
  taskListQuerySchema,
  updateTaskSchema,
} from './task.js';

describe('createTaskSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = createTaskSchema.safeParse({ title: 'Follow up with Acme' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('OPEN');
      expect(result.data.priority).toBe('MEDIUM');
    }
  });

  it('rejects an empty title', () => {
    const result = createTaskSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid priority', () => {
    const result = createTaskSchema.safeParse({ title: 'Task', priority: 'CRITICAL' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status', () => {
    const result = createTaskSchema.safeParse({ title: 'Task', status: 'DONE' });
    expect(result.success).toBe(false);
  });
});

describe('updateTaskSchema', () => {
  it('accepts a partial payload', () => {
    const result = updateTaskSchema.safeParse({ status: 'COMPLETED' });
    expect(result.success).toBe(true);
  });
});

describe('taskListQuerySchema', () => {
  it('applies defaults', () => {
    const result = taskListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortBy).toBe('dueDate');
      expect(result.data.sortDir).toBe('asc');
    }
  });

  it('rejects an invalid priority filter', () => {
    const result = taskListQuerySchema.safeParse({ priority: 'EXTREME' });
    expect(result.success).toBe(false);
  });
});

describe('createTaskCommentSchema', () => {
  it('rejects an empty comment body', () => {
    const result = createTaskCommentSchema.safeParse({ body: '' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid comment body', () => {
    const result = createTaskCommentSchema.safeParse({ body: 'Called the client, they agreed.' });
    expect(result.success).toBe(true);
  });
});
