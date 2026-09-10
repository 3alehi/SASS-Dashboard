import { z } from 'zod';

export const PIPELINE_STAGE_KINDS = ['OPEN', 'WON', 'LOST'] as const;
export type PipelineStageKind = (typeof PIPELINE_STAGE_KINDS)[number];

export const pipelineStageSchema = z.object({
  id: z.string().uuid(),
  pipelineId: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  kind: z.enum(PIPELINE_STAGE_KINDS),
  probability: z.number().min(0).max(100),
  sortOrder: z.number(),
});
export type PipelineStage = z.infer<typeof pipelineStageSchema>;

export const pipelineSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  isDefault: z.boolean(),
  stages: z.array(pipelineStageSchema),
});
export type Pipeline = z.infer<typeof pipelineSchema>;
