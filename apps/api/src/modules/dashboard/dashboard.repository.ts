import type {
  DashboardOverview,
  DashboardQuery,
  KpiValue,
  LeadConversionStage,
  RevenueSeries,
  SalesPerformanceEntry,
  StageValue,
  TimeSeriesPoint,
  WonLostPoint,
} from '@nexora/shared';

import { supabaseAdmin } from '@/lib/supabase-admin.js';
import { computeChangePercent, resolveDateRange } from '@/modules/dashboard/date-range.js';

function toKpi(current: number, previous: number | null): KpiValue {
  return { current, previous, changePercent: computeChangePercent(current, previous) };
}

interface WonDealRow {
  value: number;
  closed_at: string;
}

async function getWonDealsInRange(
  organizationId: string,
  from: Date,
  to: Date,
): Promise<WonDealRow[]> {
  const { data, error } = await supabaseAdmin
    .from('deals')
    .select('value, closed_at, pipeline_stages!inner(kind)')
    .eq('organization_id', organizationId)
    .eq('pipeline_stages.kind', 'WON')
    .gte('closed_at', from.toISOString())
    .lte('closed_at', to.toISOString());

  if (error || !data) return [];
  return (data as unknown as WonDealRow[]).map((row) => ({
    value: Number(row.value),
    closed_at: row.closed_at,
  }));
}

async function getLostDealsCountInRange(
  organizationId: string,
  from: Date,
  to: Date,
): Promise<Array<{ closed_at: string }>> {
  const { data, error } = await supabaseAdmin
    .from('deals')
    .select('closed_at, pipeline_stages!inner(kind)')
    .eq('organization_id', organizationId)
    .eq('pipeline_stages.kind', 'LOST')
    .gte('closed_at', from.toISOString())
    .lte('closed_at', to.toISOString());

  if (error || !data) return [];
  return data as unknown as Array<{ closed_at: string }>;
}

async function getOpenPipelineValue(organizationId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('deals')
    .select('value, pipeline_stages!inner(kind)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .not('pipeline_stages.kind', 'in', '(WON,LOST)');

  if (error || !data) return 0;
  return (data as unknown as Array<{ value: number }>).reduce(
    (sum, row) => sum + Number(row.value),
    0,
  );
}

async function countNewCustomersInRange(
  organizationId: string,
  from: Date,
  to: Date,
): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString());

  if (error) return 0;
  return count ?? 0;
}

async function countOpenTasks(organizationId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .in('status', ['OPEN', 'IN_PROGRESS']);

  if (error) return 0;
  return count ?? 0;
}

async function countLeadsCreatedInRange(
  organizationId: string,
  from: Date,
  to: Date,
): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString());

  if (error) return 0;
  return count ?? 0;
}

async function countConvertedLeadsInRange(
  organizationId: string,
  from: Date,
  to: Date,
): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .not('converted_at', 'is', null)
    .gte('converted_at', from.toISOString())
    .lte('converted_at', to.toISOString());

  if (error) return 0;
  return count ?? 0;
}

export async function getDashboardOverview(
  organizationId: string,
  query: DashboardQuery,
): Promise<DashboardOverview> {
  const range = resolveDateRange(query);

  const [
    currentWon,
    previousWon,
    currentLeadsCreated,
    previousLeadsCreated,
    currentConverted,
    previousConverted,
    pipelineValue,
    newCustomers,
    previousNewCustomers,
    openTasks,
  ] = await Promise.all([
    getWonDealsInRange(organizationId, range.from, range.to),
    query.compare
      ? getWonDealsInRange(organizationId, range.previousFrom, range.previousTo)
      : Promise.resolve(null),
    countLeadsCreatedInRange(organizationId, range.from, range.to),
    query.compare
      ? countLeadsCreatedInRange(organizationId, range.previousFrom, range.previousTo)
      : Promise.resolve(null),
    countConvertedLeadsInRange(organizationId, range.from, range.to),
    query.compare
      ? countConvertedLeadsInRange(organizationId, range.previousFrom, range.previousTo)
      : Promise.resolve(null),
    getOpenPipelineValue(organizationId),
    countNewCustomersInRange(organizationId, range.from, range.to),
    query.compare
      ? countNewCustomersInRange(organizationId, range.previousFrom, range.previousTo)
      : Promise.resolve(null),
    countOpenTasks(organizationId),
  ]);

  const currentRevenue = currentWon.reduce((sum, deal) => sum + deal.value, 0);
  const previousRevenue = previousWon ? previousWon.reduce((sum, deal) => sum + deal.value, 0) : null;

  const currentConversionRate =
    currentLeadsCreated > 0 ? (currentConverted / currentLeadsCreated) * 100 : 0;
  const previousConversionRate =
    previousLeadsCreated !== null && previousConverted !== null
      ? previousLeadsCreated > 0
        ? (previousConverted / previousLeadsCreated) * 100
        : 0
      : null;

  return {
    revenue: toKpi(currentRevenue, previousRevenue),
    pipelineValue: toKpi(pipelineValue, null),
    wonDeals: toKpi(currentWon.length, previousWon ? previousWon.length : null),
    conversionRate: toKpi(currentConversionRate, previousConversionRate),
    newCustomers: toKpi(newCustomers, previousNewCustomers),
    openTasks: toKpi(openTasks, null),
  };
}

function bucketByDay(
  rows: Array<{ date: string; value: number }>,
  from: Date,
  to: Date,
): TimeSeriesPoint[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = row.date.slice(0, 10);
    totals.set(key, (totals.get(key) ?? 0) + row.value);
  }

  const points: TimeSeriesPoint[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  while (cursor.getTime() <= end.getTime()) {
    const key = cursor.toISOString().slice(0, 10);
    points.push({ date: key, value: totals.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
}

export async function getRevenueSeries(
  organizationId: string,
  query: DashboardQuery,
): Promise<RevenueSeries> {
  const range = resolveDateRange(query);

  const [currentWon, previousWon] = await Promise.all([
    getWonDealsInRange(organizationId, range.from, range.to),
    query.compare
      ? getWonDealsInRange(organizationId, range.previousFrom, range.previousTo)
      : Promise.resolve([]),
  ]);

  return {
    current: bucketByDay(
      currentWon.map((deal) => ({ date: deal.closed_at, value: deal.value })),
      range.from,
      range.to,
    ),
    previous: query.compare
      ? bucketByDay(
          previousWon.map((deal) => ({ date: deal.closed_at, value: deal.value })),
          range.previousFrom,
          range.previousTo,
        )
      : [],
  };
}

export async function getPipelineByStage(organizationId: string): Promise<StageValue[]> {
  const { data: pipeline } = await supabaseAdmin
    .from('pipelines')
    .select('id')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!pipeline) return [];

  const { data: stages } = await supabaseAdmin
    .from('pipeline_stages')
    .select('id, name, position')
    .eq('pipeline_id', pipeline.id)
    .order('position', { ascending: true });

  if (!stages || stages.length === 0) return [];

  const { data: deals } = await supabaseAdmin
    .from('deals')
    .select('stage_id, value')
    .eq('organization_id', organizationId)
    .eq('pipeline_id', pipeline.id)
    .is('deleted_at', null);

  const totals = new Map<string, { value: number; count: number }>();
  for (const deal of deals ?? []) {
    const entry = totals.get(deal.stage_id as string) ?? { value: 0, count: 0 };
    entry.value += Number(deal.value);
    entry.count += 1;
    totals.set(deal.stage_id as string, entry);
  }

  return stages.map((stage) => ({
    stageId: stage.id as string,
    stageName: stage.name as string,
    value: totals.get(stage.id as string)?.value ?? 0,
    count: totals.get(stage.id as string)?.count ?? 0,
  }));
}

export async function getWonLostSeries(
  organizationId: string,
  query: DashboardQuery,
): Promise<WonLostPoint[]> {
  const range = resolveDateRange(query);

  const [won, lost] = await Promise.all([
    getWonDealsInRange(organizationId, range.from, range.to),
    getLostDealsCountInRange(organizationId, range.from, range.to),
  ]);

  const wonByDay = new Map<string, number>();
  for (const deal of won) {
    const key = deal.closed_at.slice(0, 10);
    wonByDay.set(key, (wonByDay.get(key) ?? 0) + 1);
  }

  const lostByDay = new Map<string, number>();
  for (const deal of lost) {
    const key = deal.closed_at.slice(0, 10);
    lostByDay.set(key, (lostByDay.get(key) ?? 0) + 1);
  }

  const points: WonLostPoint[] = [];
  const cursor = new Date(range.from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(range.to);
  end.setHours(0, 0, 0, 0);

  while (cursor.getTime() <= end.getTime()) {
    const key = cursor.toISOString().slice(0, 10);
    points.push({ date: key, won: wonByDay.get(key) ?? 0, lost: lostByDay.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
}

const LEAD_FUNNEL_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED'] as const;

export async function getLeadConversionFunnel(
  organizationId: string,
  query: DashboardQuery,
): Promise<LeadConversionStage[]> {
  const range = resolveDateRange(query);

  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('lead_statuses!inner(name)')
    .eq('organization_id', organizationId)
    .gte('created_at', range.from.toISOString())
    .lte('created_at', range.to.toISOString());

  if (error || !data) return LEAD_FUNNEL_STATUSES.map((status) => ({ status, count: 0 }));

  const counts = new Map<string, number>();
  for (const row of data as unknown as Array<{ lead_statuses: { name: string } | { name: string }[] }>) {
    const relation = Array.isArray(row.lead_statuses) ? row.lead_statuses[0] : row.lead_statuses;
    const name = relation?.name;
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return LEAD_FUNNEL_STATUSES.map((status) => ({ status, count: counts.get(status) ?? 0 }));
}

export async function getSalesPerformance(
  organizationId: string,
  query: DashboardQuery,
): Promise<SalesPerformanceEntry[]> {
  const range = resolveDateRange(query);

  const { data, error } = await supabaseAdmin
    .from('deals')
    .select('owner_id, value, profiles(full_name), pipeline_stages!inner(kind)')
    .eq('organization_id', organizationId)
    .eq('pipeline_stages.kind', 'WON')
    .gte('closed_at', range.from.toISOString())
    .lte('closed_at', range.to.toISOString());

  if (error || !data) return [];

  const byOwner = new Map<string, SalesPerformanceEntry>();
  for (const row of data as unknown as Array<{
    owner_id: string | null;
    value: number;
    profiles: { full_name: string } | { full_name: string }[] | null;
  }>) {
    const ownerId = row.owner_id;
    const key = ownerId ?? 'unassigned';
    const relation = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const entry =
      byOwner.get(key) ??
      ({
        ownerId,
        ownerName: relation?.full_name ?? 'Unassigned',
        wonValue: 0,
        dealCount: 0,
      } satisfies SalesPerformanceEntry);

    entry.wonValue += Number(row.value);
    entry.dealCount += 1;
    byOwner.set(key, entry);
  }

  return Array.from(byOwner.values()).sort((a, b) => b.wonValue - a.wonValue);
}
