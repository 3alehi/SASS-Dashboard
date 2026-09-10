-- ============================================================================
-- 0012_row_level_security.sql
-- Enable Row Level Security on every tenant-owned table and define policies.
--
-- Principles:
--   - Every policy scopes rows through organization_id via is_org_member()/
--     has_permission() — never `USING (true)`.
--   - SELECT requires organization membership (is_org_member).
--   - INSERT/UPDATE/DELETE require the specific resource permission
--     (has_permission), so RBAC is enforced at the database layer, not just
--     in application code.
--   - Reference tables (roles, permissions, role_permissions, lead_sources,
--     lead_statuses) are global, read-only lookup data: readable by any
--     authenticated user, writable by no one via the client.
--   - audit_logs is insert-only for members; no update/delete policy exists
--     for any role, making it effectively append-only.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
alter table profiles enable row level security;

create policy "profiles_select_self_or_org_peers" on profiles
  for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from organization_members mine
      join organization_members peer on peer.organization_id = mine.organization_id
      where mine.user_id = auth.uid()
        and mine.status = 'ACTIVE'
        and peer.user_id = profiles.id
        and peer.status = 'ACTIVE'
    )
  );

create policy "profiles_update_self" on profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- organizations
-- ----------------------------------------------------------------------------
alter table organizations enable row level security;

create policy "organizations_select_member" on organizations
  for select
  using (is_org_member(id));

create policy "organizations_insert_authenticated" on organizations
  for insert
  with check (created_by = auth.uid());

create policy "organizations_update_settings_manage" on organizations
  for update
  using (has_permission(id, 'settings.manage'))
  with check (has_permission(id, 'settings.manage'));

-- ----------------------------------------------------------------------------
-- roles / permissions / role_permissions — global read-only lookup tables
-- ----------------------------------------------------------------------------
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;

create policy "roles_select_authenticated" on roles
  for select
  using (auth.role() = 'authenticated');

create policy "permissions_select_authenticated" on permissions
  for select
  using (auth.role() = 'authenticated');

create policy "role_permissions_select_authenticated" on role_permissions
  for select
  using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- organization_members
-- ----------------------------------------------------------------------------
alter table organization_members enable row level security;

create policy "org_members_select_member" on organization_members
  for select
  using (is_org_member(organization_id));

create policy "org_members_insert_team_manage" on organization_members
  for insert
  with check (has_permission(organization_id, 'team.manage'));

create policy "org_members_update_team_manage" on organization_members
  for update
  using (has_permission(organization_id, 'team.manage'))
  with check (has_permission(organization_id, 'team.manage'));

create policy "org_members_delete_team_manage" on organization_members
  for delete
  using (has_permission(organization_id, 'team.manage'));

-- ----------------------------------------------------------------------------
-- tags / entity_tags
-- entity_tags is a join table: tagging/untagging is add/remove (insert/
-- delete), never an in-place update, so no UPDATE policy is defined.
-- ----------------------------------------------------------------------------
alter table tags enable row level security;
alter table entity_tags enable row level security;

create policy "tags_select_member" on tags for select using (is_org_member(organization_id));
create policy "tags_insert_member" on tags for insert with check (is_org_member(organization_id));
create policy "tags_update_member" on tags
  for update using (is_org_member(organization_id))
  with check (is_org_member(organization_id));
create policy "tags_delete_member" on tags for delete using (is_org_member(organization_id));

create policy "entity_tags_select_member" on entity_tags
  for select using (is_org_member(organization_id));
create policy "entity_tags_insert_member" on entity_tags
  for insert with check (is_org_member(organization_id));
create policy "entity_tags_delete_member" on entity_tags
  for delete using (is_org_member(organization_id));

-- ----------------------------------------------------------------------------
-- customers / customer_contacts
-- ----------------------------------------------------------------------------
alter table customers enable row level security;
alter table customer_contacts enable row level security;

create policy "customers_select" on customers
  for select using (has_permission(organization_id, 'customers.read'));
create policy "customers_insert" on customers
  for insert with check (has_permission(organization_id, 'customers.create'));
create policy "customers_update" on customers
  for update using (has_permission(organization_id, 'customers.update'))
  with check (has_permission(organization_id, 'customers.update'));
create policy "customers_delete" on customers
  for delete using (has_permission(organization_id, 'customers.delete'));

create policy "customer_contacts_select" on customer_contacts
  for select using (has_permission(organization_id, 'customers.read'));
create policy "customer_contacts_insert" on customer_contacts
  for insert with check (has_permission(organization_id, 'customers.update'));
create policy "customer_contacts_update" on customer_contacts
  for update using (has_permission(organization_id, 'customers.update'))
  with check (has_permission(organization_id, 'customers.update'));
create policy "customer_contacts_delete" on customer_contacts
  for delete using (has_permission(organization_id, 'customers.delete'));

-- ----------------------------------------------------------------------------
-- lead_sources / lead_statuses — global read-only lookup tables
-- ----------------------------------------------------------------------------
alter table lead_sources enable row level security;
alter table lead_statuses enable row level security;

create policy "lead_sources_select_authenticated" on lead_sources
  for select using (auth.role() = 'authenticated');
create policy "lead_statuses_select_authenticated" on lead_statuses
  for select using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- leads
-- ----------------------------------------------------------------------------
alter table leads enable row level security;

create policy "leads_select" on leads
  for select using (has_permission(organization_id, 'leads.read'));
create policy "leads_insert" on leads
  for insert with check (has_permission(organization_id, 'leads.create'));
create policy "leads_update" on leads
  for update using (has_permission(organization_id, 'leads.update'))
  with check (has_permission(organization_id, 'leads.update'));
create policy "leads_delete" on leads
  for delete using (has_permission(organization_id, 'leads.delete'));

-- ----------------------------------------------------------------------------
-- pipelines / pipeline_stages / products / deals / deal_products
-- ----------------------------------------------------------------------------
alter table pipelines enable row level security;
alter table pipeline_stages enable row level security;
alter table products enable row level security;
alter table deals enable row level security;
alter table deal_products enable row level security;

create policy "pipelines_select" on pipelines
  for select using (has_permission(organization_id, 'deals.read'));
create policy "pipelines_insert" on pipelines
  for insert with check (has_permission(organization_id, 'settings.manage'));
create policy "pipelines_update" on pipelines
  for update using (has_permission(organization_id, 'settings.manage'))
  with check (has_permission(organization_id, 'settings.manage'));
create policy "pipelines_delete" on pipelines
  for delete using (has_permission(organization_id, 'settings.manage'));

create policy "pipeline_stages_select" on pipeline_stages
  for select using (has_permission(organization_id, 'deals.read'));
create policy "pipeline_stages_insert" on pipeline_stages
  for insert with check (has_permission(organization_id, 'settings.manage'));
create policy "pipeline_stages_update" on pipeline_stages
  for update using (has_permission(organization_id, 'settings.manage'))
  with check (has_permission(organization_id, 'settings.manage'));
create policy "pipeline_stages_delete" on pipeline_stages
  for delete using (has_permission(organization_id, 'settings.manage'));

create policy "products_select" on products
  for select using (has_permission(organization_id, 'deals.read'));
create policy "products_insert" on products
  for insert with check (has_permission(organization_id, 'deals.update'));
create policy "products_update" on products
  for update using (has_permission(organization_id, 'deals.update'))
  with check (has_permission(organization_id, 'deals.update'));
create policy "products_delete" on products
  for delete using (has_permission(organization_id, 'deals.delete'));

create policy "deals_select" on deals
  for select using (has_permission(organization_id, 'deals.read'));
create policy "deals_insert" on deals
  for insert with check (has_permission(organization_id, 'deals.create'));
create policy "deals_update" on deals
  for update using (has_permission(organization_id, 'deals.update'))
  with check (has_permission(organization_id, 'deals.update'));
create policy "deals_delete" on deals
  for delete using (has_permission(organization_id, 'deals.delete'));

create policy "deal_products_select" on deal_products
  for select using (has_permission(organization_id, 'deals.read'));
create policy "deal_products_insert" on deal_products
  for insert with check (has_permission(organization_id, 'deals.update'));
create policy "deal_products_update" on deal_products
  for update using (has_permission(organization_id, 'deals.update'))
  with check (has_permission(organization_id, 'deals.update'));
create policy "deal_products_delete" on deal_products
  for delete using (has_permission(organization_id, 'deals.delete'));

-- ----------------------------------------------------------------------------
-- tasks / task_comments
-- ----------------------------------------------------------------------------
alter table tasks enable row level security;
alter table task_comments enable row level security;

create policy "tasks_select" on tasks
  for select using (has_permission(organization_id, 'tasks.read'));
create policy "tasks_insert" on tasks
  for insert with check (has_permission(organization_id, 'tasks.create'));
create policy "tasks_update" on tasks
  for update using (has_permission(organization_id, 'tasks.update'))
  with check (has_permission(organization_id, 'tasks.update'));
create policy "tasks_delete" on tasks
  for delete using (has_permission(organization_id, 'tasks.delete'));

create policy "task_comments_select" on task_comments
  for select using (has_permission(organization_id, 'tasks.read'));
create policy "task_comments_insert" on task_comments
  for insert with check (has_permission(organization_id, 'tasks.update') and author_id = auth.uid());
create policy "task_comments_update" on task_comments
  for update using (author_id = auth.uid())
  with check (author_id = auth.uid() and has_permission(organization_id, 'tasks.read'));
create policy "task_comments_delete" on task_comments
  for delete using (author_id = auth.uid() or has_permission(organization_id, 'tasks.delete'));

-- ----------------------------------------------------------------------------
-- activities / notes
-- activities is an immutable timeline log (like audit_logs): insert-only,
-- no update/delete policy is granted to any role by design.
-- ----------------------------------------------------------------------------
alter table activities enable row level security;
alter table notes enable row level security;

create policy "activities_select" on activities
  for select using (is_org_member(organization_id));
create policy "activities_insert" on activities
  for insert with check (is_org_member(organization_id));

create policy "notes_select" on notes
  for select using (is_org_member(organization_id));
create policy "notes_insert" on notes
  for insert with check (is_org_member(organization_id));
create policy "notes_update" on notes
  for update using (created_by = auth.uid())
  with check (created_by = auth.uid() and is_org_member(organization_id));
create policy "notes_delete" on notes
  for delete using (created_by = auth.uid());

-- ----------------------------------------------------------------------------
-- tickets / ticket_messages
-- ----------------------------------------------------------------------------
alter table tickets enable row level security;
alter table ticket_messages enable row level security;

create policy "tickets_select" on tickets
  for select using (has_permission(organization_id, 'tickets.read'));
create policy "tickets_insert" on tickets
  for insert with check (has_permission(organization_id, 'tickets.create'));
create policy "tickets_update" on tickets
  for update using (has_permission(organization_id, 'tickets.update'))
  with check (has_permission(organization_id, 'tickets.update'));
create policy "tickets_delete" on tickets
  for delete using (has_permission(organization_id, 'tickets.delete'));

create policy "ticket_messages_select" on ticket_messages
  for select using (has_permission(organization_id, 'tickets.read'));
create policy "ticket_messages_insert" on ticket_messages
  for insert with check (has_permission(organization_id, 'tickets.update'));

-- ----------------------------------------------------------------------------
-- notifications — strictly per-user, never cross-user even within org
-- ----------------------------------------------------------------------------
alter table notifications enable row level security;

create policy "notifications_select_own" on notifications
  for select using (user_id = auth.uid());
create policy "notifications_update_own" on notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "notifications_delete_own" on notifications
  for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- audit_logs — insert-only for members, no update/delete policy for anyone
-- ----------------------------------------------------------------------------
alter table audit_logs enable row level security;

create policy "audit_logs_select" on audit_logs
  for select using (is_org_member(organization_id));
create policy "audit_logs_insert" on audit_logs
  for insert with check (is_org_member(organization_id));

-- ----------------------------------------------------------------------------
-- saved_filters / dashboard_widgets — per-user, optionally org-shared
-- ----------------------------------------------------------------------------
alter table saved_filters enable row level security;
alter table dashboard_widgets enable row level security;

create policy "saved_filters_select" on saved_filters
  for select using (user_id = auth.uid() or (is_shared and is_org_member(organization_id)));
create policy "saved_filters_insert" on saved_filters
  for insert with check (user_id = auth.uid() and is_org_member(organization_id));
create policy "saved_filters_update" on saved_filters
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid() and is_org_member(organization_id));
create policy "saved_filters_delete" on saved_filters
  for delete using (user_id = auth.uid());

create policy "dashboard_widgets_select_own" on dashboard_widgets
  for select using (user_id = auth.uid());
create policy "dashboard_widgets_insert_own" on dashboard_widgets
  for insert with check (user_id = auth.uid() and is_org_member(organization_id));
create policy "dashboard_widgets_update_own" on dashboard_widgets
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid() and is_org_member(organization_id));
create policy "dashboard_widgets_delete_own" on dashboard_widgets
  for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- user_preferences — strictly self
-- ----------------------------------------------------------------------------
alter table user_preferences enable row level security;

create policy "user_preferences_select_own" on user_preferences
  for select using (user_id = auth.uid());
create policy "user_preferences_upsert_own" on user_preferences
  for insert with check (
    user_id = auth.uid()
    and (active_organization_id is null or is_org_member(active_organization_id))
  );
create policy "user_preferences_update_own" on user_preferences
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (active_organization_id is null or is_org_member(active_organization_id))
  );

-- ----------------------------------------------------------------------------
-- organization_settings
-- ----------------------------------------------------------------------------
alter table organization_settings enable row level security;

create policy "organization_settings_select" on organization_settings
  for select using (is_org_member(organization_id));
create policy "organization_settings_upsert" on organization_settings
  for insert with check (has_permission(organization_id, 'settings.manage'));
create policy "organization_settings_update" on organization_settings
  for update using (has_permission(organization_id, 'settings.manage'))
  with check (has_permission(organization_id, 'settings.manage'));

-- ----------------------------------------------------------------------------
-- subscriptions — visible to members, only billing.manage can change plan
-- ----------------------------------------------------------------------------
alter table subscriptions enable row level security;

create policy "subscriptions_select" on subscriptions
  for select using (is_org_member(organization_id));
create policy "subscriptions_update" on subscriptions
  for update using (has_permission(organization_id, 'billing.manage'))
  with check (has_permission(organization_id, 'billing.manage'));
