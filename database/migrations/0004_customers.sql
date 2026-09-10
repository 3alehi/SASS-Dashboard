-- ============================================================================
-- 0004_customers.sql
-- Customers and their contacts.
-- ============================================================================

create extension if not exists pg_trgm;

create type customer_status as enum ('ACTIVE', 'INACTIVE', 'ARCHIVED');

create table customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  company text,
  email text,
  phone text,
  website text,
  status customer_status not null default 'ACTIVE',
  source text,
  industry text,
  value numeric(14, 2) not null default 0,
  owner_id uuid references profiles (id) on delete set null,
  notes text,
  last_activity_at timestamptz,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_customers_org on customers (organization_id) where deleted_at is null;
create index idx_customers_org_status on customers (organization_id, status) where deleted_at is null;
create index idx_customers_owner on customers (owner_id);
create index idx_customers_name_trgm on customers using gin (name gin_trgm_ops);

create trigger set_customers_updated_at
  before update on customers
  for each row execute function set_updated_at();

create table customer_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  full_name text not null,
  title text,
  email text,
  phone text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_customer_contacts_customer on customer_contacts (customer_id);
create index idx_customer_contacts_org on customer_contacts (organization_id);
create unique index uq_customer_contacts_primary on customer_contacts (customer_id) where is_primary;

create trigger set_customer_contacts_updated_at
  before update on customer_contacts
  for each row execute function set_updated_at();
