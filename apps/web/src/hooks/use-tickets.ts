import type {
  CreateTicketInput,
  CreateTicketMessageInput,
  TicketListQuery,
  UpdateTicketInput,
} from '@nexora/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePermissions } from '@/hooks/use-permissions';
import {
  createTicket,
  createTicketMessage,
  deleteTicket,
  fetchTicket,
  fetchTicketMessages,
  fetchTickets,
  updateTicket,
} from '@/services/tickets-service';

function useActiveOrganizationId(): string | undefined {
  return usePermissions().activeMembership?.organizationId;
}

export function useTickets(query: Partial<TicketListQuery>) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['tickets', organizationId, query],
    queryFn: () => fetchTickets(organizationId!, query),
    enabled: Boolean(organizationId),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}

export function useTicket(ticketId: string | undefined) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['tickets', organizationId, 'detail', ticketId],
    queryFn: () => fetchTicket(organizationId!, ticketId!),
    enabled: Boolean(organizationId) && Boolean(ticketId),
  });
}

export function useTicketMessages(ticketId: string | undefined) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['tickets', organizationId, 'messages', ticketId],
    queryFn: () => fetchTicketMessages(organizationId!, ticketId!),
    enabled: Boolean(organizationId) && Boolean(ticketId),
    staleTime: 10 * 1000,
  });
}

export function useCreateTicket() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTicketInput) => createTicket(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', organizationId] });
    },
  });
}

export function useUpdateTicket() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, input }: { ticketId: string; input: UpdateTicketInput }) =>
      updateTicket(organizationId!, ticketId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', organizationId] });
      queryClient.invalidateQueries({
        queryKey: ['tickets', organizationId, 'detail', variables.ticketId],
      });
    },
  });
}

export function useDeleteTicket() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: string) => deleteTicket(organizationId!, ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', organizationId] });
    },
  });
}

export function useCreateTicketMessage() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, input }: { ticketId: string; input: CreateTicketMessageInput }) =>
      createTicketMessage(organizationId!, ticketId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tickets', organizationId, 'messages', variables.ticketId],
      });
    },
  });
}
