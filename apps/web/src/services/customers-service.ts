import type {
  Customer,
  CustomerListQuery,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@nexora/shared';
import type { PaginatedResult } from '@nexora/shared';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/services/api-client';

function basePath(organizationId: string): string {
  return `/organizations/${organizationId}/customers`;
}

export function fetchCustomers(
  organizationId: string,
  query: Partial<CustomerListQuery>,
): Promise<PaginatedResult<Customer>> {
  return apiGet<PaginatedResult<Customer>>(basePath(organizationId), {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    status: query.status,
    ownerId: query.ownerId,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
  });
}

export function fetchCustomer(organizationId: string, customerId: string): Promise<Customer> {
  return apiGet<Customer>(`${basePath(organizationId)}/${customerId}`);
}

export function createCustomer(
  organizationId: string,
  input: CreateCustomerInput,
): Promise<Customer> {
  return apiPost<Customer>(basePath(organizationId), input);
}

export function updateCustomer(
  organizationId: string,
  customerId: string,
  input: UpdateCustomerInput,
): Promise<Customer> {
  return apiPatch<Customer>(`${basePath(organizationId)}/${customerId}`, input);
}

export function archiveCustomer(organizationId: string, customerId: string): Promise<{ ok: true }> {
  return apiDelete<{ ok: true }>(`${basePath(organizationId)}/${customerId}`);
}

export function restoreCustomer(organizationId: string, customerId: string): Promise<{ ok: true }> {
  return apiPost<{ ok: true }>(`${basePath(organizationId)}/${customerId}/restore`);
}
