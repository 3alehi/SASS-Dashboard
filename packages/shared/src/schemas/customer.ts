import { z } from 'zod';

export const CUSTOMER_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export const customerSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  company: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  status: z.enum(CUSTOMER_STATUSES),
  source: z.string().nullable(),
  industry: z.string().nullable(),
  value: z.number(),
  ownerId: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  lastActivityAt: z.string().nullable(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});
export type Customer = z.infer<typeof customerSchema>;

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  company: z.string().trim().max(200).optional().or(z.literal('')),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  website: z.string().trim().max(200).optional().or(z.literal('')),
  status: z.enum(CUSTOMER_STATUSES).default('ACTIVE'),
  source: z.string().trim().max(100).optional().or(z.literal('')),
  industry: z.string().trim().max(100).optional().or(z.literal('')),
  value: z.coerce.number().min(0).default(0),
  ownerId: z.string().uuid().optional().nullable(),
  notes: z.string().trim().max(5000).optional().or(z.literal('')),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial();
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export const customerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(CUSTOMER_STATUSES).optional(),
  ownerId: z.string().uuid().optional(),
  sortBy: z.enum(['name', 'company', 'value', 'createdAt', 'lastActivityAt']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
