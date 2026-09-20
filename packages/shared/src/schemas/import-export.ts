import { z } from 'zod';

export const EXPORTABLE_ENTITIES = ['customers', 'leads', 'deals', 'tasks', 'tickets'] as const;
export type ExportableEntity = (typeof EXPORTABLE_ENTITIES)[number];

export const IMPORTABLE_ENTITIES = ['customers', 'leads'] as const;
export type ImportableEntity = (typeof IMPORTABLE_ENTITIES)[number];

export const importRowResultSchema = z.object({
  row: z.number().int().min(1),
  success: z.boolean(),
  id: z.string().uuid().nullable(),
  error: z.string().nullable(),
});
export type ImportRowResult = z.infer<typeof importRowResultSchema>;

export const importResultSchema = z.object({
  totalRows: z.number().int().min(0),
  successCount: z.number().int().min(0),
  errorCount: z.number().int().min(0),
  results: z.array(importRowResultSchema),
});
export type ImportResult = z.infer<typeof importResultSchema>;
