-- Phase 31: statement contents stay in the browser. This records only an
-- auditable import summary and deterministic fingerprints for idempotency.
begin;

create table public.import_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  wallet_id uuid not null,
  file_name text not null,
  provider text,
  imported_at timestamptz not null default timezone('utc', now()),
  total_rows integer not null check (total_rows >= 0),
  imported_rows integer not null check (imported_rows >= 0),
  duplicate_rows integer not null default 0 check (duplicate_rows >= 0),
  rejected_rows integer not null default 0 check (rejected_rows >= 0),
  constraint import_sessions_wallet_owner_fk foreign key (wallet_id, user_id) references public.wallets(id, user_id) on delete restrict,
  constraint import_sessions_file_name_length check (char_length(trim(file_name)) between 1 and 260)
);
create index import_sessions_user_wallet_imported_idx on public.import_sessions(user_id, wallet_id, imported_at desc);
alter table public.import_sessions enable row level security;
create policy import_sessions_owner_access on public.import_sessions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table public.transaction_import_fingerprints (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  wallet_id uuid not null, transaction_id uuid not null, fingerprint text not null, external_reference text,
  import_session_id uuid not null references public.import_sessions(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  constraint import_fingerprint_wallet_owner_fk foreign key (wallet_id, user_id) references public.wallets(id, user_id) on delete restrict,
  constraint import_fingerprint_transaction_owner_fk foreign key (transaction_id, user_id) references public.transactions(id, user_id) on delete restrict,
  constraint import_fingerprint_unique unique(user_id, wallet_id, fingerprint),
  constraint import_fingerprint_length check (char_length(fingerprint) between 16 and 128)
);
create index transaction_import_fingerprints_user_wallet_idx on public.transaction_import_fingerprints(user_id, wallet_id);
alter table public.transaction_import_fingerprints enable row level security;
create policy transaction_import_fingerprints_owner_access on public.transaction_import_fingerprints for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create function public.import_bank_statement(p_wallet_id uuid, p_file_name text, p_provider text, p_total_rows integer, p_duplicate_rows integer, p_rejected_rows integer, p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid := auth.uid(); v_currency public.currency_code; v_session uuid; v_row jsonb; v_transaction uuid; v_count integer := 0; v_fingerprint text;
begin
  if v_user is null then raise exception using errcode='42501', message='Authentication required.'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 5000 then raise exception using errcode='22023', message='Import rows are invalid.'; end if;
  select currency into v_currency from public.wallets where id=p_wallet_id and user_id=v_user and deleted_at is null and status='active';
  if v_currency is null then raise exception using errcode='42501', message='Destination wallet is unavailable.'; end if;
  insert into public.import_sessions(user_id,wallet_id,file_name,provider,total_rows,imported_rows,duplicate_rows,rejected_rows) values(v_user,p_wallet_id,left(trim(p_file_name),260),nullif(left(trim(coalesce(p_provider,'')),120),''),p_total_rows,0,p_duplicate_rows,p_rejected_rows) returning id into v_session;
  for v_row in select value from jsonb_array_elements(p_rows) loop
    if coalesce(v_row->>'fingerprint','') !~ '^[a-f0-9]{16,128}$' or v_row->>'type' not in ('income','expense') or coalesce(v_row->>'amount','') !~ '^[0-9]+(\.[0-9]{1,4})?$' or (v_row->>'amount')::numeric <= 0 or coalesce(v_row->>'description','') = '' then raise exception using errcode='22023', message='An approved import row is invalid.'; end if;
    if v_row->>'currency' <> v_currency::text then raise exception using errcode='22023', message='Import currency must match the wallet.'; end if;
    v_fingerprint := v_row->>'fingerprint';
    if exists(select 1 from public.transaction_import_fingerprints where user_id=v_user and wallet_id=p_wallet_id and fingerprint=v_fingerprint) then raise exception using errcode='23505', message='An approved import row was already imported.'; end if;
    if not exists(select 1 from public.categories where id=(v_row->>'category_id')::uuid and user_id=v_user and archived_at is null and type=(v_row->>'type')::public.category_type) then raise exception using errcode='22023', message='An approved import category is invalid.'; end if;
    insert into public.transactions(user_id,wallet_id,category_id,type,amount,currency,payee,description,occurred_at,status,source,reference,external_id,external_metadata)
    values(v_user,p_wallet_id,(v_row->>'category_id')::uuid,(v_row->>'type')::public.transaction_type,(v_row->>'amount')::numeric,v_currency,left(v_row->>'description',500),left(v_row->>'description',500),(v_row->>'occurred_at')::timestamptz,'completed','import',nullif(left(v_row->>'reference',200),''),v_fingerprint,jsonb_build_object('import_session_id',v_session)) returning id into v_transaction;
    insert into public.transaction_import_fingerprints(user_id,wallet_id,transaction_id,fingerprint,external_reference,import_session_id) values(v_user,p_wallet_id,v_transaction,v_fingerprint,nullif(left(v_row->>'reference',200),''),v_session);
    v_count := v_count + 1;
  end loop;
  update public.import_sessions set imported_rows=v_count where id=v_session;
  return jsonb_build_object('session_id',v_session,'imported_rows',v_count,'duplicate_rows',p_duplicate_rows,'rejected_rows',p_rejected_rows);
end; $$;
revoke all on function public.import_bank_statement(uuid,text,text,integer,integer,integer,jsonb) from public, anon;
grant execute on function public.import_bank_statement(uuid,text,text,integer,integer,integer,jsonb) to authenticated;
commit;
