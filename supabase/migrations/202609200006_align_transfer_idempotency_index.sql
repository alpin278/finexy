-- Keep the transfer idempotency uniqueness semantics while making the
-- predicate inferable by the atomic RPC's ON CONFLICT target.
begin;

drop index if exists public.wallet_transfers_active_idempotency_unique;

create unique index wallet_transfers_active_idempotency_unique
  on public.wallet_transfers (user_id, source, idempotency_key)
  where deleted_at is null;

commit;
