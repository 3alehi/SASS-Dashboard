-- ============================================================================
-- 0007_tasks.sql
-- Task management: tasks and their comments, optionally linked to a
-- customer or deal.
-- ============================================================================

create type task_priority as enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
create type task_status as enum ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

create table tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  title text not null,
  description text,
  status task_status not null default 'OPEN',
  priority task_priority not null default 'MEDIUM',
  due_date timestamptz,
  completed_at timestamptz,
  assignee_id uuid references profiles (id) on delete set null,
  customer_id uuid references customers (id) on delete cascade,
  deal_id uuid references deals (id) on delete cascade,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_tasks_org on tasks (organization_id) where deleted_at is null;
create index idx_tasks_assignee on tasks (assignee_id) where deleted_at is null;
create index idx_tasks_customer on tasks (customer_id);
create index idx_tasks_deal on tasks (deal_id);
create index idx_tasks_due_date on tasks (due_date) where deleted_at is null and status <> 'COMPLETED';

create trigger set_tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

create table task_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  task_id uuid not null references tasks (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_task_comments_task on task_comments (task_id);
create index idx_task_comments_org on task_comments (organization_id);

create trigger set_task_comments_updated_at
  before update on task_comments
  for each row execute function set_updated_at();
