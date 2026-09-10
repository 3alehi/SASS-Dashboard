-- ============================================================================
-- 0010_notifications_and_audit.sql
-- Per-user notifications and organization-wide audit logging.
-- ============================================================================

create type notification_type as enum (
  'TASK_ASSIGNED',
  'TASK_DUE',
  'DEAL_UPDATED',
  'LEAD_ASSIGNED',
  'TICKET_ASSIGNED',
  'TEAM_INVITATION',
  'MENTION',
  'SYSTEM'
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  link text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications (user_id, created_at desc);
create index idx_notifications_user_unread on notifications (user_id) where read_at is null;
create index idx_notifications_org on notifications (organization_id);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  actor_id uuid references profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_org on audit_logs (organization_id, created_at desc);
create index idx_audit_logs_entity on audit_logs (entity_type, entity_id);
create index idx_audit_logs_actor on audit_logs (actor_id);

comment on table audit_logs is
  'Append-only. No update/delete policies are granted to any role — rows are immutable after insert.';
