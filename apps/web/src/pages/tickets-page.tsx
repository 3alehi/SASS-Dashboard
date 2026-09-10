import type { Ticket, TicketPriority, TicketStatus } from '@nexora/shared';
import { TICKET_PRIORITIES, TICKET_STATUSES } from '@nexora/shared';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { LifeBuoy, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Can } from '@/components/auth/can';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
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
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTickets } from '@/hooks/use-tickets';
import { TicketFormDialog } from '@/pages/tickets/ticket-form-dialog';
import { TicketPriorityBadge } from '@/pages/tickets/ticket-priority-badge';
import { TicketStatusBadge } from '@/pages/tickets/ticket-status-badge';

export function TicketsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'ALL'>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError, refetch } = useTickets({
    page,
    pageSize: 20,
    search: debouncedSearch || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
  });

  const columns = useMemo<ColumnDef<Ticket, unknown>[]>(
    () => [
      {
        accessorKey: 'ticketNumber',
        header: '#',
        cell: ({ row }) => (
          <span className="text-muted-foreground">#{row.original.ticketNumber}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Ticket',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.title}</p>
            {row.original.customerName && (
              <p className="text-xs text-muted-foreground">{row.original.customerName}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <TicketStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => <TicketPriorityBadge priority={row.original.priority} />,
      },
      {
        accessorKey: 'assignedAgentName',
        header: 'Agent',
        cell: ({ row }) =>
          row.original.assignedAgentName || (
            <span className="text-muted-foreground">Unassigned</span>
          ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
      },
    ],
    [],
  );

  if (isError) {
    return (
      <div>
        <PageHeader title="Tickets" description="Resolve customer support requests as a team." />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Tickets"
        description="Resolve customer support requests as a team."
        actions={
          <Can permission="tickets.create">
            <Button onClick={() => setFormOpen(true)}>
              <Plus />
              New ticket
            </Button>
          </Can>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tickets…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as TicketStatus | 'ALL');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {TICKET_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(value) => {
            setPriorityFilter(value as TicketPriority | 'ALL');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All priorities</SelectItem>
            {TICKET_PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority.charAt(0) + priority.slice(1).toLowerCase()}
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
        onRowClick={(row) => navigate(`/app/tickets/${row.id}`)}
        emptyState={
          <EmptyState
            icon={LifeBuoy}
            title={debouncedSearch ? 'No matching tickets' : 'No tickets yet'}
            description={
              debouncedSearch
                ? 'Try adjusting your search or filters.'
                : 'Create a ticket to get started.'
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

      <TicketFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
