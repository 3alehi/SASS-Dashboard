import type { SearchResult } from '@nexora/shared';

import { supabaseAdmin } from '@/lib/supabase-admin.js';

interface GlobalSearchRow {
  entity_type: SearchResult['entityType'];
  entity_id: string;
  title: string;
  subtitle: string;
  rank: number;
}

export async function globalSearch(
  organizationId: string,
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const { data, error } = await supabaseAdmin.rpc('global_search', {
    target_organization_id: organizationId,
    search_query: query,
    result_limit: limit,
  });

  if (error || !data) return [];

  return (data as GlobalSearchRow[]).map((row) => ({
    entityType: row.entity_type,
    entityId: row.entity_id,
    title: row.title,
    subtitle: row.subtitle,
    rank: Number(row.rank),
  }));
}
