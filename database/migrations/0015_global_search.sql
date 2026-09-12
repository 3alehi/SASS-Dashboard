-- ============================================================================
-- 0015_global_search.sql
-- Trigram indexes for entities not already indexed for search, plus a
-- global_search() function that unions ranked matches across customers,
-- leads, deals, tasks, and tickets in one round trip (powers the command
-- palette / Ctrl+K search). Matching uses ilike (substring, consistent with
-- every per-module search already in the API) while gin_trgm_ops indexes
-- still accelerate that ilike scan; similarity() is used only to rank the
-- unioned results, so a closer match surfaces first without excluding
-- short partial queries the way a similarity-threshold filter (%) would.
-- ============================================================================

create index idx_deals_title_trgm on deals using gin (title gin_trgm_ops);
create index idx_tasks_title_trgm on tasks using gin (title gin_trgm_ops);
create index idx_tickets_title_trgm on tickets using gin (title gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- global_search: each entity type is included only if the caller holds its
-- .read permission, so results never leak past what requirePermission()
-- would already allow the caller to fetch one-by-one. security definer is
-- required because it queries has_permission()/is_org_member() as the
-- calling user across several tables; it re-checks organization membership
-- itself rather than relying on the caller having filtered organization_id.
-- ----------------------------------------------------------------------------
create or replace function global_search(
  target_organization_id uuid,
  search_query text,
  result_limit integer default 8
)
returns table (
  entity_type text,
  entity_id uuid,
  title text,
  subtitle text,
  rank real
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_org_member(target_organization_id) then
    raise exception 'Not a member of organization %', target_organization_id;
  end if;

  return query
  select * from (
    select 'customer'::text, c.id, c.name, coalesce(c.company, c.email, ''), similarity(c.name, search_query)
    from customers c
    where c.organization_id = target_organization_id
      and c.deleted_at is null
      and has_permission(target_organization_id, 'customers.read')
      and c.name ilike '%' || search_query || '%'
    union all
    select 'lead'::text, l.id, l.full_name, coalesce(l.company, l.email, ''), similarity(l.full_name, search_query)
    from leads l
    where l.organization_id = target_organization_id
      and l.deleted_at is null
      and has_permission(target_organization_id, 'leads.read')
      and l.full_name ilike '%' || search_query || '%'
    union all
    select 'deal'::text, d.id, d.title, coalesce(cu.name, ''), similarity(d.title, search_query)
    from deals d
    left join customers cu on cu.id = d.customer_id
    where d.organization_id = target_organization_id
      and d.deleted_at is null
      and has_permission(target_organization_id, 'deals.read')
      and d.title ilike '%' || search_query || '%'
    union all
    select 'task'::text, t.id, t.title, coalesce(t.description, ''), similarity(t.title, search_query)
    from tasks t
    where t.organization_id = target_organization_id
      and t.deleted_at is null
      and has_permission(target_organization_id, 'tasks.read')
      and t.title ilike '%' || search_query || '%'
    union all
    select 'ticket'::text, tk.id, tk.title, coalesce(tk.description, ''), similarity(tk.title, search_query)
    from tickets tk
    where tk.organization_id = target_organization_id
      and tk.deleted_at is null
      and has_permission(target_organization_id, 'tickets.read')
      and tk.title ilike '%' || search_query || '%'
  ) as results (entity_type, entity_id, title, subtitle, rank)
  order by rank desc
  limit result_limit;
end;
$$;

comment on function global_search(uuid, text, integer) is
  'Trigram-ranked search across customers, leads, deals, tasks, and tickets for one organization. Each entity type is included only if the caller holds its .read permission.';
