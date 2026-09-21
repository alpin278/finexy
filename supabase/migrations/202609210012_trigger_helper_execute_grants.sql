-- Phase 33 follow-up: these SECURITY DEFINER validation helpers execute from
-- owner-scoped triggers during normal authenticated writes. They return void
-- and derive/validate ownership from canonical rows; they are not write APIs.
begin;

grant execute on function public.validate_transaction_split_set(uuid, uuid) to authenticated;
grant execute on function public.validate_recurring_rule() to authenticated;

commit;
