-- ============================================================================
-- 0013_functions_and_triggers.sql
-- Business-logic database functions: organization bootstrap and lead
-- conversion. Kept in the database because they must be transactional and
-- are security-sensitive (they write across multiple tenant tables).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- bootstrap_organization: creates an organization, makes the creator its
-- OWNER, and seeds default settings/subscription/pipeline in one transaction.
-- Called by the API right after an authenticated user creates an org.
-- ----------------------------------------------------------------------------
create or replace function bootstrap_organization(
  org_name text,
  org_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  default_pipeline_id uuid;
  owner_role_id smallint;
begin
  select id into owner_role_id from roles where name = 'OWNER';

  insert into organizations (name, slug, created_by)
  values (org_name, org_slug, auth.uid())
  returning id into new_org_id;

  insert into organization_members (organization_id, user_id, role_id, status, joined_at)
  values (new_org_id, auth.uid(), owner_role_id, 'ACTIVE', now());

  insert into organization_settings (organization_id) values (new_org_id);
  insert into subscriptions (organization_id) values (new_org_id);

  insert into pipelines (organization_id, name, is_default)
  values (new_org_id, 'Sales Pipeline', true)
  returning id into default_pipeline_id;

  insert into pipeline_stages (pipeline_id, organization_id, name, kind, probability, sort_order)
  values
    (default_pipeline_id, new_org_id, 'New', 'OPEN', 10, 1),
    (default_pipeline_id, new_org_id, 'Qualified', 'OPEN', 30, 2),
    (default_pipeline_id, new_org_id, 'Proposal', 'OPEN', 50, 3),
    (default_pipeline_id, new_org_id, 'Negotiation', 'OPEN', 75, 4),
    (default_pipeline_id, new_org_id, 'Won', 'WON', 100, 5),
    (default_pipeline_id, new_org_id, 'Lost', 'LOST', 0, 6);

  insert into user_preferences (user_id, active_organization_id)
  values (auth.uid(), new_org_id)
  on conflict (user_id) do update set active_organization_id = excluded.active_organization_id;

  return new_org_id;
end;
$$;

comment on function bootstrap_organization(text, text) is
  'Creates a new organization with the caller as OWNER, plus default settings, subscription, and sales pipeline. Runs as a single transaction.';

-- ----------------------------------------------------------------------------
-- convert_lead: converts a lead into a customer (+ primary contact, and
-- optionally a deal), while preserving the lead row for history.
-- ----------------------------------------------------------------------------
create or replace function convert_lead(
  target_lead_id uuid,
  create_deal boolean default false,
  deal_pipeline_id uuid default null,
  deal_stage_id uuid default null,
  deal_value numeric default null
)
returns table (customer_id uuid, contact_id uuid, deal_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  lead_row leads%rowtype;
  new_customer_id uuid;
  new_contact_id uuid;
  new_deal_id uuid;
begin
  select * into lead_row from leads where id = target_lead_id and deleted_at is null;

  if not found then
    raise exception 'Lead % not found', target_lead_id;
  end if;

  if not has_permission(lead_row.organization_id, 'leads.update')
    or not has_permission(lead_row.organization_id, 'customers.create') then
    raise exception 'Insufficient permissions to convert lead %', target_lead_id;
  end if;

  insert into customers (organization_id, name, company, email, phone, owner_id, source, value, created_by)
  values (
    lead_row.organization_id,
    coalesce(lead_row.company, lead_row.full_name),
    lead_row.company,
    lead_row.email,
    lead_row.phone,
    lead_row.owner_id,
    (select name from lead_sources where id = lead_row.source_id),
    coalesce(lead_row.value, 0),
    auth.uid()
  )
  returning id into new_customer_id;

  insert into customer_contacts (organization_id, customer_id, full_name, email, phone, is_primary)
  values (lead_row.organization_id, new_customer_id, lead_row.full_name, lead_row.email, lead_row.phone, true)
  returning id into new_contact_id;

  if create_deal then
    if deal_pipeline_id is null or deal_stage_id is null then
      raise exception 'deal_pipeline_id and deal_stage_id are required when create_deal is true';
    end if;

    insert into deals (
      organization_id, title, customer_id, pipeline_id, stage_id, owner_id, value, lead_id, created_by
    )
    values (
      lead_row.organization_id,
      coalesce(lead_row.company, lead_row.full_name) || ' — Deal',
      new_customer_id,
      deal_pipeline_id,
      deal_stage_id,
      lead_row.owner_id,
      coalesce(deal_value, lead_row.value, 0),
      lead_row.id,
      auth.uid()
    )
    returning id into new_deal_id;
  end if;

  update leads
  set status_id = (select id from lead_statuses where name = 'WON'),
      converted_customer_id = new_customer_id,
      converted_at = now()
  where id = target_lead_id;

  insert into activities (organization_id, entity_type, entity_id, type, title, created_by)
  values (
    lead_row.organization_id,
    'customer',
    new_customer_id,
    'STATUS_CHANGE',
    'Converted from lead: ' || lead_row.full_name,
    auth.uid()
  );

  return query select new_customer_id, new_contact_id, new_deal_id;
end;
$$;

comment on function convert_lead(uuid, boolean, uuid, uuid, numeric) is
  'Converts a lead into a customer + primary contact, optionally creating a deal, and preserves the original lead row with converted_customer_id set.';
