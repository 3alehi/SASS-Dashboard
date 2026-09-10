import { z } from 'zod';

export const dealSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  title: z.string(),
  customerId: z.string().uuid().nullable(),
  customerName: z.string().nullable(),
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid(),
  ownerId: z.string().uuid().nullable(),
  value: z.number(),
  probability: z.number().min(0).max(100),
  expectedCloseDate: z.string().nullable(),
  closedAt: z.string().nullable(),
  leadId: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});
export type Deal = z.infer<typeof dealSchema>;

export const createDealSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  customerId: z.string().uuid().optional().nullable(),
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid(),
  ownerId: z.string().uuid().optional().nullable(),
  value: z.coerce.number().min(0).default(0),
  probability: z.coerce.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(5000).optional().or(z.literal('')),
});
export type CreateDealInput = z.infer<typeof createDealSchema>;

export const updateDealSchema = createDealSchema.partial();
export type UpdateDealInput = z.infer<typeof updateDealSchema>;

export const moveDealSchema = z.object({
  stageId: z.string().uuid(),
});
export type MoveDealInput = z.infer<typeof moveDealSchema>;

export const dealListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().trim().optional(),
  pipelineId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  sortBy: z.enum(['title', 'value', 'expectedCloseDate', 'createdAt']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});
export type DealListQuery = z.infer<typeof dealListQuerySchema>;

export const pipelineSummarySchema = z.object({
  totalValue: z.number(),
  weightedValue: z.number(),
  wonValue: z.number(),
  wonCount: z.number(),
  lostCount: z.number(),
  openCount: z.number(),
  conversionRate: z.number(),
});
export type PipelineSummary = z.infer<typeof pipelineSummarySchema>;
