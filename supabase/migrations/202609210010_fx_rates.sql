-- Phase 32: globally readable, server-written daily reference-rate cache.
begin;
create table public.fx_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency public.currency_code not null,
  quote_currency public.currency_code not null,
  rate numeric(30, 16) not null,
  rate_date date not null,
  provider text not null,
  provider_metadata jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint fx_rates_currencies_differ check (base_currency <> quote_currency),
  constraint fx_rates_positive check (rate > 0),
  constraint fx_rates_provider_not_empty check (char_length(trim(provider)) between 1 and 120),
  constraint fx_rates_snapshot_unique unique (base_currency, quote_currency, rate_date, provider)
);
create index fx_rates_lookup_idx on public.fx_rates (base_currency, quote_currency, rate_date desc);
create trigger fx_rates_set_updated_at before update on public.fx_rates for each row execute function public.set_updated_at();
alter table public.fx_rates enable row level security;
create policy fx_rates_authenticated_read on public.fx_rates for select to authenticated using (true);
-- No INSERT/UPDATE/DELETE policy: browser credentials cannot manipulate rates.
alter publication supabase_realtime add table public.fx_rates;
commit;
