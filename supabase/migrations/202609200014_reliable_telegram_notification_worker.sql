begin;

alter table public.telegram_budget_notification_events
  add column next_retry_at timestamptz,
  add column failed_at timestamptz,
  add column last_error_class text;
alter table public.telegram_budget_notification_events drop constraint telegram_budget_notification_events_status_check;
alter table public.telegram_budget_notification_events add constraint telegram_budget_notification_events_status_check check (status in ('pending', 'sending', 'delivered', 'failed'));
update public.telegram_budget_notification_events set next_retry_at = coalesce(next_retry_at, created_at) where status = 'pending';
alter table public.telegram_budget_notification_events alter column next_retry_at set not null;
create index telegram_budget_notification_events_ready_idx on public.telegram_budget_notification_events (next_retry_at, created_at) where status = 'pending';

create or replace function public.claim_telegram_budget_notification_worker()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_event public.telegram_budget_notification_events%rowtype; v_chat_id text;
begin
  update public.telegram_budget_notification_events e
     set status = 'failed', failed_at = now(), last_error_class = 'destination_unavailable'
   where e.status in ('pending', 'sending') and (
     not exists (select 1 from public.user_integrations i where i.id = e.integration_id and i.provider = 'telegram' and i.status = 'active' and i.deleted_at is null)
     or not exists (select 1 from public.notification_preferences p where p.user_id = e.user_id and p.channel = 'telegram' and p.preference_key = e.threshold and p.enabled)
   );

  select e.* into v_event`r`n    from public.telegram_budget_notification_events e
    join public.user_integrations i on i.id = e.integration_id and i.provider = 'telegram' and i.status = 'active' and i.deleted_at is null
    join public.notification_preferences p on p.user_id = e.user_id and p.channel = 'telegram' and p.preference_key = e.threshold and p.enabled
   where (e.status = 'pending' and e.next_retry_at <= now())
      or (e.status = 'sending' and e.last_attempt_at < now() - interval '10 minutes')
   order by e.created_at for update of e skip locked limit 1;
  if not found then return null; end if;
  select external_chat_id into v_chat_id from public.user_integrations where id = v_event.integration_id and provider = 'telegram' and status = 'active' and deleted_at is null;
  if v_chat_id is null then return null; end if;
  update public.telegram_budget_notification_events set status = 'sending', attempts = attempts + 1, last_attempt_at = now(), last_error_class = null where id = v_event.id;
  return v_event.payload || jsonb_build_object('notification_id', v_event.id::text, 'threshold', v_event.threshold, 'chat_id', v_chat_id, 'attempt', v_event.attempts + 1);
end;
$$;

create or replace function public.complete_telegram_budget_notification_worker(p_notification_id uuid, p_delivered boolean, p_retryable boolean default true, p_error_class text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.telegram_budget_notification_events
     set status = case when p_delivered then 'delivered' when not p_retryable or attempts >= 5 then 'failed' else 'pending' end,
         delivered_at = case when p_delivered then now() else null end,
         failed_at = case when not p_delivered and (not p_retryable or attempts >= 5) then now() else null end,
         next_retry_at = case when not p_delivered and p_retryable and attempts < 5 then now() + case attempts when 1 then interval '1 minute' when 2 then interval '5 minutes' when 3 then interval '15 minutes' when 4 then interval '1 hour' else interval '6 hours' end else next_retry_at end,
         last_error_class = case when p_delivered then null else left(coalesce(p_error_class, 'delivery_failed'), 80) end
   where id = p_notification_id and status = 'sending';
end;
$$;

create or replace function public.invoke_telegram_notification_worker()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_url text; v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'telegram_notification_worker_url' limit 1;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'telegram_notification_worker_secret' limit 1;
  if v_url is null or v_secret is null then return; end if;
  perform net.http_post(url := v_url, headers := jsonb_build_object('content-type', 'application/json', 'x-worker-secret', v_secret), body := '{}'::jsonb, timeout_milliseconds := 10000);
end;
$$;

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
do $$ begin
  if not exists (select 1 from cron.job where jobname = 'telegram-notification-worker') then
    perform cron.schedule('telegram-notification-worker', '* * * * *', 'select public.invoke_telegram_notification_worker()');
  end if;
end $$;

revoke all on function public.claim_telegram_budget_notification_worker() from public, anon, authenticated;
revoke all on function public.complete_telegram_budget_notification_worker(uuid, boolean, boolean, text) from public, anon, authenticated;
revoke all on function public.invoke_telegram_notification_worker() from public, anon, authenticated;
grant execute on function public.claim_telegram_budget_notification_worker() to service_role;
grant execute on function public.complete_telegram_budget_notification_worker(uuid, boolean, boolean, text) to service_role;

commit;