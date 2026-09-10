import type { CreateCustomerInput, CustomerListQuery, UpdateCustomerInput } from '@nexora/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePermissions } from '@/hooks/use-permissions';
import {
  archiveCustomer,
  createCustomer,
  fetchCustomer,
  fetchCustomers,
  restoreCustomer,
  updateCustomer,
} from '@/services/customers-service';

function useActiveOrganizationId(): string | undefined {
  return usePermissions().activeMembership?.organizationId;
}

export function useCustomers(query: Partial<CustomerListQuery>) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['customers', organizationId, query],
    queryFn: () => fetchCustomers(organizationId!, query),
    enabled: Boolean(organizationId),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}

export function useCustomer(customerId: string | undefined) {
  const organizationId = useActiveOrganizationId();

  return useQuery({
    queryKey: ['customers', organizationId, 'detail', customerId],
    queryFn: () => fetchCustomer(organizationId!, customerId!),
    enabled: Boolean(organizationId) && Boolean(customerId),
  });
}

export function useCreateCustomer() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomerInput) => createCustomer(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', organizationId] });
    },
  });
}

export function useUpdateCustomer() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, input }: { customerId: string; input: UpdateCustomerInput }) =>
      updateCustomer(organizationId!, customerId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers', organizationId] });
      queryClient.invalidateQueries({
        queryKey: ['customers', organizationId, 'detail', variables.customerId],
      });
    },
  });
}

export function useArchiveCustomer() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId: string) => archiveCustomer(organizationId!, customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', organizationId] });
    },
  });
}

export function useRestoreCustomer() {
  const organizationId = useActiveOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId: string) => restoreCustomer(organizationId!, customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', organizationId] });
    },
  });
}
