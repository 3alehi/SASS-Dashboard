import { z } from 'zod';

export const DATE_RANGE_PRESETS = ['7d', '30d', '90d', 'this_year', 'custom'] as const;
export type DateRangePreset = (typeof DATE_RANGE_PRESETS)[number];

export const dashboardQuerySchema = z.object({
  preset: z.enum(DATE_RANGE_PRESETS).default('30d'),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  compare: z.coerce.boolean().default(false),
});
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

export const kpiValueSchema = z.object({
  current: z.number(),
  previous: z.number().nullable(),
  changePercent: z.number().nullable(),
});
export type KpiValue = z.infer<typeof kpiValueSchema>;

export const dashboardOverviewSchema = z.object({
  revenue: kpiValueSchema,
  pipelineValue: kpiValueSchema,
  wonDeals: kpiValueSchema,
  conversionRate: kpiValueSchema,
  newCustomers: kpiValueSchema,
  openTasks: kpiValueSchema,
});
export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;

export const timeSeriesPointSchema = z.object({
  date: z.string(),
  value: z.number(),
});
export type TimeSeriesPoint = z.infer<typeof timeSeriesPointSchema>;

export const revenueSeriesSchema = z.object({
  current: z.array(timeSeriesPointSchema),
  previous: z.array(timeSeriesPointSchema),
});
export type RevenueSeries = z.infer<typeof revenueSeriesSchema>;

export const stageValueSchema = z.object({
  stageId: z.string().uuid(),
  stageName: z.string(),
  value: z.number(),
  count: z.number(),
});
export type StageValue = z.infer<typeof stageValueSchema>;

export const wonLostPointSchema = z.object({
  date: z.string(),
  won: z.number(),
  lost: z.number(),
});
export type WonLostPoint = z.infer<typeof wonLostPointSchema>;

export const leadConversionStageSchema = z.object({
  status: z.string(),
  count: z.number(),
});
export type LeadConversionStage = z.infer<typeof leadConversionStageSchema>;

export const salesPerformanceEntrySchema = z.object({
  ownerId: z.string().uuid().nullable(),
  ownerName: z.string(),
  wonValue: z.number(),
  dealCount: z.number(),
});
export type SalesPerformanceEntry = z.infer<typeof salesPerformanceEntrySchema>;
