-- ============================================================================
-- 0011_settings_and_preferences.sql
-- Saved filters, dashboard widgets, per-user preferences, organization
-- settings, and subscription/billing state.
-- ============================================================================

create table saved_filters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  entity_type text not null,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entity_type, name)
);

create index idx_saved_filters_org on saved_filters (organization_id);
create index idx_saved_filters_user on saved_filters (user_id);

create trigger set_saved_filters_updated_at
  before update on saved_filters
  for each row execute function set_updated_at();

create table dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  widget_key text not null,
  position smallint not null default 0,
  config jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, widget_key)
);

create index idx_dashboard_widgets_org on dashboard_widgets (organization_id);
create index idx_dashboard_widgets_user on dashboard_widgets (user_id);

create trigger set_dashboard_widgets_updated_at
  before update on dashboard_widgets
  for each row execute function set_updated_at();

create table user_preferences (
  user_id uuid primary key references profiles (id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  active_organization_id uuid references organizations (id) on delete set null,
  notification_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_user_preferences_updated_at
  before update on user_preferences
  for each row execute function set_updated_at();

create table organization_settings (
  organization_id uuid primary key references organizations (id) on delete cascade,
  default_currency text not null default 'USD',
  fiscal_year_start smallint not null default 1 check (fiscal_year_start between 1 and 12),
  date_format text not null default 'MM/DD/YYYY',
  branding jsonb not null default '{}'::jsonb,
  security_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_organization_settings_updated_at
  before update on organization_settings
  for each row execute function set_updated_at();

create type subscription_plan as enum ('FREE', 'PRO', 'BUSINESS');
create type subscription_status as enum ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED');

create table subscriptions (
  organization_id uuid primary key references organizations (id) on delete cascade,
  plan subscription_plan not null default 'FREE',
  status subscription_status not null default 'ACTIVE',
  seats integer not null default 5,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_subscriptions_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();
