-- Opaque, short-lived browser watch tokens for email verification completion.
-- The raw token never reaches this table; only its SHA-256 digest is stored.

begin;

create table public.email_verification_watches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index email_verification_watches_user_idx
  on public.email_verification_watches (user_id, expires_at);

alter table public.email_verification_watches enable row level security;
revoke all on public.email_verification_watches from anon, authenticated;

commit;
