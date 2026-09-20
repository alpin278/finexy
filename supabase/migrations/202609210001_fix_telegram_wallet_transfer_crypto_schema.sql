-- Phase 26 follow-up 3: qualify pgcrypto wallet-reference generation.
-- Supabase installs pgcrypto functions in the extensions schema, while the
-- transfer session RPC intentionally uses search_path = public, pg_temp.
begin;

do $migration$
declare
  v_definition text;
begin
  select pg_get_functiondef(
    'public.telegram_wallet_transfer_session(text,text,text,text)'::regprocedure
  )
    into v_definition;

  if v_definition is null then
    raise exception 'telegram_wallet_transfer_session function definition not found';
  end if;

  -- Normalize first so this repair remains safe if the target definition was
  -- already manually qualified before the migration is applied.
  v_definition := replace(v_definition, 'extensions.gen_random_bytes(9)', 'gen_random_bytes(9)');
  v_definition := replace(v_definition, 'gen_random_bytes(9)', 'extensions.gen_random_bytes(9)');
  execute v_definition;
end;
$migration$;

commit;
