import type { Customer, CustomerStatus } from '@nexora/shared';
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Archive, Building2, MoreHorizontal, Plus, Search } from 'lucide-react';
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
import { useArchiveCustomer, useCustomers } from '@/hooks/use-customers';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useToast } from '@/hooks/use-toast';
import { CustomerFormDialog } from '@/pages/customers/customer-form-dialog';
import { CustomerStatusBadge } from '@/pages/customers/customer-status-badge';

const STATUS_FILTER_OPTIONS: Array<{ label: string; value: CustomerStatus | 'ALL' }> = [
  { label: 'All statuses', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Archived', value: 'ARCHIVED' },
];

export function CustomersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'ALL'>('ALL');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
  const [archiveTarget, setArchiveTarget] = useState<Customer | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError, refetch } = useCustomers({
    page,
    pageSize: 20,
    search: debouncedSearch || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  const archiveMutation = useArchiveCustomer();

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  function openCreateDialog() {
    setEditingCustomer(undefined);
    setFormOpen(true);
  }

  function openEditDialog(customer: Customer) {
    setEditingCustomer(customer);
    setFormOpen(true);
  }

  async function handleArchive() {
    if (!archiveTarget) return;
    try {
      await archiveMutation.mutateAsync(archiveTarget.id);
      toast({ title: 'Customer archived' });
      setArchiveTarget(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not archive customer',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  const columns = useMemo<ColumnDef<Customer, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
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
        cell: ({ row }) => <CustomerStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'value',
        header: 'Value',
        cell: ({ row }) =>
          row.original.value.toLocaleString(undefined, { style: 'currency', currency: 'USD' }),
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
                aria-label="Customer actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
              <Can permission="customers.update">
                <DropdownMenuItem onSelect={() => openEditDialog(row.original)}>
                  Edit
                </DropdownMenuItem>
              </Can>
              <Can permission="customers.delete">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => setArchiveTarget(row.original)}
                >
                  Archive
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
          title="Customers"
          description="Manage your customer accounts and relationships."
        />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage your customer accounts, contacts, and relationships."
        actions={
          <Can permission="customers.create">
            <Button onClick={openCreateDialog}>
              <Plus />
              New customer
            </Button>
          </Can>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers…"
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
              setStatusFilter(value as CustomerStatus | 'ALL');
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

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm">
            <span>{selectedIds.length} selected</span>
            <Can permission="customers.delete">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast({ title: `Archived ${selectedIds.length} customers` });
                  setRowSelection({});
                }}
              >
                <Archive className="h-3.5 w-3.5" />
                Archive
              </Button>
            </Can>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/app/customers/${row.id}`)}
        emptyState={
          <EmptyState
            icon={Building2}
            title={
              debouncedSearch || statusFilter !== 'ALL'
                ? 'No matching customers'
                : 'No customers yet'
            }
            description={
              debouncedSearch || statusFilter !== 'ALL'
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first customer.'
            }
            action={
              !debouncedSearch &&
              statusFilter === 'ALL' && (
                <Can permission="customers.create">
                  <Button onClick={openCreateDialog} size="sm">
                    <Plus />
                    New customer
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

      <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editingCustomer} />

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title="Archive this customer?"
        description={`"${archiveTarget?.name}" will be moved to archived customers. You can restore it later.`}
        confirmLabel="Archive"
        loading={archiveMutation.isPending}
        onConfirm={handleArchive}
      />
    </div>
  );
}
