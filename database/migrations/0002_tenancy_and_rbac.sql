-- ============================================================================
-- 0002_tenancy_and_rbac.sql
-- Profiles, organizations, membership, and role-based access control tables.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles: one row per Supabase auth user, mirrors auth.users for app data.
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile row whenever a new Supabase auth user signs up.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- organizations: the tenant boundary. Every business record belongs to one.
-- ----------------------------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  industry text,
  size text,
  website text,
  billing_email text,
  created_by uuid not null references profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_organizations_slug on organizations (slug) where deleted_at is null;

create trigger set_organizations_updated_at
  before update on organizations
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- roles: fixed set of organization roles (system-defined, not per-tenant).
-- ----------------------------------------------------------------------------
create table roles (
  id smallint primary key,
  name text not null unique,
  description text
);

insert into roles (id, name, description) values
  (1, 'OWNER', 'Full control over the organization, including billing and deletion.'),
  (2, 'ADMIN', 'Manage team, settings, and all CRM data.'),
  (3, 'MANAGER', 'Manage CRM data and view reports for the team.'),
  (4, 'SALES', 'Create and manage customers, leads, and deals.'),
  (5, 'SUPPORT', 'Manage support tickets and view customer data.'),
  (6, 'MEMBER', 'Baseline read access with limited write permissions.');

-- ----------------------------------------------------------------------------
-- permissions: granular, resource.action permission strings.
-- ----------------------------------------------------------------------------
create table permissions (
  id smallint generated always as identity primary key,
  key text not null unique,
  description text
);

insert into permissions (key, description) values
  ('customers.read', 'View customers'),
  ('customers.create', 'Create customers'),
  ('customers.update', 'Edit customers'),
  ('customers.delete', 'Delete or archive customers'),
  ('leads.read', 'View leads'),
  ('leads.create', 'Create leads'),
  ('leads.update', 'Edit leads'),
  ('leads.delete', 'Delete leads'),
  ('deals.read', 'View deals'),
  ('deals.create', 'Create deals'),
  ('deals.update', 'Edit deals'),
  ('deals.delete', 'Delete deals'),
  ('tasks.read', 'View tasks'),
  ('tasks.create', 'Create tasks'),
  ('tasks.update', 'Edit tasks'),
  ('tasks.delete', 'Delete tasks'),
  ('tickets.read', 'View support tickets'),
  ('tickets.create', 'Create support tickets'),
  ('tickets.update', 'Edit support tickets'),
  ('tickets.delete', 'Delete support tickets'),
  ('reports.read', 'View analytics and reports'),
  ('settings.manage', 'Manage organization settings'),
  ('team.manage', 'Invite, remove, and change roles of team members'),
  ('billing.manage', 'Manage subscription and billing');

-- ----------------------------------------------------------------------------
-- role_permissions: the permission matrix for each system role.
-- ----------------------------------------------------------------------------
create table role_permissions (
  role_id smallint not null references roles (id) on delete cascade,
  permission_id smallint not null references permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

-- OWNER and ADMIN: every permission.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r cross join permissions p where r.name in ('OWNER', 'ADMIN');

-- MANAGER: everything except billing.manage and team.manage.
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
cross join permissions p
where r.name = 'MANAGER'
  and p.key not in ('billing.manage', 'team.manage');

-- SALES: full CRM (customers/leads/deals/tasks), read-only reports, no tickets/settings/team/billing.
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
cross join permissions p
where r.name = 'SALES'
  and (
    p.key like 'customers.%' or p.key like 'leads.%' or p.key like 'deals.%' or p.key like 'tasks.%'
    or p.key = 'reports.read'
  );

-- SUPPORT: full tickets, read-only customers/tasks, no leads/deals/settings/team/billing.
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
cross join permissions p
where r.name = 'SUPPORT'
  and (p.key like 'tickets.%' or p.key in ('customers.read', 'tasks.read', 'tasks.create', 'tasks.update'));

-- MEMBER: read-only across CRM + tasks.
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
cross join permissions p
where r.name = 'MEMBER'
  and p.key in ('customers.read', 'leads.read', 'deals.read', 'tasks.read', 'tickets.read');

-- ----------------------------------------------------------------------------
-- organization_members: join table resolving which users belong to which
-- organizations, and with what role. This is the anchor for every RLS policy.
-- ----------------------------------------------------------------------------
create type member_status as enum ('ACTIVE', 'INVITED', 'DEACTIVATED');

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid references profiles (id) on delete cascade,
  role_id smallint not null references roles (id) on delete restrict,
  status member_status not null default 'INVITED',
  invited_email text,
  invited_by uuid references profiles (id) on delete set null,
  invited_at timestamptz,
  joined_at timestamptz,
  deactivated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_user_or_invite check (
    (user_id is not null) or (invited_email is not null)
  )
);

create unique index uq_org_members_org_user on organization_members (organization_id, user_id)
  where user_id is not null;
create unique index uq_org_members_org_invite on organization_members (organization_id, invited_email)
  where user_id is null and invited_email is not null;
create index idx_org_members_user on organization_members (user_id);
create index idx_org_members_org on organization_members (organization_id);

create trigger set_organization_members_updated_at
  before update on organization_members
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Helper functions used throughout RLS policies (defined here so later
-- migrations and policies can depend on them).
-- ----------------------------------------------------------------------------

-- Is the current authenticated user an ACTIVE member of the given organization?
create or replace function is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from organization_members m
    where m.organization_id = target_org_id
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
  );
$$;

-- Does the current authenticated user hold the given permission key in the
-- given organization? Owners/admins get everything through role_permissions.
create or replace function has_permission(target_org_id uuid, permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from organization_members m
    join role_permissions rp on rp.role_id = m.role_id
    join permissions p on p.id = rp.permission_id
    where m.organization_id = target_org_id
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
      and p.key = permission_key
  );
$$;

comment on function is_org_member(uuid) is
  'RLS helper: true if auth.uid() is an ACTIVE member of the organization.';
comment on function has_permission(uuid, text) is
  'RLS/authorization helper: true if auth.uid() has the given permission key in the organization via their role.';
