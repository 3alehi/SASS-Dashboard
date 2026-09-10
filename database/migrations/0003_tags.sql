-- ============================================================================
-- 0003_tags.sql
-- Tags and the polymorphic entity_tags join table used across CRM entities.
-- ============================================================================

create table tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create index idx_tags_org on tags (organization_id);

create type taggable_entity as enum ('customer', 'lead', 'deal', 'task', 'ticket');

create table entity_tags (
  tag_id uuid not null references tags (id) on delete cascade,
  entity_type taggable_entity not null,
  entity_id uuid not null,
  organization_id uuid not null references organizations (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tag_id, entity_type, entity_id)
);

create index idx_entity_tags_entity on entity_tags (entity_type, entity_id);
create index idx_entity_tags_org on entity_tags (organization_id);
