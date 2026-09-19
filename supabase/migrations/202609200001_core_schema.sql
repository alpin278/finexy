-- Finexy core identity, preferences, wallets, and categories.
-- Supabase Auth owns credentials; public.profiles is the application profile.

begin;

create extension if not exists pgcrypto;

create type public.currency_code as enum ('USD', 'EUR', 'GBP', 'IDR');
create type public.wallet_kind as enum ('bank', 'cash', 'card', 'travel', 'savings');
create type public.wallet_status as enum ('active', 'inactive');
create type public.category_type as enum ('expense', 'income');
create type public.category_status as enum ('active', 'inactive');
create type public.notification_channel as enum ('in_app', 'email', 'telegram');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  location text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_display_name_length check (display_name is null or char_length(trim(display_name)) between 1 and 120)
);

create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  default_currency public.currency_code not null default 'USD',
  region text not null default 'en-US',
  timezone text not null default 'UTC',
  date_format text not null default 'MMM d, yyyy',
  number_format text not null default '1,234.56',
  appearance text not null default 'light',
  default_transaction_type public.category_type not null default 'expense',
  entry_mode text not null default 'quick',
  auto_categorize boolean not null default true,
  merchant_suggestions boolean not null default true,
  confirm_before_delete boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_settings_region_not_empty check (char_length(trim(region)) > 0),
  constraint user_settings_timezone_not_empty check (char_length(trim(timezone)) > 0),
  constraint user_settings_appearance_check check (appearance in ('light', 'dark', 'system')),
  constraint user_settings_entry_mode_check check (entry_mode in ('quick', 'detailed'))
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  currency public.currency_code not null,
  opening_balance numeric(20, 4) not null default 0,
  opening_balance_at timestamptz not null default timezone('utc', now()),
  kind public.wallet_kind not null default 'bank',
  status public.wallet_status not null default 'active',
  monthly_limit numeric(20, 4),
  institution text,
  account_mask text,
  icon_identifier text,
  accent_identifier text,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint wallets_id_user_unique unique (id, user_id),
  constraint wallets_name_not_empty check (char_length(trim(name)) between 1 and 160),
  constraint wallets_monthly_limit_non_negative check (monthly_limit is null or monthly_limit >= 0)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  type public.category_type not null,
  icon_identifier text,
  accent_identifier text,
  keywords text[] not null default '{}',
  status public.category_status not null default 'active',
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint categories_id_user_unique unique (id, user_id),
  constraint categories_name_not_empty check (char_length(trim(name)) between 1 and 120),
  constraint categories_keywords_no_nulls check (array_position(keywords, null) is null)
);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  preference_key text not null,
  channel public.notification_channel not null default 'in_app',
  enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint notification_preferences_key_not_empty check (char_length(trim(preference_key)) > 0),
  constraint notification_preferences_user_key_channel_unique unique (user_id, preference_key, channel)
);

create unique index categories_user_type_name_unique
  on public.categories (user_id, type, lower(name))
  where user_id is not null and archived_at is null;

create unique index categories_system_type_name_unique
  on public.categories (type, lower(name))
  where user_id is null and archived_at is null;

create index wallets_user_status_idx on public.wallets (user_id, status) where deleted_at is null;
create index categories_user_type_idx on public.categories (user_id, type, status) where archived_at is null;
create index notification_preferences_user_idx on public.notification_preferences (user_id, channel);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create trigger wallets_set_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.wallets enable row level security;
alter table public.categories enable row level security;
alter table public.notification_preferences enable row level security;

create policy profiles_owner_access on public.profiles
for all to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy user_settings_owner_access on public.user_settings
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy wallets_owner_access on public.wallets
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy categories_authenticated_read on public.categories
for select to authenticated
using (user_id is null or user_id = (select auth.uid()));

create policy categories_owner_insert on public.categories
for insert to authenticated
with check (user_id = (select auth.uid()));

create policy categories_owner_update on public.categories
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy categories_owner_delete on public.categories
for delete to authenticated
using (user_id = (select auth.uid()));

create policy notification_preferences_owner_access on public.notification_preferences
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

commit;
