-- Qualify wallet columns used by the transfer RPC so output-column names
-- cannot become ambiguous inside PL/pgSQL queries.
begin;

create or replace function public.perform_wallet_transfer(
  p_source_wallet_id uuid,
  p_destination_wallet_id uuid,
  p_amount numeric,
  p_note text default null,
  p_idempotency_key text default null
)
returns table (
  transfer_id uuid,
  source_wallet_id uuid,
  destination_wallet_id uuid,
  source_transaction_id uuid,
  destination_transaction_id uuid,
  source_amount numeric,
  destination_amount numeric,
  status public.transfer_status,
  reference text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_source_currency public.currency_code;
  v_destination_currency public.currency_code;
  v_source_status public.wallet_status;
  v_destination_status public.wallet_status;
  v_source_deleted_at timestamptz;
  v_destination_deleted_at timestamptz;
  v_source_name text;
  v_destination_name text;
  v_source_balance numeric;
  v_transfer_id uuid;
  v_source_transaction_id uuid;
  v_destination_transaction_id uuid;
  v_reference text := nullif(trim(p_note), '');
  v_existing public.wallet_transfers%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'You must be signed in to transfer funds.';
  end if;

  if p_idempotency_key is null or char_length(trim(p_idempotency_key)) = 0 then
    raise exception using errcode = '22023', message = 'A transfer idempotency key is required.';
  end if;

  if char_length(trim(p_idempotency_key)) > 200 then
    raise exception using errcode = '22023', message = 'The transfer idempotency key is too long.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception using errcode = '22023', message = 'Transfer amount must be greater than zero.';
  end if;

  if p_source_wallet_id = p_destination_wallet_id then
    raise exception using errcode = '22023', message = 'Source and destination wallets must be different.';
  end if;

  if v_reference is not null and char_length(v_reference) > 200 then
    raise exception using errcode = '22023', message = 'Transfer note is too long.';
  end if;

  select * into v_existing
    from public.wallet_transfers
   where user_id = v_user_id
     and source = 'web'
     and idempotency_key = trim(p_idempotency_key)
     and deleted_at is null;

  if found then
    return query select v_existing.id, v_existing.source_wallet_id,
      v_existing.destination_wallet_id, v_existing.source_transaction_id,
      v_existing.destination_transaction_id, v_existing.source_amount,
      v_existing.destination_amount, v_existing.status, v_existing.reference,
      v_existing.created_at;
    return;
  end if;

  if p_source_wallet_id < p_destination_wallet_id then
    perform 1 from public.wallets where id = p_source_wallet_id and user_id = v_user_id for update;
    perform 1 from public.wallets where id = p_destination_wallet_id and user_id = v_user_id for update;
  else
    perform 1 from public.wallets where id = p_destination_wallet_id and user_id = v_user_id for update;
    perform 1 from public.wallets where id = p_source_wallet_id and user_id = v_user_id for update;
  end if;

  select w.currency, w.status, w.deleted_at, w.name
    into v_source_currency, v_source_status, v_source_deleted_at, v_source_name
    from public.wallets as w
   where w.id = p_source_wallet_id and w.user_id = v_user_id;

  select w.currency, w.status, w.deleted_at, w.name
    into v_destination_currency, v_destination_status, v_destination_deleted_at, v_destination_name
    from public.wallets as w
   where w.id = p_destination_wallet_id and w.user_id = v_user_id;

  if v_source_currency is null or v_destination_currency is null then
    raise exception using errcode = '42501', message = 'Source and destination wallets must belong to your account.';
  end if;

  if v_source_deleted_at is not null or v_destination_deleted_at is not null then
    raise exception using errcode = '22023', message = 'Archived wallets cannot be used for transfers.';
  end if;

  if v_source_status <> 'active' or v_destination_status <> 'active' then
    raise exception using errcode = '22023', message = 'Only active wallets can be used for transfers.';
  end if;

  if v_source_currency <> v_destination_currency then
    raise exception using errcode = '22023', message = 'Cross-currency transfers are not supported yet.';
  end if;

  select w.opening_balance + coalesce(sum(
    case
      when t.type = 'income' then t.amount
      when t.type = 'expense' then -t.amount
      when t.type = 'transfer' and t.transfer_leg = 'inbound' then t.amount
      when t.type = 'transfer' and t.transfer_leg = 'outbound' then -t.amount
      else 0
    end
  ), 0)
    into v_source_balance
    from public.wallets as w
    left join public.transactions as t
      on t.wallet_id = w.id
     and t.user_id = v_user_id
     and t.status = 'completed'
     and t.deleted_at is null
   where w.id = p_source_wallet_id
     and w.user_id = v_user_id
   group by w.opening_balance;

  if v_source_balance < p_amount then
    raise exception using errcode = '22023', message = 'Transfer amount exceeds the settled source balance.';
  end if;

  insert into public.wallet_transfers (
    user_id, source_wallet_id, destination_wallet_id, source_amount,
    destination_amount, exchange_rate, fee_amount, status, source,
    reference, idempotency_key
  ) values (
    v_user_id, p_source_wallet_id, p_destination_wallet_id, p_amount,
    p_amount, null, 0, 'pending', 'web', v_reference, trim(p_idempotency_key)
  )
  on conflict (user_id, source, idempotency_key) where deleted_at is null do nothing
  returning id into v_transfer_id;

  if v_transfer_id is null then
    select * into v_existing
      from public.wallet_transfers
     where user_id = v_user_id
       and source = 'web'
       and idempotency_key = trim(p_idempotency_key)
       and deleted_at is null;
    if not found then
      raise exception using errcode = '40001', message = 'Transfer retry could not resolve its existing result.';
    end if;
    return query select v_existing.id, v_existing.source_wallet_id,
      v_existing.destination_wallet_id, v_existing.source_transaction_id,
      v_existing.destination_transaction_id, v_existing.source_amount,
      v_existing.destination_amount, v_existing.status, v_existing.reference,
      v_existing.created_at;
    return;
  end if;

  v_source_transaction_id := gen_random_uuid();
  v_destination_transaction_id := gen_random_uuid();

  insert into public.transactions (
    id, user_id, wallet_id, transfer_id, type, transfer_leg, amount,
    currency, payee, description, note, occurred_at, posted_at, cleared_at,
    status, source, reference
  ) values (
    v_source_transaction_id, v_user_id, p_source_wallet_id, v_transfer_id,
    'transfer', 'outbound', p_amount, v_source_currency, v_destination_name,
    format('Transfer to %s', v_destination_name), v_reference,
    timezone('utc', now()), timezone('utc', now()), timezone('utc', now()),
    'completed', 'web', v_reference
  );

  insert into public.transactions (
    id, user_id, wallet_id, transfer_id, type, transfer_leg, amount,
    currency, payee, description, note, occurred_at, posted_at, cleared_at,
    status, source, reference
  ) values (
    v_destination_transaction_id, v_user_id, p_destination_wallet_id, v_transfer_id,
    'transfer', 'inbound', p_amount, v_destination_currency, v_source_name,
    format('Transfer from %s', v_source_name), v_reference,
    timezone('utc', now()), timezone('utc', now()), timezone('utc', now()),
    'completed', 'web', v_reference
  );

  update public.wallet_transfers
     set source_transaction_id = v_source_transaction_id,
         destination_transaction_id = v_destination_transaction_id,
         status = 'completed'
   where id = v_transfer_id and user_id = v_user_id;

  return query
    select wt.id, wt.source_wallet_id, wt.destination_wallet_id,
           wt.source_transaction_id, wt.destination_transaction_id,
           wt.source_amount, wt.destination_amount, wt.status,
           wt.reference, wt.created_at
      from public.wallet_transfers as wt
     where wt.id = v_transfer_id and wt.user_id = v_user_id;
end;
$$;

revoke all on function public.perform_wallet_transfer(uuid, uuid, numeric, text, text) from public;
grant execute on function public.perform_wallet_transfer(uuid, uuid, numeric, text, text) to authenticated;

commit;
