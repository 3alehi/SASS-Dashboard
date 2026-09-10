import { createCustomerSchema } from '@nexora/shared';
import { z } from 'zod';

/**
 * Same shape and rules as the shared createCustomerSchema — re-exported
 * under a form-facing name for clarity in the customers feature. Keeping
 * this as a thin wrapper (rather than a divergent schema) guarantees the
 * frontend never validates something the API would reject.
 */
export const customerFormSchema = createCustomerSchema;
export type CustomerFormInput = z.infer<typeof customerFormSchema>;
