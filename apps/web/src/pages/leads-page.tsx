import type { Lead, LeadStatus } from '@nexora/shared';
import { LEAD_STATUSES } from '@nexora/shared';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { MoreHorizontal, Plus, Search, Target, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Can } from '@/components/auth/can';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useDeleteLead, useLeads } from '@/hooks/use-leads';
import { useToast } from '@/hooks/use-toast';
import { LeadFormDialog } from '@/pages/leads/lead-form-dialog';
import { LeadStatusBadge } from '@/pages/leads/lead-status-badge';

const STATUS_FILTER_OPTIONS: Array<{ label: string; value: LeadStatus | 'ALL' }> = [
  { label: 'All statuses', value: 'ALL' },
  ...LEAD_STATUSES.map((status) => ({
    label: status.charAt(0) + status.slice(1).toLowerCase(),
    value: status,
  })),
];

export function LeadsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError, refetch } = useLeads({
    page,
    pageSize: 20,
    search: debouncedSearch || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  const deleteMutation = useDeleteLead();

  function openCreateDialog() {
    setEditingLead(undefined);
    setFormOpen(true);
  }

  function openEditDialog(lead: Lead) {
    setEditingLead(lead);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({ title: 'Lead deleted' });
      setDeleteTarget(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not delete lead',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  const columns = useMemo<ColumnDef<Lead, unknown>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Name',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.fullName}</p>
            {row.original.company && (
              <p className="text-xs text-muted-foreground">{row.original.company}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => row.original.email || <span className="text-muted-foreground">—</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <LeadStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'source',
        header: 'Source',
        cell: ({ row }) => row.original.source || <span className="text-muted-foreground">—</span>,
      },
      {
        accessorKey: 'value',
        header: 'Est. value',
        cell: ({ row }) =>
          row.original.value !== null
            ? row.original.value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
            : '—',
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(event) => event.stopPropagation()}
                aria-label="Lead actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
              <Can permission="leads.update">
                <DropdownMenuItem onSelect={() => openEditDialog(row.original)}>
                  Edit
                </DropdownMenuItem>
              </Can>
              <Can permission="leads.delete">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => setDeleteTarget(row.original)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </Can>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  if (isError) {
    return (
      <div>
        <PageHeader
          title="Leads"
          description="Track and qualify incoming leads through your funnel."
        />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Track and qualify incoming leads through your funnel."
        actions={
          <Can permission="leads.create">
            <Button onClick={openCreateDialog}>
              <Plus />
              New lead
            </Button>
          </Can>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search leads…"
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
              setStatusFilter(value as LeadStatus | 'ALL');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/app/leads/${row.id}`)}
        emptyState={
          <EmptyState
            icon={Target}
            title={debouncedSearch || statusFilter !== 'ALL' ? 'No matching leads' : 'No leads yet'}
            description={
              debouncedSearch || statusFilter !== 'ALL'
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first lead.'
            }
            action={
              !debouncedSearch &&
              statusFilter === 'ALL' && (
                <Can permission="leads.create">
                  <Button onClick={openCreateDialog} size="sm">
                    <Plus />
                    New lead
                  </Button>
                </Can>
              )
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

      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} lead={editingLead} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this lead?"
        description={`"${deleteTarget?.fullName}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
