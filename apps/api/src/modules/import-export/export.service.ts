import type { Customer, Deal, ExportableEntity, Lead, Task, Ticket } from '@nexora/shared';
import { stringify } from 'csv-stringify/sync';

import { listCustomers } from '@/modules/customers/customers.repository.js';
import { listDeals } from '@/modules/deals/deals.repository.js';
import { listLeads } from '@/modules/leads/leads.repository.js';
import { listTasks } from '@/modules/tasks/tasks.repository.js';
import { listTickets } from '@/modules/tickets/tickets.repository.js';

const EXPORT_PAGE_SIZE = 100;

/**
 * Every list repository caps pageSize at 100 for normal UI pagination, so a
 * full-organization export loops pages server-side rather than asking the
 * caller to pick an unbounded pageSize the schemas don't allow.
 */
async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<{ items: T[]; total: number }>,
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;

  for (;;) {
    const { items, total } = await fetchPage(page);
    all.push(...items);
    if (all.length >= total || items.length === 0) break;
    page += 1;
  }

  return all;
}

const CUSTOMER_COLUMNS: Array<{ key: keyof Customer; header: string }> = [
  { key: 'name', header: 'Name' },
  { key: 'company', header: 'Company' },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Phone' },
  { key: 'website', header: 'Website' },
  { key: 'status', header: 'Status' },
  { key: 'source', header: 'Source' },
  { key: 'industry', header: 'Industry' },
  { key: 'value', header: 'Value' },
  { key: 'notes', header: 'Notes' },
  { key: 'createdAt', header: 'Created At' },
];

const LEAD_COLUMNS: Array<{ key: keyof Lead; header: string }> = [
  { key: 'fullName', header: 'Full Name' },
  { key: 'company', header: 'Company' },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Phone' },
  { key: 'status', header: 'Status' },
  { key: 'source', header: 'Source' },
  { key: 'value', header: 'Value' },
  { key: 'notes', header: 'Notes' },
  { key: 'createdAt', header: 'Created At' },
];

const DEAL_COLUMNS: Array<{ key: keyof Deal; header: string }> = [
  { key: 'title', header: 'Title' },
  { key: 'customerName', header: 'Customer' },
  { key: 'value', header: 'Value' },
  { key: 'probability', header: 'Probability' },
  { key: 'expectedCloseDate', header: 'Expected Close Date' },
  { key: 'closedAt', header: 'Closed At' },
  { key: 'notes', header: 'Notes' },
  { key: 'createdAt', header: 'Created At' },
];

const TASK_COLUMNS: Array<{ key: keyof Task; header: string }> = [
  { key: 'title', header: 'Title' },
  { key: 'description', header: 'Description' },
  { key: 'status', header: 'Status' },
  { key: 'priority', header: 'Priority' },
  { key: 'dueDate', header: 'Due Date' },
  { key: 'completedAt', header: 'Completed At' },
  { key: 'assigneeName', header: 'Assignee' },
  { key: 'customerName', header: 'Customer' },
  { key: 'dealTitle', header: 'Deal' },
  { key: 'createdAt', header: 'Created At' },
];

const TICKET_COLUMNS: Array<{ key: keyof Ticket; header: string }> = [
  { key: 'ticketNumber', header: 'Ticket #' },
  { key: 'title', header: 'Title' },
  { key: 'description', header: 'Description' },
  { key: 'customerName', header: 'Customer' },
  { key: 'priority', header: 'Priority' },
  { key: 'status', header: 'Status' },
  { key: 'category', header: 'Category' },
  { key: 'assignedAgentName', header: 'Assigned Agent' },
  { key: 'resolvedAt', header: 'Resolved At' },
  { key: 'closedAt', header: 'Closed At' },
  { key: 'createdAt', header: 'Created At' },
];

function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: Array<{ key: keyof T; header: string }>,
): string {
  const records = rows.map((row) =>
    columns.reduce<Record<string, unknown>>((record, column) => {
      record[column.header] = row[column.key] ?? '';
      return record;
    }, {}),
  );

  return stringify(records, { header: true, columns: columns.map((column) => column.header) });
}

export async function exportEntityToCsv(
  organizationId: string,
  entity: ExportableEntity,
): Promise<string> {
  switch (entity) {
    case 'customers': {
      const rows = await fetchAllPages((page) =>
        listCustomers(organizationId, {
          page,
          pageSize: EXPORT_PAGE_SIZE,
          sortBy: 'createdAt',
          sortDir: 'desc',
        }),
      );
      return toCsv(rows, CUSTOMER_COLUMNS);
    }
    case 'leads': {
      const rows = await fetchAllPages((page) =>
        listLeads(organizationId, {
          page,
          pageSize: EXPORT_PAGE_SIZE,
          sortBy: 'createdAt',
          sortDir: 'desc',
        }),
      );
      return toCsv(rows, LEAD_COLUMNS);
    }
    case 'deals': {
      const rows = await fetchAllPages((page) =>
        listDeals(organizationId, {
          page,
          pageSize: EXPORT_PAGE_SIZE,
          sortBy: 'createdAt',
          sortDir: 'desc',
        }),
      );
      return toCsv(rows, DEAL_COLUMNS);
    }
    case 'tasks': {
      const rows = await fetchAllPages((page) =>
        listTasks(organizationId, {
          page,
          pageSize: EXPORT_PAGE_SIZE,
          sortBy: 'createdAt',
          sortDir: 'desc',
        }),
      );
      return toCsv(rows, TASK_COLUMNS);
    }
    case 'tickets': {
      const rows = await fetchAllPages((page) =>
        listTickets(organizationId, {
          page,
          pageSize: EXPORT_PAGE_SIZE,
          sortBy: 'createdAt',
          sortDir: 'desc',
        }),
      );
      return toCsv(rows, TICKET_COLUMNS);
    }
  }
}
