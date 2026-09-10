-- ============================================================================
-- 0005_leads.sql
-- Lead sources, statuses, and the leads table itself.
-- ============================================================================

create table lead_sources (
  id smallint generated always as identity primary key,
  name text not null unique
);

insert into lead_sources (name) values
  ('Website'), ('Referral'), ('Cold Outreach'), ('Event'), ('Advertisement'),
  ('Social Media'), ('Partner'), ('Other');

create table lead_statuses (
  id smallint primary key,
  name text not null unique,
  sort_order smallint not null
);

insert into lead_statuses (id, name, sort_order) values
  (1, 'NEW', 1),
  (2, 'CONTACTED', 2),
  (3, 'QUALIFIED', 3),
  (4, 'PROPOSAL', 4),
  (5, 'NEGOTIATION', 5),
  (6, 'WON', 6),
  (7, 'LOST', 7);

create table leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  full_name text not null,
  company text,
  email text,
  phone text,
  status_id smallint not null default 1 references lead_statuses (id) on delete restrict,
  source_id smallint references lead_sources (id) on delete set null,
  value numeric(14, 2),
  owner_id uuid references profiles (id) on delete set null,
  notes text,
  converted_customer_id uuid references customers (id) on delete set null,
  converted_at timestamptz,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_leads_org on leads (organization_id) where deleted_at is null;
create index idx_leads_org_status on leads (organization_id, status_id) where deleted_at is null;
create index idx_leads_owner on leads (owner_id);
create index idx_leads_name_trgm on leads using gin (full_name gin_trgm_ops);

create trigger set_leads_updated_at
  before update on leads
  for each row execute function set_updated_at();
