-- ============================================================================
-- 0016_audit_logs_permission.sql
-- Tightens audit_logs SELECT to settings.manage holders, matching the
-- frontend's route gate and the API's intended permission check — audit
-- history is an admin/owner concern, not something every org member should
-- read via a direct RLS-backed query. Insert stays open to any org member
-- (every module's write path logs its own actions as whichever member
-- performed them), and remains the only allowed mutation — no update/delete
-- policy exists for any role.
-- ============================================================================

drop policy "audit_logs_select" on audit_logs;

create policy "audit_logs_select" on audit_logs
  for select using (has_permission(organization_id, 'settings.manage'));
