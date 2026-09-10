-- ============================================================================
-- 0006_pipeline_and_deals.sql
-- Sales pipelines, stages, products, and deals.
-- ============================================================================

create table pipelines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_pipelines_org on pipelines (organization_id);
create unique index uq_pipelines_default on pipelines (organization_id) where is_default;

create trigger set_pipelines_updated_at
  before update on pipelines
  for each row execute function set_updated_at();

create type pipeline_stage_kind as enum ('OPEN', 'WON', 'LOST');

create table pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references pipelines (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  kind pipeline_stage_kind not null default 'OPEN',
  probability smallint not null default 50 check (probability between 0 and 100),
  sort_order smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pipeline_id, sort_order)
);

create index idx_pipeline_stages_pipeline on pipeline_stages (pipeline_id);
create index idx_pipeline_stages_org on pipeline_stages (organization_id);

create trigger set_pipeline_stages_updated_at
  before update on pipeline_stages
  for each row execute function set_updated_at();

create table products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  description text,
  unit_price numeric(14, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_org on products (organization_id) where is_active;

create trigger set_products_updated_at
  before update on products
  for each row execute function set_updated_at();

create table deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  title text not null,
  customer_id uuid references customers (id) on delete set null,
  pipeline_id uuid not null references pipelines (id) on delete restrict,
  stage_id uuid not null references pipeline_stages (id) on delete restrict,
  owner_id uuid references profiles (id) on delete set null,
  value numeric(14, 2) not null default 0,
  probability smallint not null default 50 check (probability between 0 and 100),
  expected_close_date date,
  closed_at timestamptz,
  lead_id uuid references leads (id) on delete set null,
  notes text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_deals_org on deals (organization_id) where deleted_at is null;
create index idx_deals_org_stage on deals (organization_id, stage_id) where deleted_at is null;
create index idx_deals_customer on deals (customer_id);
create index idx_deals_owner on deals (owner_id);
create index idx_deals_pipeline on deals (pipeline_id);

create trigger set_deals_updated_at
  before update on deals
  for each row execute function set_updated_at();

create table deal_products (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals (id) on delete cascade,
  product_id uuid not null references products (id) on delete restrict,
  organization_id uuid not null references organizations (id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(14, 2) not null,
  created_at timestamptz not null default now()
);

create index idx_deal_products_deal on deal_products (deal_id);
create index idx_deal_products_org on deal_products (organization_id);
