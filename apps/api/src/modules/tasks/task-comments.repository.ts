import type { TaskComment } from '@nexora/shared';

import { supabaseAdmin } from '@/lib/supabase-admin.js';

interface TaskCommentRow {
  id: string;
  organization_id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
}

function toComment(row: TaskCommentRow): TaskComment {
  const author = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

  return {
    id: row.id,
    organizationId: row.organization_id,
    taskId: row.task_id,
    authorId: row.author_id,
    authorName: author?.full_name ?? null,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_COLUMNS = '*, profiles!task_comments_author_id_fkey(full_name)';

export async function listTaskComments(organizationId: string, taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabaseAdmin
    .from('task_comments')
    .select(SELECT_COLUMNS)
    .eq('organization_id', organizationId)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return (data as unknown as TaskCommentRow[]).map(toComment);
}

export async function createTaskComment(
  organizationId: string,
  taskId: string,
  authorId: string,
  body: string,
): Promise<TaskComment> {
  const { data, error } = await supabaseAdmin
    .from('task_comments')
    .insert({ organization_id: organizationId, task_id: taskId, author_id: authorId, body })
    .select(SELECT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(`Failed to create task comment: ${error?.message}`);
  }

  return toComment(data as unknown as TaskCommentRow);
}
