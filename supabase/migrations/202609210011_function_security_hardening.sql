-- Phase 33: close default EXECUTE grants left by PostgreSQL's PUBLIC role.
-- Application-facing SECURITY DEFINER RPCs are granted explicitly below;
-- internal helpers are never callable through PostgREST.
begin;

alter default privileges for role postgres in schema public revoke execute on functions from public;

do $$
declare function_signature text;
begin
  for function_signature in
    select p.oid::regprocedure::text
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prosecdef
  loop
    execute format('revoke all on function public.%s from public, anon, authenticated', function_signature);
  end loop;
end;
$$;

-- Trigger-only helpers must not be exposed as RPC endpoints.
revoke all on function public.recurring_tz(uuid) from authenticated;
revoke all on function public.validate_recurring_rule() from authenticated;
revoke all on function public.validate_transaction_split_set(uuid, uuid) from authenticated;

-- Explicit least-privilege grants for normal authenticated application flows.
grant execute on function public.perform_wallet_transfer(uuid, uuid, numeric, text, text) to authenticated;
grant execute on function public.save_transaction_with_splits(uuid, uuid, public.transaction_type, numeric, public.currency_code, text, text, text, timestamptz, public.transaction_status, text, jsonb) to authenticated;
grant execute on function public.import_bank_statement(uuid, text, text, integer, integer, integer, jsonb) to authenticated;
grant execute on function public.finexy_export_backup() to authenticated;
grant execute on function public.finexy_import_backup(jsonb, text) to authenticated;
grant execute on function public.create_recurring_transaction_rule(text, uuid, uuid, numeric, text, text, date, date, time) to authenticated;
grant execute on function public.update_recurring_transaction_rule(uuid, text, uuid, uuid, numeric, text, text, date, date, time) to authenticated;
grant execute on function public.set_recurring_transaction_rule_active(uuid, boolean) to authenticated;
grant execute on function public.archive_recurring_transaction_rule(uuid) to authenticated;
grant execute on function public.create_telegram_link_code() to authenticated;
grant execute on function public.unlink_telegram() to authenticated;
grant execute on function public.get_telegram_diagnostics() to authenticated;
grant execute on function public.queue_telegram_budget_notification() to authenticated;
grant execute on function public.queue_telegram_test_notification() to authenticated;

-- Trigger helpers execute in the database role context, but still receive a
-- fixed resolution path to satisfy the database security advisor.
alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.validate_transaction_relationships() set search_path = public, pg_temp;
alter function public.validate_budget_category() set search_path = public, pg_temp;
alter function public.validate_transfer_links() set search_path = public, pg_temp;
alter function public.validate_transaction_split_set_trigger() set search_path = public, pg_temp;
alter function public.validate_transaction_parent_split_trigger() set search_path = public, pg_temp;

commit;
