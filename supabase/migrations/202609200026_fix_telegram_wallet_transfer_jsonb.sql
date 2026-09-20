-- Phase 26 follow-up: use supported JSONB operators for ref-map emptiness.
-- The session RPC owns Telegram identity, opaque wallet references, and
-- workflow state. The confirm path delegates the actual ledger mutation to
-- the existing atomic wallet-transfer RPC.
begin;

create or replace function public.telegram_wallet_transfer_session(
  p_telegram_user_id text,
  p_telegram_chat_id text,
  p_action text,
  p_value text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_integration public.user_integrations%rowtype;
  v_session public.integration_sessions%rowtype;
  v_source public.wallets%rowtype;
  v_destination public.wallets%rowtype;
  v_transfer record;
  v_source_id uuid;
  v_destination_id uuid;
  v_amount numeric;
  v_note text;
  v_ref text := nullif(trim(coalesce(p_value, '')), '');
  v_refs jsonb;
  v_error_message text;
begin
  if p_telegram_user_id !~ '^[0-9]+$'
     or p_telegram_chat_id !~ '^-?[0-9]+$'
     or p_action not in ('start', 'source', 'destination', 'amount', 'note', 'skip_note', 'confirm', 'cancel', 'back', 'state') then
    return jsonb_build_object('status', 'unlinked');
  end if;

  select integration_source.*
    into v_integration
    from public.user_integrations as integration_source
   where integration_source.provider = 'telegram'
     and integration_source.external_user_id = p_telegram_user_id
     and integration_source.external_chat_id = p_telegram_chat_id
     and integration_source.status = 'active'
     and integration_source.deleted_at is null;

  if not found then
    return jsonb_build_object('status', 'unlinked');
  end if;

  if p_action = 'start' then
    update public.integration_sessions as canceled_session
       set status = 'canceled', deleted_at = now()
     where canceled_session.integration_id = v_integration.id
       and canceled_session.flow = 'telegram_wallet_transfer'
       and canceled_session.status = 'active'
       and canceled_session.deleted_at is null;

    insert into public.integration_sessions (
      user_id, integration_id, flow, step, payload, expires_at
    ) values (
      v_integration.user_id,
      v_integration.id,
      'telegram_wallet_transfer',
      'source',
      '{}'::jsonb,
      now() + interval '30 minutes'
    ) returning * into v_session;
  else
    select active_session.*
      into v_session
      from public.integration_sessions as active_session
     where active_session.integration_id = v_integration.id
       and active_session.flow = 'telegram_wallet_transfer'
       and active_session.status = 'active'
       and active_session.deleted_at is null
       and active_session.expires_at > now()
     for update;

    if not found then
      return jsonb_build_object('status', 'linked', 'step', 'none');
    end if;

    if p_action = 'cancel' then
      update public.integration_sessions as canceled_session
         set status = 'canceled', deleted_at = now()
       where canceled_session.id = v_session.id;
      return jsonb_build_object('status', 'linked', 'step', 'canceled');
    end if;

    if p_action = 'source' then
      if v_session.step <> 'source'
         or v_ref is null
         or v_ref !~ '^[a-f0-9]{18}$' then
        return jsonb_build_object('status', 'linked', 'step', v_session.step, 'error', 'Pilihan wallet sumber tidak valid.');
      end if;

      select wallet_source.*
        into v_source
        from public.wallets as wallet_source
       where wallet_source.id = nullif(v_session.payload->'wallet_refs'->>v_ref, '')::uuid
         and wallet_source.user_id = v_integration.user_id
         and wallet_source.status = 'active'
         and wallet_source.deleted_at is null;

      if not found then
        return jsonb_build_object('status', 'linked', 'step', 'source', 'error', 'Wallet sumber tidak tersedia.');
      end if;

      select coalesce(jsonb_object_agg(destination_ref.ref, destination_ref.wallet_id), '{}'::jsonb)
        into v_refs
        from (
          select lower(encode(gen_random_bytes(9), 'hex')) as ref,
                 wallet_source.id::text as wallet_id
            from public.wallets as wallet_source
           where wallet_source.user_id = v_integration.user_id
             and wallet_source.id <> v_source.id
             and wallet_source.status = 'active'
             and wallet_source.deleted_at is null
        ) as destination_ref;

      update public.integration_sessions as source_session
         set step = 'destination',
             payload = (v_session.payload - 'wallet_refs') || jsonb_build_object(
               'source_wallet_id', v_source.id::text,
               'source_wallet_name', v_source.name,
               'currency', v_source.currency::text,
               'wallet_refs', v_refs
             ),
             expires_at = now() + interval '30 minutes'
       where source_session.id = v_session.id
       returning * into v_session;
    elsif p_action = 'destination' then
      if v_session.step <> 'destination'
         or v_ref is null
         or v_ref !~ '^[a-f0-9]{18}$' then
        return jsonb_build_object('status', 'linked', 'step', v_session.step, 'error', 'Pilihan wallet tujuan tidak valid.');
      end if;

      v_source_id := nullif(v_session.payload->>'source_wallet_id', '')::uuid;
      select wallet_destination.*
        into v_destination
        from public.wallets as wallet_destination
       where wallet_destination.id = nullif(v_session.payload->'wallet_refs'->>v_ref, '')::uuid
         and wallet_destination.user_id = v_integration.user_id
         and wallet_destination.status = 'active'
         and wallet_destination.deleted_at is null;

      if not found then
        return jsonb_build_object('status', 'linked', 'step', 'destination', 'error', 'Wallet tujuan tidak tersedia.');
      end if;

      if v_destination.id = v_source_id then
        return jsonb_build_object('status', 'linked', 'step', 'destination', 'error', 'Wallet sumber dan tujuan harus berbeda.');
      end if;

      if v_destination.currency::text <> v_session.payload->>'currency' then
        return jsonb_build_object('status', 'linked', 'step', 'destination', 'error', 'Transfer antar mata uang tidak didukung. Pilih wallet dengan mata uang yang sama.');
      end if;

      update public.integration_sessions as destination_session
         set step = 'amount',
             payload = (v_session.payload - 'wallet_refs') || jsonb_build_object(
               'destination_wallet_id', v_destination.id::text,
               'destination_wallet_name', v_destination.name
             ),
             expires_at = now() + interval '30 minutes'
       where destination_session.id = v_session.id
       returning * into v_session;
    elsif p_action = 'amount' then
      if v_session.step <> 'amount'
         or coalesce(p_value, '') !~ '^[0-9]+(\.[0-9]{1,4})?$' then
        return jsonb_build_object('status', 'linked', 'step', 'amount', 'error', 'Masukkan nominal positif dengan maksimal 4 angka desimal.');
      end if;

      v_amount := p_value::numeric;
      if v_amount <= 0 then
        return jsonb_build_object('status', 'linked', 'step', 'amount', 'error', 'Nominal harus lebih dari nol.');
      end if;

      update public.integration_sessions as amount_session
         set step = 'note',
             payload = v_session.payload || jsonb_build_object('amount', v_amount),
             expires_at = now() + interval '30 minutes'
       where amount_session.id = v_session.id
       returning * into v_session;
    elsif p_action in ('note', 'skip_note') then
      if v_session.step <> 'note' then
        return jsonb_build_object('status', 'linked', 'step', v_session.step, 'error', 'Langkah catatan tidak aktif.');
      end if;

      v_note := case when p_action = 'skip_note' then null else nullif(trim(coalesce(p_value, '')), '') end;
      if v_note is not null and char_length(v_note) > 200 then
        return jsonb_build_object('status', 'linked', 'step', 'note', 'error', 'Catatan maksimal 200 karakter.');
      end if;

      update public.integration_sessions as note_session
         set step = 'confirm',
             payload = v_session.payload || jsonb_build_object('note', v_note),
             expires_at = now() + interval '30 minutes'
       where note_session.id = v_session.id
       returning * into v_session;
    elsif p_action = 'confirm' then
      if v_session.step <> 'confirm' then
        return jsonb_build_object('status', 'linked', 'step', v_session.step, 'error', 'Konfirmasi transfer tidak aktif atau sudah diproses.');
      end if;

      v_source_id := nullif(v_session.payload->>'source_wallet_id', '')::uuid;
      v_destination_id := nullif(v_session.payload->>'destination_wallet_id', '')::uuid;
      v_amount := nullif(v_session.payload->>'amount', '')::numeric;

      -- Revalidate all mutable wallet conditions immediately before the atomic
      -- domain call. The domain RPC repeats these checks while locking both
      -- wallets, so this boundary never trusts stale review data.
      select wallet_source.*
        into v_source
        from public.wallets as wallet_source
       where wallet_source.id = v_source_id
         and wallet_source.user_id = v_integration.user_id
         and wallet_source.status = 'active'
         and wallet_source.deleted_at is null;
      select wallet_destination.*
        into v_destination
        from public.wallets as wallet_destination
       where wallet_destination.id = v_destination_id
         and wallet_destination.user_id = v_integration.user_id
         and wallet_destination.status = 'active'
         and wallet_destination.deleted_at is null;

      if v_source.id is null or v_destination.id is null then
        return jsonb_build_object('status', 'linked', 'step', 'confirm', 'error', 'Wallet sumber atau tujuan tidak lagi tersedia.');
      end if;
      if v_source.id = v_destination.id then
        return jsonb_build_object('status', 'linked', 'step', 'confirm', 'error', 'Wallet sumber dan tujuan harus berbeda.');
      end if;
      if v_source.currency <> v_destination.currency then
        return jsonb_build_object('status', 'linked', 'step', 'confirm', 'error', 'Transfer antar mata uang tidak didukung.');
      end if;
      if v_amount is null or v_amount <= 0 or v_amount <> round(v_amount, 4) then
        return jsonb_build_object('status', 'linked', 'step', 'confirm', 'error', 'Nominal transfer tidak valid.');
      end if;

      begin
        -- The existing RPC derives auth.uid(), so inject only the linked
        -- Finexy user for this transaction and delegate all ledger mutation.
        perform set_config('request.jwt.claim.sub', v_integration.user_id::text, true);
        select transfer_result.*
          into v_transfer
          from public.perform_wallet_transfer(
            v_source.id,
            v_destination.id,
            v_amount,
            nullif(v_session.payload->>'note', ''),
            'telegram:wallet_transfer:' || v_session.id::text
          ) as transfer_result;
        perform set_config('request.jwt.claim.sub', '', true);
      exception when others then
        perform set_config('request.jwt.claim.sub', '', true);
        get stacked diagnostics v_error_message = message_text;
        if position('exceeds the settled source balance' in lower(v_error_message)) > 0 then
          return jsonb_build_object('status', 'linked', 'step', 'confirm', 'error', 'Saldo wallet sumber tidak mencukupi untuk transfer ini.');
        elsif position('cross-currency' in lower(v_error_message)) > 0 then
          return jsonb_build_object('status', 'linked', 'step', 'confirm', 'error', 'Transfer antar mata uang tidak didukung.');
        elsif position('different' in lower(v_error_message)) > 0 then
          return jsonb_build_object('status', 'linked', 'step', 'confirm', 'error', 'Wallet sumber dan tujuan harus berbeda.');
        elsif position('belong to your account' in lower(v_error_message)) > 0
           or position('active wallets' in lower(v_error_message)) > 0
           or position('archived wallets' in lower(v_error_message)) > 0 then
          return jsonb_build_object('status', 'linked', 'step', 'confirm', 'error', 'Wallet sumber atau tujuan tidak lagi tersedia.');
        end if;
        return jsonb_build_object('status', 'linked', 'step', 'confirm', 'error', 'Transfer belum dapat diproses. Periksa kembali data lalu coba lagi.');
      end;

      update public.integration_sessions as completed_session
         set status = 'completed',
             payload = v_session.payload || jsonb_build_object('transfer_id', v_transfer.transfer_id::text)
       where completed_session.id = v_session.id;

      return jsonb_build_object(
        'status', 'linked',
        'step', 'completed',
        'source_wallet', v_source.name,
        'destination_wallet', v_destination.name,
        'amount', v_transfer.source_amount,
        'currency', v_source.currency::text
      );
    elsif p_action = 'back' then
      if v_session.step = 'destination' then
        update public.integration_sessions as destination_back
           set step = 'source',
               payload = v_session.payload - 'source_wallet_id' - 'source_wallet_name' - 'currency' - 'wallet_refs'
         where destination_back.id = v_session.id
         returning * into v_session;
      elsif v_session.step = 'amount' then
        update public.integration_sessions as amount_back
           set step = 'destination',
               payload = v_session.payload - 'destination_wallet_id' - 'destination_wallet_name' - 'amount' - 'note'
         where amount_back.id = v_session.id
         returning * into v_session;
      elsif v_session.step = 'note' then
        update public.integration_sessions as note_back
           set step = 'amount',
               payload = v_session.payload - 'amount' - 'note'
         where note_back.id = v_session.id
         returning * into v_session;
      elsif v_session.step = 'confirm' then
        update public.integration_sessions as confirm_back
           set step = 'note',
               payload = v_session.payload - 'note'
         where confirm_back.id = v_session.id
         returning * into v_session;
      end if;
    end if;
  end if;

  select session_lookup.*
    into v_session
    from public.integration_sessions as session_lookup
   where session_lookup.id = v_session.id;

  if v_session.step = 'source'
     and (not (v_session.payload ? 'wallet_refs') or v_session.payload->'wallet_refs' = '{}'::jsonb) then
    select coalesce(jsonb_object_agg(source_ref.ref, source_ref.wallet_id), '{}'::jsonb)
      into v_refs
      from (
        select lower(encode(gen_random_bytes(9), 'hex')) as ref,
               wallet_source.id::text as wallet_id
          from public.wallets as wallet_source
         where wallet_source.user_id = v_integration.user_id
           and wallet_source.status = 'active'
           and wallet_source.deleted_at is null
      ) as source_ref;
    update public.integration_sessions as source_list_session
       set payload = v_session.payload || jsonb_build_object('wallet_refs', v_refs)
     where source_list_session.id = v_session.id
     returning * into v_session;
  elsif v_session.step = 'destination'
        and coalesce(jsonb_object_length(v_session.payload->'wallet_refs'), 0) = 0 then
    v_source_id := nullif(v_session.payload->>'source_wallet_id', '')::uuid;
    select coalesce(jsonb_object_agg(destination_ref.ref, destination_ref.wallet_id), '{}'::jsonb)
      into v_refs
      from (
        select lower(encode(gen_random_bytes(9), 'hex')) as ref,
               wallet_source.id::text as wallet_id
          from public.wallets as wallet_source
         where wallet_source.user_id = v_integration.user_id
           and wallet_source.id <> v_source_id
           and wallet_source.status = 'active'
           and wallet_source.deleted_at is null
      ) as destination_ref;
    update public.integration_sessions as destination_list_session
       set payload = v_session.payload || jsonb_build_object('wallet_refs', v_refs)
     where destination_list_session.id = v_session.id
     returning * into v_session;
  end if;

  return jsonb_build_object(
    'status', 'linked',
    'step', v_session.step,
    'source_wallet', v_session.payload->>'source_wallet_name',
    'destination_wallet', v_session.payload->>'destination_wallet_name',
    'currency', v_session.payload->>'currency',
    'amount', v_session.payload->>'amount',
    'note', v_session.payload->>'note',
    'wallets', case when v_session.step in ('source', 'destination') then coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'ref', wallet_ref.ref,
          'name', wallet_source.name,
          'currency', wallet_source.currency::text
        ) order by wallet_source.name
      )
        from jsonb_each_text(coalesce(v_session.payload->'wallet_refs', '{}'::jsonb)) as wallet_ref(ref, wallet_id)
        join public.wallets as wallet_source on wallet_source.id = wallet_ref.wallet_id::uuid
       where wallet_source.user_id = v_integration.user_id
         and wallet_source.status = 'active'
         and wallet_source.deleted_at is null
    ), '[]'::jsonb) else '[]'::jsonb end
  );
end;
$$;

revoke all on function public.telegram_wallet_transfer_session(text, text, text, text) from public, anon, authenticated;
grant execute on function public.telegram_wallet_transfer_session(text, text, text, text) to service_role;

commit;
