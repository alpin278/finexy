begin;

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

  select e.* into v_event
    from public.telegram_budget_notification_events e
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

revoke all on function public.claim_telegram_budget_notification_worker() from public, anon, authenticated;
grant execute on function public.claim_telegram_budget_notification_worker() to service_role;

commit;