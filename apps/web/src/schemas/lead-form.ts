import { createLeadSchema } from '@nexora/shared';
import { z } from 'zod';

/**
 * Thin re-export of the shared createLeadSchema so the frontend never
 * validates something the API would reject — same rationale as
 * schemas/customer-form.ts.
 */
export const leadFormSchema = createLeadSchema;
export type LeadFormInput = z.infer<typeof leadFormSchema>;
