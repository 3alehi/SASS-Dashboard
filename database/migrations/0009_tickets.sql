-- ============================================================================
-- 0009_tickets.sql
-- Support ticket system: tickets and their conversation messages.
-- ============================================================================

create type ticket_status as enum ('OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED');
create type ticket_priority as enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

create table tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  ticket_number bigint generated always as identity,
  title text not null,
  description text,
  customer_id uuid references customers (id) on delete set null,
  priority ticket_priority not null default 'MEDIUM',
  status ticket_status not null default 'OPEN',
  category text,
  assigned_agent_id uuid references profiles (id) on delete set null,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index uq_tickets_org_number on tickets (organization_id, ticket_number);
create index idx_tickets_org on tickets (organization_id) where deleted_at is null;
create index idx_tickets_org_status on tickets (organization_id, status) where deleted_at is null;
create index idx_tickets_customer on tickets (customer_id);
create index idx_tickets_assigned_agent on tickets (assigned_agent_id);

create trigger set_tickets_updated_at
  before update on tickets
  for each row execute function set_updated_at();

create table ticket_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  ticket_id uuid not null references tickets (id) on delete cascade,
  author_id uuid references profiles (id) on delete set null,
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_ticket_messages_ticket on ticket_messages (ticket_id, created_at);
create index idx_ticket_messages_org on ticket_messages (organization_id);
