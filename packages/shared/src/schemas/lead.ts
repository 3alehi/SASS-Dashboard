import { z } from 'zod';

export const LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = [
  'Website',
  'Referral',
  'Cold Outreach',
  'Event',
  'Advertisement',
  'Social Media',
  'Partner',
  'Other',
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const leadSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  fullName: z.string(),
  company: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  status: z.enum(LEAD_STATUSES),
  source: z.string().nullable(),
  value: z.number().nullable(),
  ownerId: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  convertedCustomerId: z.string().uuid().nullable(),
  convertedAt: z.string().nullable(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});
export type Lead = z.infer<typeof leadSchema>;

export const createLeadSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required').max(200),
  company: z.string().trim().max(200).optional().or(z.literal('')),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  status: z.enum(LEAD_STATUSES).default('NEW'),
  source: z.string().trim().max(100).optional().or(z.literal('')),
  value: z.coerce.number().min(0).optional(),
  ownerId: z.string().uuid().optional().nullable(),
  notes: z.string().trim().max(5000).optional().or(z.literal('')),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = createLeadSchema.partial();
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const leadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  ownerId: z.string().uuid().optional(),
  sortBy: z.enum(['fullName', 'value', 'createdAt']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});
export type LeadListQuery = z.infer<typeof leadListQuerySchema>;

export const convertLeadSchema = z.object({
  createDeal: z.boolean().default(false),
  pipelineId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
  dealValue: z.coerce.number().min(0).optional(),
});
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;

export const convertLeadResultSchema = z.object({
  customerId: z.string().uuid(),
  contactId: z.string().uuid(),
  dealId: z.string().uuid().nullable(),
});
export type ConvertLeadResult = z.infer<typeof convertLeadResultSchema>;
