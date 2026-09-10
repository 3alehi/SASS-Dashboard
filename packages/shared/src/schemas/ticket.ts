import { z } from 'zod';

export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const ticketSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  ticketNumber: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  customerId: z.string().uuid().nullable(),
  customerName: z.string().nullable(),
  priority: z.enum(TICKET_PRIORITIES),
  status: z.enum(TICKET_STATUSES),
  category: z.string().nullable(),
  assignedAgentId: z.string().uuid().nullable(),
  assignedAgentName: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});
export type Ticket = z.infer<typeof ticketSchema>;

export const createTicketSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  customerId: z.string().uuid().optional().nullable(),
  priority: z.enum(TICKET_PRIORITIES).default('MEDIUM'),
  status: z.enum(TICKET_STATUSES).default('OPEN'),
  category: z.string().trim().max(100).optional().or(z.literal('')),
  assignedAgentId: z.string().uuid().optional().nullable(),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketSchema = createTicketSchema.partial();
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

export const ticketListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  assignedAgentId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  sortBy: z.enum(['ticketNumber', 'title', 'priority', 'createdAt']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});
export type TicketListQuery = z.infer<typeof ticketListQuerySchema>;

export const ticketMessageSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  ticketId: z.string().uuid(),
  authorId: z.string().uuid().nullable(),
  authorName: z.string().nullable(),
  body: z.string(),
  isInternal: z.boolean(),
  createdAt: z.string(),
});
export type TicketMessage = z.infer<typeof ticketMessageSchema>;

export const createTicketMessageSchema = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty').max(10000),
  isInternal: z.boolean().default(false),
});
export type CreateTicketMessageInput = z.infer<typeof createTicketMessageSchema>;
