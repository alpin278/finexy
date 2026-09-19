-- Financial ledger, deterministic category rules, transfers, and budgets.
-- Monetary values use numeric(20,4); derived balances and budget usage are not stored.

begin;

create type public.category_rule_field as enum ('payee', 'description');
create type public.rule_operator as enum ('contains', 'starts_with', 'exact_match');
create type public.transaction_type as enum ('income', 'expense', 'transfer');
create type public.transaction_status as enum ('pending', 'completed', 'canceled');
create type public.transaction_source as enum ('web', 'telegram', 'import', 'api');
create type public.transfer_status as enum ('pending', 'completed', 'canceled');
create type public.transfer_leg as enum ('outbound', 'inbound');

create table public.category_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null,
  field public.category_rule_field not null,
  operator public.rule_operator not null,
  value text not null,
  priority integer not null default 0,
  enabled boolean not null default true,
  label text,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint category_rules_category_owner_fk
    foreign key (category_id, user_id)
    references public.categories (id, user_id)
    on delete restrict,
  constraint category_rules_value_not_empty check (char_length(trim(value)) > 0),
  constraint category_rules_priority_non_negative check (priority >= 0),
  constraint category_rules_label_length check (label is null or char_length(trim(label)) <= 160)
);

create table public.wallet_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_wallet_id uuid not null,
  destination_wallet_id uuid not null,
  source_amount numeric(20, 4) not null,
  destination_amount numeric(20, 4) not null,
  exchange_rate numeric(30, 12),
  fee_amount numeric(20, 4) not null default 0,
  status public.transfer_status not null default 'pending',
  source public.transaction_source not null default 'web',
  reference text,
  idempotency_key text,
  source_transaction_id uuid,
  destination_transaction_id uuid,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint wallet_transfers_id_user_unique unique (id, user_id),
  constraint wallet_transfers_source_wallet_owner_fk
    foreign key (source_wallet_id, user_id)
    references public.wallets (id, user_id)
    on delete restrict,
  constraint wallet_transfers_destination_wallet_owner_fk
    foreign key (destination_wallet_id, user_id)
    references public.wallets (id, user_id)
    on delete restrict,
  constraint wallet_transfers_distinct_wallets check (source_wallet_id <> destination_wallet_id),
  constraint wallet_transfers_source_amount_positive check (source_amount > 0),
  constraint wallet_transfers_destination_amount_positive check (destination_amount > 0),
  constraint wallet_transfers_fee_non_negative check (fee_amount >= 0),
  constraint wallet_transfers_exchange_rate_positive check (exchange_rate is null or exchange_rate > 0),
  constraint wallet_transfers_reference_length check (reference is null or char_length(trim(reference)) <= 200),
  constraint wallet_transfers_idempotency_length check (idempotency_key is null or char_length(trim(idempotency_key)) between 1 and 200)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  wallet_id uuid not null,
  category_id uuid,
  transfer_id uuid,
  type public.transaction_type not null,
  transfer_leg public.transfer_leg,
  amount numeric(20, 4) not null,
  currency public.currency_code not null,
  payee text,
  description text,
  note text,
  occurred_at timestamptz not null,
  posted_at timestamptz,
  cleared_at timestamptz,
  status public.transaction_status not null default 'completed',
  source public.transaction_source not null default 'web',
  reference text,
  external_id text,
  idempotency_key text,
  external_metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint transactions_wallet_owner_fk
    foreign key (wallet_id, user_id)
    references public.wallets (id, user_id)
    on delete restrict,
  constraint transactions_category_owner_fk
    foreign key (category_id, user_id)
    references public.categories (id, user_id)
    on delete restrict,
  constraint transactions_transfer_owner_fk
    foreign key (transfer_id, user_id)
    references public.wallet_transfers (id, user_id)
    on delete restrict,
  constraint transactions_amount_positive check (amount > 0),
  constraint transactions_metadata_object check (jsonb_typeof(external_metadata) = 'object'),
  constraint transactions_reference_length check (reference is null or char_length(trim(reference)) <= 200),
  constraint transactions_external_id_length check (external_id is null or char_length(trim(external_id)) between 1 and 300),
  constraint transactions_idempotency_length check (idempotency_key is null or char_length(trim(idempotency_key)) between 1 and 200),
  constraint transactions_transfer_shape check (
    (type = 'transfer' and transfer_id is not null and transfer_leg is not null and category_id is null)
    or
    (type <> 'transfer' and transfer_id is null and transfer_leg is null)
  )
);

alter table public.wallet_transfers
  add constraint wallet_transfers_source_transaction_unique unique (source_transaction_id),
  add constraint wallet_transfers_destination_transaction_unique unique (destination_transaction_id),
  add constraint wallet_transfers_source_transaction_fk
    foreign key (source_transaction_id) references public.transactions (id) on delete restrict,
  add constraint wallet_transfers_destination_transaction_fk
    foreign key (destination_transaction_id) references public.transactions (id) on delete restrict,
  add constraint wallet_transfers_distinct_transactions check (
    source_transaction_id is null
    or destination_transaction_id is null
    or source_transaction_id <> destination_transaction_id
  );

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null,
  period_type text not null default 'monthly',
  period_start date not null,
  limit_amount numeric(20, 4) not null,
  currency public.currency_code not null,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint budgets_category_owner_fk
    foreign key (category_id, user_id)
    references public.categories (id, user_id)
    on delete restrict,
  constraint budgets_period_type_check check (period_type = 'monthly'),
  constraint budgets_period_start_canonical check (period_start = date_trunc('month', period_start::timestamp)::date),
  constraint budgets_limit_positive check (limit_amount > 0),
  constraint budgets_notes_length check (notes is null or char_length(trim(notes)) <= 500)
);

create unique index budgets_active_user_category_period_unique
  on public.budgets (user_id, category_id, period_type, period_start)
  where archived_at is null;

create unique index transactions_active_external_unique
  on public.transactions (user_id, source, external_id)
  where external_id is not null and deleted_at is null;

create unique index transactions_active_idempotency_unique
  on public.transactions (user_id, source, idempotency_key)
  where idempotency_key is not null and deleted_at is null;

create unique index wallet_transfers_active_idempotency_unique
  on public.wallet_transfers (user_id, source, idempotency_key)
  where idempotency_key is not null and deleted_at is null;

create index category_rules_user_category_idx
  on public.category_rules (user_id, category_id, priority)
  where deleted_at is null;
create index wallet_transfers_user_created_idx
  on public.wallet_transfers (user_id, created_at desc)
  where deleted_at is null;
create index transactions_user_occurred_idx
  on public.transactions (user_id, occurred_at desc)
  where deleted_at is null;
create index transactions_user_wallet_occurred_idx
  on public.transactions (user_id, wallet_id, occurred_at desc)
  where deleted_at is null;
create index transactions_user_category_occurred_idx
  on public.transactions (user_id, category_id, occurred_at desc)
  where deleted_at is null;
create index transactions_user_status_idx
  on public.transactions (user_id, status, occurred_at desc)
  where deleted_at is null;
create index transactions_user_source_idx
  on public.transactions (user_id, source, occurred_at desc)
  where deleted_at is null;
create index budgets_user_category_period_idx
  on public.budgets (user_id, category_id, period_start)
  where archived_at is null;

create or replace function public.validate_transaction_relationships()
returns trigger
language plpgsql
as $$
declare
  wallet_currency public.currency_code;
  wallet_deleted_at timestamptz;
  category_kind public.category_type;
  category_archived_at timestamptz;
  transfer_source_wallet_id uuid;
  transfer_destination_wallet_id uuid;
  transfer_source_amount numeric(20, 4);
  transfer_destination_amount numeric(20, 4);
  transfer_status_value public.transfer_status;
begin
  select w.currency, w.deleted_at
    into wallet_currency, wallet_deleted_at
    from public.wallets w
   where w.id = new.wallet_id and w.user_id = new.user_id;

  if wallet_currency is null then
    raise exception 'Transaction wallet must belong to its user';
  end if;

  if wallet_deleted_at is not null and new.deleted_at is null then
    raise exception 'Transactions cannot use a deleted wallet';
  end if;

  if new.currency <> wallet_currency then
    raise exception 'Transaction currency must match its wallet currency';
  end if;

  if new.category_id is not null then
    select c.type, c.archived_at
      into category_kind, category_archived_at
      from public.categories c
     where c.id = new.category_id and c.user_id = new.user_id;

    if category_kind is null then
      raise exception 'Transaction category must belong to its user';
    end if;

    if new.type <> 'transfer' and category_kind::text <> new.type::text then
      raise exception 'Transaction type must match category type';
    end if;

    if category_archived_at is not null and new.deleted_at is null then
      raise exception 'Active transactions cannot use an archived category';
    end if;
  end if;

  if new.type = 'transfer' then
    select wt.source_wallet_id,
           wt.destination_wallet_id,
           wt.source_amount,
           wt.destination_amount,
           wt.status
      into transfer_source_wallet_id,
           transfer_destination_wallet_id,
           transfer_source_amount,
           transfer_destination_amount,
           transfer_status_value
      from public.wallet_transfers wt
     where wt.id = new.transfer_id and wt.user_id = new.user_id;

    if transfer_source_wallet_id is null then
      raise exception 'Transfer leg must reference a transfer owned by its user';
    end if;

    if new.transfer_leg = 'outbound' then
      if new.wallet_id <> transfer_source_wallet_id or new.amount <> transfer_source_amount then
        raise exception 'Outbound transfer leg does not match its transfer';
      end if;
    elsif new.transfer_leg = 'inbound' then
      if new.wallet_id <> transfer_destination_wallet_id or new.amount <> transfer_destination_amount then
        raise exception 'Inbound transfer leg does not match its transfer';
      end if;
    end if;

    if transfer_status_value = 'completed' and new.deleted_at is not null then
      raise exception 'Completed transfer legs cannot be deleted';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.validate_budget_category()
returns trigger
language plpgsql
as $$
declare
  category_kind public.category_type;
begin
  select c.type into category_kind
    from public.categories c
   where c.id = new.category_id and c.user_id = new.user_id;

  if category_kind is null or category_kind <> 'expense' then
    raise exception 'Budgets require an expense category owned by the user';
  end if;

  return new;
end;
$$;

create or replace function public.validate_transfer_links()
returns trigger
language plpgsql
as $$
declare
  source_currency public.currency_code;
  destination_currency public.currency_code;
  source_transfer_id uuid;
  source_wallet_id uuid;
  source_leg public.transfer_leg;
  source_amount numeric(20, 4);
  source_deleted_at timestamptz;
  destination_transfer_id uuid;
  destination_wallet_id uuid;
  destination_leg public.transfer_leg;
  destination_amount_value numeric(20, 4);
  destination_deleted_at timestamptz;
begin
  select source_wallet.currency, destination_wallet.currency
    into source_currency, destination_currency
    from public.wallets source_wallet
    join public.wallets destination_wallet on destination_wallet.id = new.destination_wallet_id
   where source_wallet.id = new.source_wallet_id
     and source_wallet.user_id = new.user_id
     and destination_wallet.user_id = new.user_id;

  if source_currency = destination_currency and new.source_amount <> new.destination_amount then
    raise exception 'Same-currency transfers must use the same source and destination amount';
  end if;

  if source_currency <> destination_currency and new.exchange_rate is null then
    raise exception 'Cross-currency transfers require an exchange rate';
  end if;

  if new.source_transaction_id is not null then
    select t.transfer_id, t.wallet_id, t.transfer_leg, t.amount, t.deleted_at
      into source_transfer_id, source_wallet_id, source_leg, source_amount, source_deleted_at
      from public.transactions t
     where t.id = new.source_transaction_id and t.user_id = new.user_id;

    if source_transfer_id is null
       or source_transfer_id <> new.id
       or source_leg <> 'outbound'
       or source_wallet_id <> new.source_wallet_id
       or source_amount <> new.source_amount
       or source_deleted_at is not null then
      raise exception 'Source transaction is not a valid outbound leg for this transfer';
    end if;
  end if;

  if new.destination_transaction_id is not null then
    select t.transfer_id, t.wallet_id, t.transfer_leg, t.amount, t.deleted_at
      into destination_transfer_id, destination_wallet_id, destination_leg, destination_amount_value, destination_deleted_at
      from public.transactions t
     where t.id = new.destination_transaction_id and t.user_id = new.user_id;

    if destination_transfer_id is null
       or destination_transfer_id <> new.id
       or destination_leg <> 'inbound'
       or destination_wallet_id <> new.destination_wallet_id
       or destination_amount_value <> new.destination_amount
       or destination_deleted_at is not null then
      raise exception 'Destination transaction is not a valid inbound leg for this transfer';
    end if;
  end if;

  if new.status = 'completed'
     and (new.source_transaction_id is null or new.destination_transaction_id is null) then
    raise exception 'Completed transfers require both ledger legs';
  end if;

  return new;
end;
$$;

create trigger category_rules_set_updated_at
before update on public.category_rules
for each row execute function public.set_updated_at();

create trigger wallet_transfers_set_updated_at
before update on public.wallet_transfers
for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create trigger budgets_set_updated_at
before update on public.budgets
for each row execute function public.set_updated_at();

create trigger transactions_relationships_check
before insert or update on public.transactions
for each row execute function public.validate_transaction_relationships();

create trigger budgets_category_check
before insert or update on public.budgets
for each row execute function public.validate_budget_category();

create constraint trigger wallet_transfers_links_check
after insert or update on public.wallet_transfers
deferrable initially deferred
for each row execute function public.validate_transfer_links();

alter table public.category_rules enable row level security;
alter table public.wallet_transfers enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

create policy category_rules_owner_access on public.category_rules
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy wallet_transfers_owner_access on public.wallet_transfers
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy transactions_owner_access on public.transactions
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy budgets_owner_access on public.budgets
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

commit;
