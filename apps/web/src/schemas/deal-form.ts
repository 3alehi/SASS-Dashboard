import { createDealSchema } from '@nexora/shared';
import { z } from 'zod';

export const dealFormSchema = createDealSchema;
export type DealFormInput = z.infer<typeof dealFormSchema>;
