import { z } from 'zod';

export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().nullable(),
  industry: z.string().nullable(),
  size: z.string().nullable(),
  website: z.string().nullable(),
  billingEmail: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Organization = z.infer<typeof organizationSchema>;

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200).optional(),
  industry: z.string().trim().max(100).nullable().optional(),
  size: z.string().trim().max(50).nullable().optional(),
  website: z.string().trim().url('Enter a valid URL').or(z.literal('')).nullable().optional(),
  billingEmail: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .or(z.literal(''))
    .nullable()
    .optional(),
  logoUrl: z.string().trim().url('Enter a valid URL').or(z.literal('')).nullable().optional(),
});
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] as const;
export type DateFormat = (typeof DATE_FORMATS)[number];

export const organizationSettingsSchema = z.object({
  organizationId: z.string().uuid(),
  defaultCurrency: z.string(),
  fiscalYearStart: z.number().int().min(1).max(12),
  dateFormat: z.enum(DATE_FORMATS),
});
export type OrganizationSettings = z.infer<typeof organizationSettingsSchema>;

export const updateOrganizationSettingsSchema = z.object({
  defaultCurrency: z
    .string()
    .trim()
    .length(3, 'Use a 3-letter currency code (e.g. USD)')
    .optional(),
  fiscalYearStart: z.number().int().min(1).max(12).optional(),
  dateFormat: z.enum(DATE_FORMATS).optional(),
});
export type UpdateOrganizationSettingsInput = z.infer<typeof updateOrganizationSettingsSchema>;
