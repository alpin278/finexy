begin;

create or replace function public.consume_telegram_link_code(p_telegram_user_id text, p_telegram_chat_id text, p_code text, p_update_id text)
returns text language plpgsql security definer set search_path = public as $$
declare token public.integration_link_tokens%rowtype; integration public.user_integrations%rowtype;
begin
  if p_telegram_user_id !~ '^[0-9]+$' or p_telegram_chat_id !~ '^-?[0-9]+$' or p_update_id !~ '^[0-9]+$' then return 'invalid'; end if;
  perform pg_advisory_xact_lock(hashtext('telegram-update:' || p_update_id));
  if exists (select 1 from public.integration_events where provider = 'telegram' and external_event_id = p_update_id) then return 'duplicate'; end if;
  select * into integration from public.user_integrations where provider = 'telegram' and external_user_id = p_telegram_user_id and status = 'active' and deleted_at is null;
  if found then
    insert into public.integration_events (user_id, integration_id, provider, external_event_id, event_type, idempotency_key, processed_at) values (integration.user_id, integration.id, 'telegram', p_update_id, 'link_command', p_update_id, now());
    return 'already_linked';
  end if;
  if p_code !~ '^[A-F0-9]{12}$' then return 'invalid'; end if;
  select * into token from public.integration_link_tokens where provider = 'telegram' and token_hash = encode(extensions.digest(p_code, 'sha256'::text), 'hex') and consumed_at is null and expires_at > now() for update;
  if not found then return 'invalid'; end if;
  if exists (select 1 from public.user_integrations where user_id = token.user_id and provider = 'telegram' and status = 'active' and deleted_at is null) then return 'account_already_linked'; end if;
  insert into public.user_integrations (user_id, provider, external_user_id, external_chat_id, status, linked_at) values (token.user_id, 'telegram', p_telegram_user_id, p_telegram_chat_id, 'active', now()) returning * into integration;
  update public.integration_link_tokens set consumed_at = now() where id = token.id and consumed_at is null;
  insert into public.integration_events (user_id, integration_id, provider, external_event_id, event_type, idempotency_key, processed_at) values (integration.user_id, integration.id, 'telegram', p_update_id, 'link_command', p_update_id, now());
  return 'linked';
exception when unique_violation then
  if exists (select 1 from public.integration_events where provider = 'telegram' and external_event_id = p_update_id) then return 'duplicate'; end if;
  return 'already_linked';
end;
$$;

revoke all on function public.consume_telegram_link_code(text, text, text, text) from public, anon, authenticated;
grant execute on function public.consume_telegram_link_code(text, text, text, text) to service_role;

commit;
