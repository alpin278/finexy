begin;

create or replace function public.create_telegram_link_code()
returns table(code text, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare raw_code text; expiry timestamptz := now() + interval '10 minutes'; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'authentication required'; end if;
  if exists (select 1 from public.user_integrations where user_id = uid and provider = 'telegram' and status = 'active' and deleted_at is null) then raise exception 'Telegram is already linked'; end if;
  update public.integration_link_tokens set consumed_at = now() where user_id = uid and provider = 'telegram' and consumed_at is null;
  raw_code := upper(encode(extensions.gen_random_bytes(6), 'hex'));
  insert into public.integration_link_tokens (user_id, provider, token_hash, expires_at) values (uid, 'telegram', encode(extensions.digest(raw_code, 'sha256'), 'hex'), expiry);
  return query select raw_code, expiry;
end;
$$;

revoke all on function public.create_telegram_link_code() from public;
grant execute on function public.create_telegram_link_code() to authenticated;

commit;
