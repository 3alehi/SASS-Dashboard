import type { Deal } from '@nexora/shared';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Handshake, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Can } from '@/components/auth/can';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { useDeals } from '@/hooks/use-deals';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePipelines } from '@/hooks/use-pipelines';
import { DealFormDialog } from '@/pages/pipeline/deal-form-dialog';

export function DealsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError, refetch } = useDeals({
    page,
    pageSize: 20,
    search: debouncedSearch || undefined,
  });
  const { data: pipelines } = usePipelines();
  const defaultPipeline = pipelines?.[0];

  const stageNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const pipeline of pipelines ?? []) {
      for (const stage of pipeline.stages) {
        map.set(stage.id, stage.name);
      }
    }
    return map;
  }, [pipelines]);

  const columns = useMemo<ColumnDef<Deal, unknown>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Deal',
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
        accessorKey: 'stageId',
        header: 'Stage',
        cell: ({ row }) => (
          <Badge variant="secondary">{stageNameById.get(row.original.stageId) ?? '—'}</Badge>
        ),
      },
      {
        accessorKey: 'value',
        header: 'Value',
        cell: ({ row }) =>
          row.original.value.toLocaleString(undefined, { style: 'currency', currency: 'USD' }),
      },
      {
        accessorKey: 'probability',
        header: 'Probability',
        cell: ({ row }) => `${row.original.probability}%`,
      },
      {
        accessorKey: 'expectedCloseDate',
        header: 'Close date',
        cell: ({ row }) =>
          row.original.expectedCloseDate
            ? format(new Date(row.original.expectedCloseDate), 'MMM d, yyyy')
            : '—',
      },
    ],
    [stageNameById],
  );

  if (isError) {
    return (
      <div>
        <PageHeader title="Deals" description="Manage active deals across your sales pipeline." />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Deals"
        description="Manage active deals across your sales pipeline."
        actions={
          <Can permission="deals.create">
            <Button onClick={() => setFormOpen(true)} disabled={!defaultPipeline}>
              <Plus />
              New deal
            </Button>
          </Can>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search deals…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/app/deals/${row.id}`)}
        emptyState={
          <EmptyState
            icon={Handshake}
            title={debouncedSearch ? 'No matching deals' : 'No deals yet'}
            description={
              debouncedSearch
                ? 'Try adjusting your search.'
                : 'Deals move through your pipeline from the Pipeline board.'
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

      {defaultPipeline && (
        <DealFormDialog open={formOpen} onOpenChange={setFormOpen} pipeline={defaultPipeline} />
      )}
    </div>
  );
}
