begin;
create unique index transactions_active_telegram_idempotency_conflict_idx on public.transactions (user_id, source, idempotency_key) where deleted_at is null;
commit;
