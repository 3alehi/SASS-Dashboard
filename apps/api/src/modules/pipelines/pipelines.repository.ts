import type { Pipeline, PipelineStage } from '@nexora/shared';

import { supabaseAdmin } from '@/lib/supabase-admin.js';

interface PipelineRow {
  id: string;
  organization_id: string;
  name: string;
  is_default: boolean;
  pipeline_stages: StageRow[];
}

interface StageRow {
  id: string;
  pipeline_id: string;
  organization_id: string;
  name: string;
  kind: PipelineStage['kind'];
  probability: number;
  sort_order: number;
}

function toStage(row: StageRow): PipelineStage {
  return {
    id: row.id,
    pipelineId: row.pipeline_id,
    organizationId: row.organization_id,
    name: row.name,
    kind: row.kind,
    probability: row.probability,
    sortOrder: row.sort_order,
  };
}

function toPipeline(row: PipelineRow): Pipeline {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    isDefault: row.is_default,
    stages: (row.pipeline_stages ?? []).map(toStage).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export async function listPipelines(organizationId: string): Promise<Pipeline[]> {
  const { data, error } = await supabaseAdmin
    .from('pipelines')
    .select('*, pipeline_stages(*)')
    .eq('organization_id', organizationId)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error || !data) return [];

  return (data as unknown as PipelineRow[]).map(toPipeline);
}

export async function getDefaultPipeline(organizationId: string): Promise<Pipeline | null> {
  const { data, error } = await supabaseAdmin
    .from('pipelines')
    .select('*, pipeline_stages(*)')
    .eq('organization_id', organizationId)
    .eq('is_default', true)
    .maybeSingle();

  if (error || !data) return null;
  return toPipeline(data as unknown as PipelineRow);
}
