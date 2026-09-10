import type {
  CreateDealInput,
  Deal,
  DealListQuery,
  PipelineSummary,
  UpdateDealInput,
} from '@nexora/shared';

import { supabaseAdmin } from '@/lib/supabase-admin.js';

interface DealRow {
  id: string;
  organization_id: string;
  title: string;
  customer_id: string | null;
  pipeline_id: string;
  stage_id: string;
  owner_id: string | null;
  value: number;
  probability: number;
  expected_close_date: string | null;
  closed_at: string | null;
  lead_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  customers: { name: string } | { name: string }[] | null;
}

function toDeal(row: DealRow): Deal {
  const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;

  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    customerId: row.customer_id,
    customerName: customer?.name ?? null,
    pipelineId: row.pipeline_id,
    stageId: row.stage_id,
    ownerId: row.owner_id,
    value: Number(row.value),
    probability: row.probability,
    expectedCloseDate: row.expected_close_date,
    closedAt: row.closed_at,
    leadId: row.lead_id,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

const SELECT_COLUMNS = '*, customers(name)';

const SORT_COLUMN_MAP: Record<DealListQuery['sortBy'], string> = {
  title: 'title',
  value: 'value',
  expectedCloseDate: 'expected_close_date',
  createdAt: 'created_at',
};

function normalizeOptionalStrings<T extends Record<string, unknown>>(input: T): T {
  const result = { ...input };
  for (const key of Object.keys(result)) {
    if (result[key as keyof T] === '') {
      (result as Record<string, unknown>)[key] = null;
    }
  }
  return result;
}

export interface PaginatedDeals {
  items: Deal[];
  total: number;
}

export async function listDeals(
  organizationId: string,
  query: DealListQuery,
): Promise<PaginatedDeals> {
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  let request = supabaseAdmin
    .from('deals')
    .select(SELECT_COLUMNS, { count: 'exact' })
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (query.search) {
    request = request.ilike('title', `%${query.search}%`);
  }
  if (query.pipelineId) {
    request = request.eq('pipeline_id', query.pipelineId);
  }
  if (query.stageId) {
    request = request.eq('stage_id', query.stageId);
  }
  if (query.ownerId) {
    request = request.eq('owner_id', query.ownerId);
  }
  if (query.customerId) {
    request = request.eq('customer_id', query.customerId);
  }

  const { data, error, count } = await request
    .order(SORT_COLUMN_MAP[query.sortBy], { ascending: query.sortDir === 'asc' })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to list deals: ${error.message}`);
  }

  return {
    items: (data ?? []).map((row) => toDeal(row as unknown as DealRow)),
    total: count ?? 0,
  };
}

/**
 * All non-deleted deals for a pipeline, unpaginated — used to render the
 * Kanban board (which needs every deal grouped by stage, not a single page)
 * and to compute pipeline summary metrics.
 */
export async function listDealsForPipeline(
  organizationId: string,
  pipelineId: string,
): Promise<Deal[]> {
  const { data, error } = await supabaseAdmin
    .from('deals')
    .select(SELECT_COLUMNS)
    .eq('organization_id', organizationId)
    .eq('pipeline_id', pipelineId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as unknown as DealRow[]).map(toDeal);
}

export async function getDealById(organizationId: string, dealId: string): Promise<Deal | null> {
  const { data, error } = await supabaseAdmin
    .from('deals')
    .select(SELECT_COLUMNS)
    .eq('organization_id', organizationId)
    .eq('id', dealId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return null;
  return toDeal(data as unknown as DealRow);
}

export async function createDeal(
  organizationId: string,
  createdBy: string,
  input: CreateDealInput,
): Promise<Deal> {
  const normalized = normalizeOptionalStrings(input);

  const { data, error } = await supabaseAdmin
    .from('deals')
    .insert({
      organization_id: organizationId,
      title: normalized.title,
      customer_id: normalized.customerId ?? null,
      pipeline_id: normalized.pipelineId,
      stage_id: normalized.stageId,
      owner_id: normalized.ownerId ?? null,
      value: normalized.value,
      probability: normalized.probability ?? 50,
      expected_close_date: normalized.expectedCloseDate ?? null,
      notes: normalized.notes ?? null,
      created_by: createdBy,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(`Failed to create deal: ${error?.message}`);
  }

  return toDeal(data as unknown as DealRow);
}

export async function updateDeal(
  organizationId: string,
  dealId: string,
  input: UpdateDealInput,
): Promise<Deal | null> {
  const normalized = normalizeOptionalStrings(input);

  const patch: Record<string, unknown> = {};
  if (normalized.title !== undefined) patch.title = normalized.title;
  if (normalized.customerId !== undefined) patch.customer_id = normalized.customerId ?? null;
  if (normalized.pipelineId !== undefined) patch.pipeline_id = normalized.pipelineId;
  if (normalized.stageId !== undefined) patch.stage_id = normalized.stageId;
  if (normalized.ownerId !== undefined) patch.owner_id = normalized.ownerId ?? null;
  if (normalized.value !== undefined) patch.value = normalized.value;
  if (normalized.probability !== undefined) patch.probability = normalized.probability;
  if (normalized.expectedCloseDate !== undefined) {
    patch.expected_close_date = normalized.expectedCloseDate ?? null;
  }
  if (normalized.notes !== undefined) patch.notes = normalized.notes ?? null;

  const { data, error } = await supabaseAdmin
    .from('deals')
    .update(patch)
    .eq('organization_id', organizationId)
    .eq('id', dealId)
    .is('deleted_at', null)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error || !data) return null;
  return toDeal(data as unknown as DealRow);
}

/**
 * Moves a deal to a different stage — the operation the Kanban board's
 * drag-and-drop performs. Separate from the general update() so the API can
 * validate the target stage belongs to the deal's own pipeline before
 * writing, and so it can stamp closed_at when the stage is a terminal
 * (WON/LOST) kind.
 */
export async function moveDealToStage(
  organizationId: string,
  dealId: string,
  stageId: string,
): Promise<Deal | null> {
  const { data: deal } = await supabaseAdmin
    .from('deals')
    .select('pipeline_id')
    .eq('organization_id', organizationId)
    .eq('id', dealId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!deal) return null;

  const { data: stage } = await supabaseAdmin
    .from('pipeline_stages')
    .select('id, kind, probability, pipeline_id')
    .eq('organization_id', organizationId)
    .eq('id', stageId)
    .maybeSingle();

  if (!stage || stage.pipeline_id !== deal.pipeline_id) {
    return null;
  }

  const isTerminal = stage.kind === 'WON' || stage.kind === 'LOST';

  const { data, error } = await supabaseAdmin
    .from('deals')
    .update({
      stage_id: stageId,
      probability: stage.probability,
      closed_at: isTerminal ? new Date().toISOString() : null,
    })
    .eq('organization_id', organizationId)
    .eq('id', dealId)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error || !data) return null;
  return toDeal(data as unknown as DealRow);
}

export async function softDeleteDeal(organizationId: string, dealId: string): Promise<boolean> {
  const { error, data } = await supabaseAdmin
    .from('deals')
    .update({ deleted_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('id', dealId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  return !error && Boolean(data);
}

export async function getPipelineSummary(
  organizationId: string,
  pipelineId: string,
): Promise<PipelineSummary> {
  const deals = await listDealsForPipeline(organizationId, pipelineId);

  const { data: stages } = await supabaseAdmin
    .from('pipeline_stages')
    .select('id, kind')
    .eq('pipeline_id', pipelineId);

  const stageKindById = new Map(
    (stages ?? []).map((stage) => [stage.id as string, stage.kind as string]),
  );

  let totalValue = 0;
  let weightedValue = 0;
  let wonValue = 0;
  let wonCount = 0;
  let lostCount = 0;
  let openCount = 0;

  for (const deal of deals) {
    const kind = stageKindById.get(deal.stageId);
    if (kind === 'WON') {
      wonValue += deal.value;
      wonCount += 1;
    } else if (kind === 'LOST') {
      lostCount += 1;
    } else {
      totalValue += deal.value;
      weightedValue += (deal.value * deal.probability) / 100;
      openCount += 1;
    }
  }

  const closedCount = wonCount + lostCount;
  const conversionRate = closedCount > 0 ? (wonCount / closedCount) * 100 : 0;

  return {
    totalValue,
    weightedValue,
    wonValue,
    wonCount,
    lostCount,
    openCount,
    conversionRate,
  };
}
