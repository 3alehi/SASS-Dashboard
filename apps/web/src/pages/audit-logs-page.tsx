import type { AuditLog } from '@nexora/shared';
import type { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { ScrollText, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/tables/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { AuditActionBadge } from '@/pages/audit-logs/audit-action-badge';

const ENTITY_TYPE_OPTIONS = [
  { label: 'All entities', value: 'ALL' },
  { label: 'Customers', value: 'customer' },
  { label: 'Leads', value: 'lead' },
  { label: 'Deals', value: 'deal' },
  { label: 'Tasks', value: 'task' },
  { label: 'Tickets', value: 'ticket' },
  { label: 'Team members', value: 'team_member' },
];

const PAGE_SIZE = 25;

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('ALL');

  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError, refetch } = useAuditLogs({
    page,
    pageSize: PAGE_SIZE,
    entityType: entityType === 'ALL' ? undefined : entityType,
    action: debouncedSearch || undefined,
  });

  const columns = useMemo<ColumnDef<AuditLog, unknown>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'When',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {format(parseISO(row.original.createdAt), 'MMM d, yyyy · h:mm a')}
          </span>
        ),
      },
      {
        accessorKey: 'actorName',
        header: 'Actor',
        cell: ({ row }) =>
          row.original.actorName || <span className="text-muted-foreground">System</span>,
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => <AuditActionBadge action={row.original.action} />,
      },
      {
        accessorKey: 'entityId',
        header: 'Entity',
        cell: ({ row }) =>
          row.original.entityId ? (
            <span className="font-mono text-xs text-muted-foreground">
              {row.original.entityId.slice(0, 8)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'ipAddress',
        header: 'IP address',
        cell: ({ row }) =>
          row.original.ipAddress || <span className="text-muted-foreground">—</span>,
      },
    ],
    [],
  );

  if (isError) {
    return (
      <div>
        <PageHeader
          title="Audit Logs"
          description="A complete, tamper-evident trail of activity in your organization."
        />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="A complete, tamper-evident trail of activity in your organization."
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by action (e.g. customer.delete)…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={entityType}
          onValueChange={(value) => {
            setEntityType(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyState={
          <EmptyState
            icon={ScrollText}
            title={
              debouncedSearch || entityType !== 'ALL' ? 'No matching activity' : 'No activity yet'
            }
            description={
              debouncedSearch || entityType !== 'ALL'
                ? 'Try adjusting your search or filters.'
                : 'Actions like creating, updating, or deleting records will appear here.'
            }
          />
        }
      />

      {data && data.total > 0 && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={setPage}
          className="mt-4"
        />
      )}
    </div>
  );
}
