begin;

create table public.web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh_key text not null,
  auth_key text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_success_at timestamptz,
  last_failure_at timestamptz,
  failure_count integer not null default 0 check (failure_count >= 0),
  last_error_class text,
  deactivated_at timestamptz,
  constraint web_push_subscriptions_endpoint_length check (char_length(endpoint) between 1 and 2048),
  constraint web_push_subscriptions_p256dh_length check (char_length(p256dh_key) between 1 and 256),
  constraint web_push_subscriptions_auth_length check (char_length(auth_key) between 1 and 256)
);

create index web_push_subscriptions_user_active_idx
  on public.web_push_subscriptions (user_id, is_active, updated_at desc);

create trigger web_push_subscriptions_set_updated_at
before update on public.web_push_subscriptions
for each row execute function public.set_updated_at();

alter table public.web_push_subscriptions enable row level security;

create policy web_push_subscriptions_owner_select on public.web_push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.web_push_subscriptions from public, anon, authenticated;
grant select (
  id,
  endpoint,
  is_active,
  created_at,
  updated_at,
  last_success_at,
  last_failure_at,
  failure_count,
  last_error_class,
  deactivated_at
) on public.web_push_subscriptions to authenticated;

create table public.web_push_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  subscription_id uuid not null references public.web_push_subscriptions(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sending', 'delivered', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  next_retry_at timestamptz not null default timezone('utc', now()),
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  last_error_class text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint web_push_outbox_notification_subscription_unique unique (notification_id, subscription_id)
);

create index web_push_outbox_ready_idx
  on public.web_push_notification_outbox (next_retry_at, created_at)
  where status = 'pending';

create index web_push_outbox_stale_sending_idx
  on public.web_push_notification_outbox (last_attempt_at, created_at)
  where status = 'sending';

create index web_push_outbox_subscription_status_idx
  on public.web_push_notification_outbox (subscription_id, status, created_at);

create trigger web_push_notification_outbox_set_updated_at
before update on public.web_push_notification_outbox
for each row execute function public.set_updated_at();

alter table public.web_push_notification_outbox enable row level security;
revoke all on public.web_push_notification_outbox from public, anon, authenticated;

create or replace function public.register_web_push_subscription(
  p_endpoint text,
  p_p256dh_key text,
  p_auth_key text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_subscription_id uuid;
  v_subscription_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_endpoint is null or char_length(trim(p_endpoint)) not between 1 and 2048 then
    raise exception 'Invalid push endpoint';
  end if;
  if trim(p_endpoint) !~* '^https://([a-z0-9-]+\.)*(fcm\.googleapis\.com|push\.services\.mozilla\.com|push\.apple\.com|notify\.windows\.com)(/|$)' then
    raise exception 'Invalid push endpoint';
  end if;
  if p_p256dh_key is null or char_length(trim(p_p256dh_key)) not between 1 and 256 then
    raise exception 'Invalid push public key';
  end if;
  if p_auth_key is null or char_length(trim(p_auth_key)) not between 1 and 256 then
    raise exception 'Invalid push auth key';
  end if;

  select id into v_existing_subscription_id
    from public.web_push_subscriptions
   where endpoint = trim(p_endpoint)
   for update;

  if v_existing_subscription_id is not null then
    update public.web_push_notification_outbox
       set status = 'failed',
           failed_at = timezone('utc', now()),
           last_error_class = 'subscription_reassigned'
     where subscription_id = v_existing_subscription_id
       and status in ('pending', 'sending');
  end if;

  insert into public.web_push_subscriptions (
    user_id,
    endpoint,
    p256dh_key,
    auth_key,
    is_active,
    deactivated_at,
    failure_count,
    last_error_class
  ) values (
    v_user_id,
    trim(p_endpoint),
    trim(p_p256dh_key),
    trim(p_auth_key),
    true,
    null,
    0,
    null
  )
  on conflict (endpoint) do update set
    user_id = excluded.user_id,
    p256dh_key = excluded.p256dh_key,
    auth_key = excluded.auth_key,
    is_active = true,
    deactivated_at = null,
    failure_count = 0,
    last_error_class = null,
    last_failure_at = null
  returning id into v_subscription_id;

  return v_subscription_id;
end;
$$;

create or replace function public.deactivate_web_push_subscription(p_endpoint text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.web_push_subscriptions
     set is_active = false,
         deactivated_at = coalesce(deactivated_at, timezone('utc', now())),
         last_error_class = null
   where endpoint = trim(p_endpoint)
     and user_id = auth.uid();
end;
$$;

create or replace function public.queue_web_push_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.web_push_notification_outbox (notification_id, subscription_id)
  select new.id, s.id
    from public.web_push_subscriptions s
   where s.user_id = new.user_id
     and s.is_active
  on conflict (notification_id, subscription_id) do nothing;

  return new;
end;
$$;

create trigger queue_web_push_notification_after_insert
after insert on public.notifications
for each row execute function public.queue_web_push_notification();

revoke all on function public.queue_web_push_notification() from public, anon, authenticated;

create or replace function public.claim_web_push_notification()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_outbox public.web_push_notification_outbox%rowtype;
  v_subscription public.web_push_subscriptions%rowtype;
begin
  update public.web_push_notification_outbox o
     set status = 'failed',
         failed_at = timezone('utc', now()),
         last_error_class = 'subscription_inactive'
   where o.status in ('pending', 'sending')
     and not exists (
       select 1
         from public.web_push_subscriptions s
         join public.notifications n on n.id = o.notification_id
        where s.id = o.subscription_id
          and s.user_id = n.user_id
          and s.is_active
     );

  select o.* into v_outbox
    from public.web_push_notification_outbox o
    join public.web_push_subscriptions s on s.id = o.subscription_id and s.is_active
    join public.notifications n on n.id = o.notification_id and n.user_id = s.user_id
   where o.attempts < 5
     and (
       (o.status = 'pending' and o.next_retry_at <= timezone('utc', now()))
       or (o.status = 'sending' and o.last_attempt_at < timezone('utc', now()) - interval '10 minutes')
     )
   order by o.created_at
   for update of o skip locked
   limit 1;

  if not found then
    return null;
  end if;

  select * into v_subscription
    from public.web_push_subscriptions
   where id = v_outbox.subscription_id
     and is_active;
  if not found then
    update public.web_push_notification_outbox
       set status = 'failed', failed_at = timezone('utc', now()), last_error_class = 'subscription_inactive'
     where id = v_outbox.id;
    return null;
  end if;

  update public.web_push_notification_outbox
     set status = 'sending',
         attempts = attempts + 1,
         last_attempt_at = timezone('utc', now()),
         last_error_class = null
   where id = v_outbox.id;

  return jsonb_build_object(
    'outbox_id', v_outbox.id,
    'notification_id', v_outbox.notification_id,
    'subscription_id', v_subscription.id,
    'endpoint', v_subscription.endpoint,
    'p256dh_key', v_subscription.p256dh_key,
    'auth_key', v_subscription.auth_key,
    'attempt', v_outbox.attempts + 1
  );
end;
$$;

create or replace function public.complete_web_push_notification(
  p_outbox_id uuid,
  p_delivered boolean,
  p_retryable boolean default true,
  p_error_class text default null,
  p_deactivate_subscription boolean default false
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_subscription_id uuid;
begin
  select subscription_id into v_subscription_id
    from public.web_push_notification_outbox
   where id = p_outbox_id
     and status = 'sending';

  if not found then
    return;
  end if;

  update public.web_push_notification_outbox
     set status = case
       when p_delivered then 'delivered'
       when not p_retryable or attempts >= 5 then 'failed'
       else 'pending'
     end,
         delivered_at = case when p_delivered then timezone('utc', now()) else null end,
         failed_at = case when not p_delivered and (not p_retryable or attempts >= 5) then timezone('utc', now()) else null end,
         next_retry_at = case
           when not p_delivered and p_retryable and attempts < 5 then timezone('utc', now()) + case attempts
             when 1 then interval '1 minute'
             when 2 then interval '5 minutes'
             when 3 then interval '15 minutes'
             when 4 then interval '1 hour'
             else interval '6 hours'
           end
           else next_retry_at
         end,
         last_error_class = case when p_delivered then null else left(coalesce(p_error_class, 'delivery_failed'), 80) end
   where id = p_outbox_id
     and status = 'sending';

  if p_delivered then
    update public.web_push_subscriptions
       set last_success_at = timezone('utc', now()),
           failure_count = 0,
           last_error_class = null
     where id = v_subscription_id;
  else
    update public.web_push_subscriptions
       set last_failure_at = timezone('utc', now()),
           failure_count = failure_count + 1,
           last_error_class = left(coalesce(p_error_class, 'delivery_failed'), 80),
           is_active = case when p_deactivate_subscription then false else is_active end,
           deactivated_at = case when p_deactivate_subscription then coalesce(deactivated_at, timezone('utc', now())) else deactivated_at end
     where id = v_subscription_id;
  end if;
end;
$$;

create or replace function public.invoke_web_push_notification_worker()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url
    from vault.decrypted_secrets
   where name = 'web_push_notification_worker_url'
   limit 1;
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
   where name = 'web_push_notification_worker_secret'
   limit 1;

  if nullif(btrim(v_url), '') is null or nullif(btrim(v_secret), '') is null then
    return;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object('content-type', 'application/json', 'x-worker-secret', v_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
end;
$$;

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
revoke all on schema net from public, anon, authenticated;
revoke all on all tables in schema net from public, anon, authenticated;
revoke all on all sequences in schema net from public, anon, authenticated;
revoke all on all functions in schema net from public, anon, authenticated;

do $$
declare
  v_job_id bigint;
begin
  for v_job_id in select jobid from cron.job where jobname = 'web-push-notification-worker' loop
    perform cron.unschedule(v_job_id);
  end loop;
  perform cron.schedule('web-push-notification-worker', '* * * * *', 'select public.invoke_web_push_notification_worker()');
end;
$$;

revoke all on function public.register_web_push_subscription(text, text, text) from public, anon;
grant execute on function public.register_web_push_subscription(text, text, text) to authenticated;

revoke all on function public.deactivate_web_push_subscription(text) from public, anon;
grant execute on function public.deactivate_web_push_subscription(text) to authenticated;

revoke all on function public.claim_web_push_notification() from public, anon, authenticated;
grant execute on function public.claim_web_push_notification() to service_role;

revoke all on function public.complete_web_push_notification(uuid, boolean, boolean, text, boolean) from public, anon, authenticated;
grant execute on function public.complete_web_push_notification(uuid, boolean, boolean, text, boolean) to service_role;

revoke all on function public.invoke_web_push_notification_worker() from public, anon, authenticated;

commit;
