-- ============================================================================
-- 0001_extensions_and_helpers.sql
-- Extensions and shared helper functions/triggers used across all tables.
-- ============================================================================

create extension if not exists "pgcrypto";

-- Generic trigger function to keep updated_at current on every row update.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function set_updated_at() is
  'Trigger function: stamps updated_at = now() on every UPDATE. Attach to any table with an updated_at column.';
