-- ============================================================================
-- 0008_activities_and_notes.sql
-- Activity timeline entries and freeform notes, polymorphically attached to
-- a customer, lead, or deal.
-- ============================================================================

create type activity_entity as enum ('customer', 'lead', 'deal');
create type activity_type as enum ('CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK', 'STATUS_CHANGE');

create table activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  entity_type activity_entity not null,
  entity_id uuid not null,
  type activity_type not null,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_activities_org on activities (organization_id);
create index idx_activities_entity on activities (entity_type, entity_id);
create index idx_activities_occurred_at on activities (occurred_at desc);

create table notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  entity_type activity_entity not null,
  entity_id uuid not null,
  body text not null,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notes_org on notes (organization_id);
create index idx_notes_entity on notes (entity_type, entity_id);

create trigger set_notes_updated_at
  before update on notes
  for each row execute function set_updated_at();
