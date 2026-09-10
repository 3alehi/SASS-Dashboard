import { createTicketSchema } from '@nexora/shared';
import { z } from 'zod';

export const ticketFormSchema = createTicketSchema;
export type TicketFormInput = z.infer<typeof ticketFormSchema>;
