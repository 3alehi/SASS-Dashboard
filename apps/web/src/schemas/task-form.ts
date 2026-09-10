import { createTaskSchema } from '@nexora/shared';
import { z } from 'zod';

export const taskFormSchema = createTaskSchema;
export type TaskFormInput = z.infer<typeof taskFormSchema>;
