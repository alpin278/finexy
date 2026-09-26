begin;

create or replace function public.wake_web_push_notification_worker()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  begin
    if exists (select 1 from new_outbox_rows) then
      -- The existing helper reads the two Vault secrets and queues an
      -- asynchronous pg_net request. Any wake-up failure must not abort the
      -- notification/outbox transaction; cron remains the fallback.
      perform public.invoke_web_push_notification_worker();
    end if;
  exception when others then
    null;
  end;

  return null;
end;
$$;

drop trigger if exists web_push_notification_outbox_immediate_wakeup
  on public.web_push_notification_outbox;

create trigger web_push_notification_outbox_immediate_wakeup
after insert on public.web_push_notification_outbox
referencing new table as new_outbox_rows
for each statement
execute function public.wake_web_push_notification_worker();

revoke all on function public.wake_web_push_notification_worker() from public, anon, authenticated;

commit;
