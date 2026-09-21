begin;

-- Parents remain the sole wallet/cash-flow ledger rows. Allocations are only
-- category attribution and are always written atomically through the RPC below.
alter table public.transactions add constraint transactions_id_user_unique unique (id, user_id);

create table public.transaction_splits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  transaction_id uuid not null,
  category_id uuid not null,
  amount numeric(20,4) not null,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint transaction_splits_parent_owner_fk foreign key (transaction_id, user_id)
    references public.transactions (id, user_id) on delete restrict,
  constraint transaction_splits_category_owner_fk foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete restrict,
  constraint transaction_splits_amount_positive check (amount > 0),
  constraint transaction_splits_note_length check (note is null or char_length(trim(note)) <= 500)
);

create index transaction_splits_user_transaction_idx on public.transaction_splits (user_id, transaction_id);
create index transaction_splits_user_category_idx on public.transaction_splits (user_id, category_id);

create or replace function public.validate_transaction_split_set(p_transaction_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_parent public.transactions%rowtype; v_count integer; v_total numeric(20,4); v_invalid boolean;
begin
  select * into v_parent from public.transactions where id=p_transaction_id and user_id=p_user_id;
  if not found then raise exception 'Split parent transaction must belong to its user'; end if;
  select count(*), coalesce(sum(amount), 0), bool_or(c.type::text <> v_parent.type::text or c.archived_at is not null)
    into v_count, v_total, v_invalid
    from public.transaction_splits s join public.categories c on c.id=s.category_id and c.user_id=s.user_id
   where s.transaction_id=p_transaction_id and s.user_id=p_user_id;
  if v_count = 0 then return; end if;
  if v_parent.type = 'transfer' or v_parent.transfer_id is not null then raise exception 'Transfer transactions cannot have split allocations'; end if;
  if v_count < 2 then raise exception 'Split transactions require at least two allocations'; end if;
  if v_total <> v_parent.amount then raise exception 'Split allocations must equal the parent transaction amount exactly'; end if;
  if coalesce(v_invalid, false) then raise exception 'Split categories must be active and match the parent transaction type'; end if;
end;
$$;

create or replace function public.validate_transaction_split_set_trigger()
returns trigger language plpgsql as $$
begin
  perform public.validate_transaction_split_set(coalesce(new.transaction_id, old.transaction_id), coalesce(new.user_id, old.user_id));
  return null;
end;
$$;

create constraint trigger transaction_splits_exact_total_check
after insert or update or delete on public.transaction_splits
deferrable initially deferred for each row execute function public.validate_transaction_split_set_trigger();

create or replace function public.validate_transaction_parent_split_trigger()
returns trigger language plpgsql as $$
begin
  perform public.validate_transaction_split_set(new.id, new.user_id);
  return null;
end;
$$;

create constraint trigger transactions_split_parent_exact_total_check
after update of amount, type, transfer_id on public.transactions
deferrable initially deferred for each row execute function public.validate_transaction_parent_split_trigger();

create trigger transaction_splits_set_updated_at before update on public.transaction_splits
for each row execute function public.set_updated_at();

alter table public.transaction_splits enable row level security;
create policy transaction_splits_owner_access on public.transaction_splits
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function public.save_transaction_with_splits(
  p_transaction_id uuid,
  p_wallet_id uuid, p_type public.transaction_type, p_amount numeric,
  p_currency public.currency_code, p_payee text, p_description text, p_note text,
  p_occurred_at timestamptz, p_status public.transaction_status, p_reference text,
  p_splits jsonb
) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid := auth.uid(); v_id uuid; v_first_category uuid; v_count integer; v_total numeric(20,4); v_split record;
begin
  if v_user is null then raise exception using errcode='42501', message='Authentication required.'; end if;
  if p_type = 'transfer' or p_splits is null or jsonb_typeof(p_splits) <> 'array' then raise exception using errcode='22023', message='Split transaction data is invalid.'; end if;
  select count(*), coalesce(sum((value->>'amount')::numeric), 0)
    into v_count, v_total from jsonb_array_elements(p_splits);
  select (value->>'category_id')::uuid into v_first_category from jsonb_array_elements(p_splits) limit 1;
  if v_count < 2 or v_total <> p_amount then raise exception using errcode='22023', message='Split allocations must equal the transaction total.'; end if;
  if p_transaction_id is null then
    insert into public.transactions (user_id,wallet_id,category_id,type,amount,currency,payee,description,note,occurred_at,status,source,reference)
    values (v_user,p_wallet_id,v_first_category,p_type,p_amount,p_currency,p_payee,p_description,p_note,p_occurred_at,p_status,'web',p_reference) returning id into v_id;
  else
    select id into v_id from public.transactions where id=p_transaction_id and user_id=v_user and deleted_at is null and transfer_id is null for update;
    if v_id is null then raise exception using errcode='42501', message='Transaction is unavailable for split editing.'; end if;
    update public.transactions set wallet_id=p_wallet_id,category_id=v_first_category,type=p_type,amount=p_amount,currency=p_currency,payee=p_payee,description=p_description,note=p_note,occurred_at=p_occurred_at,status=p_status,reference=p_reference where id=v_id and user_id=v_user;
    delete from public.transaction_splits where transaction_id=v_id and user_id=v_user;
  end if;
  for v_split in select (value->>'category_id')::uuid as category_id, (value->>'amount')::numeric as amount, nullif(value->>'note','') as note from jsonb_array_elements(p_splits) loop
    insert into public.transaction_splits (user_id,transaction_id,category_id,amount,note) values (v_user,v_id,v_split.category_id,v_split.amount,v_split.note);
  end loop;
  return v_id;
end;
$$;

revoke all on function public.save_transaction_with_splits(uuid,uuid,public.transaction_type,numeric,public.currency_code,text,text,text,timestamptz,public.transaction_status,text,jsonb) from public, anon;
grant execute on function public.save_transaction_with_splits(uuid,uuid,public.transaction_type,numeric,public.currency_code,text,text,text,timestamptz,public.transaction_status,text,jsonb) to authenticated;

commit;
