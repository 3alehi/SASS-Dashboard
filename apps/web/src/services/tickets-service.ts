import type {
  CreateTicketInput,
  CreateTicketMessageInput,
  PaginatedResult,
  Ticket,
  TicketListQuery,
  TicketMessage,
  UpdateTicketInput,
} from '@nexora/shared';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/services/api-client';

function basePath(organizationId: string): string {
  return `/organizations/${organizationId}/tickets`;
}

export function fetchTickets(
  organizationId: string,
  query: Partial<TicketListQuery>,
): Promise<PaginatedResult<Ticket>> {
  return apiGet<PaginatedResult<Ticket>>(basePath(organizationId), {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    status: query.status,
    priority: query.priority,
    assignedAgentId: query.assignedAgentId,
    customerId: query.customerId,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
  });
}

export function fetchTicket(organizationId: string, ticketId: string): Promise<Ticket> {
  return apiGet<Ticket>(`${basePath(organizationId)}/${ticketId}`);
}

export function createTicket(organizationId: string, input: CreateTicketInput): Promise<Ticket> {
  return apiPost<Ticket>(basePath(organizationId), input);
}

export function updateTicket(
  organizationId: string,
  ticketId: string,
  input: UpdateTicketInput,
): Promise<Ticket> {
  return apiPatch<Ticket>(`${basePath(organizationId)}/${ticketId}`, input);
}

export function deleteTicket(organizationId: string, ticketId: string): Promise<{ ok: true }> {
  return apiDelete<{ ok: true }>(`${basePath(organizationId)}/${ticketId}`);
}

export function fetchTicketMessages(
  organizationId: string,
  ticketId: string,
): Promise<TicketMessage[]> {
  return apiGet<TicketMessage[]>(`${basePath(organizationId)}/${ticketId}/messages`);
}

export function createTicketMessage(
  organizationId: string,
  ticketId: string,
  input: CreateTicketMessageInput,
): Promise<TicketMessage> {
  return apiPost<TicketMessage>(`${basePath(organizationId)}/${ticketId}/messages`, input);
}
