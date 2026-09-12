-- ============================================================================
-- 0014_notifications_realtime.sql
-- Enables Supabase Realtime delivery for per-user notifications. RLS (from
-- 0012_row_level_security.sql) already restricts SELECT to user_id =
-- auth.uid(), and Supabase Realtime enforces the same policies on
-- postgres_changes subscriptions, so adding the table to the publication
-- does not widen who can see a notification — it only adds live delivery
-- on top of the existing per-user read policy.
-- ============================================================================

alter publication supabase_realtime add table notifications;
