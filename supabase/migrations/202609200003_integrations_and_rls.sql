-- Provider-neutral integration records. Telegram is planned, not implemented here.
-- Only token hashes and bounded workflow/event metadata are stored.

begin;

create table public.user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'telegram',
  external_user_id text not null,
  external_chat_id text,
  status text not null default 'active',
  linked_at timestamptz,
  last_seen_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_integrations_provider_check check (provider = 'telegram'),
  constraint user_integrations_status_check check (status in ('active', 'unlinked', 'revoked')),
  constraint user_integrations_external_user_not_empty check (char_length(trim(external_user_id)) > 0),
  constraint user_integrations_external_chat_not_empty check (external_chat_id is null or char_length(trim(external_chat_id)) > 0),
  constraint user_integrations_id_user_unique unique (id, user_id)
);

create table public.integration_link_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'telegram',
  token_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint integration_link_tokens_provider_check check (provider = 'telegram'),
  constraint integration_link_tokens_hash_not_empty check (char_length(trim(token_hash)) >= 32),
  constraint integration_link_tokens_expiry_after_creation check (expires_at > created_at),
  constraint integration_link_tokens_hash_unique unique (provider, token_hash)
);

create table public.integration_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  integration_id uuid not null,
  flow text not null,
  step text not null,
  payload jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  status text not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint integration_sessions_integration_owner_fk
    foreign key (integration_id, user_id)
    references public.user_integrations (id, user_id)
    on delete cascade,
  constraint integration_sessions_flow_not_empty check (char_length(trim(flow)) > 0),
  constraint integration_sessions_step_not_empty check (char_length(trim(step)) > 0),
  constraint integration_sessions_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint integration_sessions_status_check check (status in ('active', 'completed', 'expired', 'canceled')),
  constraint integration_sessions_expiry_after_creation check (expires_at > created_at)
);

create table public.integration_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  integration_id uuid not null,
  provider text not null default 'telegram',
  external_event_id text not null,
  event_type text,
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint integration_events_integration_owner_fk
    foreign key (integration_id, user_id)
    references public.user_integrations (id, user_id)
    on delete cascade,
  constraint integration_events_provider_check check (provider = 'telegram'),
  constraint integration_events_external_id_not_empty check (char_length(trim(external_event_id)) > 0),
  constraint integration_events_event_type_length check (event_type is null or char_length(trim(event_type)) <= 120),
  constraint integration_events_idempotency_length check (idempotency_key is null or char_length(trim(idempotency_key)) between 1 and 200),
  constraint integration_events_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint integration_events_provider_external_unique unique (provider, external_event_id)
);

create unique index user_integrations_active_user_provider_unique
  on public.user_integrations (user_id, provider)
  where status = 'active' and deleted_at is null;

create unique index user_integrations_active_external_user_unique
  on public.user_integrations (provider, external_user_id)
  where status = 'active' and deleted_at is null;

create unique index user_integrations_active_external_chat_unique
  on public.user_integrations (provider, external_chat_id)
  where external_chat_id is not null and status = 'active' and deleted_at is null;

create unique index integration_link_tokens_active_user_provider_unique
  on public.integration_link_tokens (user_id, provider)
  where consumed_at is null;

create unique index integration_sessions_active_flow_unique
  on public.integration_sessions (integration_id, flow)
  where status = 'active' and deleted_at is null;

create unique index integration_events_provider_idempotency_unique
  on public.integration_events (provider, idempotency_key)
  where idempotency_key is not null;

create index user_integrations_user_provider_idx
  on public.user_integrations (user_id, provider)
  where deleted_at is null;
create index integration_link_tokens_lookup_idx
  on public.integration_link_tokens (provider, token_hash, expires_at)
  where consumed_at is null;
create index integration_sessions_user_expiry_idx
  on public.integration_sessions (user_id, expires_at)
  where status = 'active' and deleted_at is null;
create index integration_events_user_created_idx
  on public.integration_events (user_id, created_at desc);

create trigger user_integrations_set_updated_at
before update on public.user_integrations
for each row execute function public.set_updated_at();

create trigger integration_sessions_set_updated_at
before update on public.integration_sessions
for each row execute function public.set_updated_at();

alter table public.user_integrations enable row level security;
alter table public.integration_link_tokens enable row level security;
alter table public.integration_sessions enable row level security;
alter table public.integration_events enable row level security;

create policy user_integrations_owner_access on public.user_integrations
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy integration_link_tokens_owner_access on public.integration_link_tokens
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy integration_sessions_owner_access on public.integration_sessions
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy integration_events_owner_access on public.integration_events
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

commit;
