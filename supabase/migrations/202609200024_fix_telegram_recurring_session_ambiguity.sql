begin;

-- Fix the PL/pgSQL record/table-alias collision from the previous definition.
-- Keep record variables and SQL aliases distinct so references are unambiguous.
create or replace function public.telegram_recurring_session(
  p_telegram_user_id text,
  p_telegram_chat_id text,
  p_action text,
  p_value text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_integration public.user_integrations%rowtype;
  v_session public.integration_sessions%rowtype;
  v_rule public.recurring_transaction_rules%rowtype;
  v_wallet public.wallets%rowtype;
  v_category public.categories%rowtype;
  v_refs jsonb;
  v_n text := coalesce(p_value, '');
  v_date date;
  v_day int;
  v_note text;
  v_rule_id uuid;
begin
  if p_telegram_user_id !~ '^[0-9]+$' or p_telegram_chat_id !~ '^-?[0-9]+$' then
    return jsonb_build_object('status', 'unlinked');
  end if;

  select linked_integration.*
    into v_integration
  from public.user_integrations as linked_integration
  where linked_integration.provider = 'telegram'
    and linked_integration.external_user_id = p_telegram_user_id
    and linked_integration.external_chat_id = p_telegram_chat_id
    and linked_integration.status = 'active'
    and linked_integration.deleted_at is null;
  if not found then
    return jsonb_build_object('status', 'unlinked');
  end if;

  if p_action = 'list' then
    select coalesce(jsonb_object_agg(rule_ref.row_num, rule_ref.rule_id), '{}'::jsonb)
      into v_refs
    from (
      select row_number() over (order by recurring_rule.next_due_at)::text as row_num,
             recurring_rule.id as rule_id
      from public.recurring_transaction_rules as recurring_rule
      where recurring_rule.user_id = v_integration.user_id
        and recurring_rule.archived_at is null
    ) as rule_ref;

    update public.integration_sessions as active_session
    set status = 'canceled',
        deleted_at = now()
    where active_session.integration_id = v_integration.id
      and active_session.flow = 'telegram_recurring'
      and active_session.status = 'active'
      and active_session.deleted_at is null;

    insert into public.integration_sessions(user_id, integration_id, flow, step, payload, expires_at)
    values (
      v_integration.user_id,
      v_integration.id,
      'telegram_recurring',
      'list',
      jsonb_build_object('rules', v_refs),
      now() + interval '30 minutes'
    )
    returning * into v_session;

    return jsonb_build_object(
      'status', 'linked',
      'step', 'list',
      'rules', coalesce((
        select jsonb_agg(jsonb_build_object(
          'ref', recurring_view.row_num,
          'type', recurring_view.type::text,
          'amount', recurring_view.amount,
          'currency', recurring_view.currency,
          'wallet', recurring_view.wallet,
          'category', recurring_view.category,
          'frequency', recurring_view.frequency::text,
          'next_due', recurring_view.next_due_at,
          'active', recurring_view.active
        ))
        from (
          select row_number() over (order by recurring_rule.next_due_at)::text as row_num,
                 recurring_rule.type,
                 recurring_rule.amount,
                 wallet_lookup.currency,
                 wallet_lookup.name as wallet,
                 category_lookup.name as category,
                 recurring_rule.frequency,
                 recurring_rule.next_due_at,
                 recurring_rule.active
          from public.recurring_transaction_rules as recurring_rule
          join public.wallets as wallet_lookup
            on wallet_lookup.id = recurring_rule.wallet_id
          join public.categories as category_lookup
            on category_lookup.id = recurring_rule.category_id
          where recurring_rule.user_id = v_integration.user_id
            and recurring_rule.archived_at is null
        ) as recurring_view
      ), '[]'::jsonb)
    );
  end if;

  select active_session.*
    into v_session
  from public.integration_sessions as active_session
  where active_session.integration_id = v_integration.id
    and active_session.flow = 'telegram_recurring'
    and active_session.status = 'active'
    and active_session.deleted_at is null
    and active_session.expires_at > now()
  for update;
  if not found then
    return jsonb_build_object('status', 'linked', 'step', 'none');
  end if;

  if p_action = 'cancel' then
    update public.integration_sessions as canceled_session
    set status = 'canceled',
        deleted_at = now()
    where canceled_session.id = v_session.id;
    return jsonb_build_object('status', 'linked', 'step', 'canceled');
  end if;

  if p_action in ('start_expense', 'start_income') then
    update public.integration_sessions as start_session
    set step = 'wallet',
        payload = jsonb_build_object(
          'mode', 'create',
          'type', case when p_action = 'start_expense' then 'expense' else 'income' end
        ),
        expires_at = now() + interval '30 minutes'
    where start_session.id = v_session.id
    returning * into v_session;
  elsif p_action = 'edit' then
    v_rule_id := nullif(v_session.payload->'rules'->>v_n, '')::uuid;
    select rule_source.*
      into v_rule
    from public.recurring_transaction_rules as rule_source
    where rule_source.id = v_rule_id
      and rule_source.user_id = v_integration.user_id
      and rule_source.archived_at is null;
    if not found then
      return jsonb_build_object('status', 'linked', 'step', 'list', 'error', 'Pilihan rutin tidak tersedia.');
    end if;

    update public.integration_sessions as edit_session
    set step = 'edit_field',
        payload = jsonb_build_object(
          'mode', 'edit',
          'rule_id', v_rule.id::text,
          'type', v_rule.type::text,
          'wallet_id', v_rule.wallet_id::text,
          'category_id', v_rule.category_id::text,
          'amount', v_rule.amount,
          'note', v_rule.note,
          'frequency', v_rule.frequency::text,
          'start_date', v_rule.start_date::text,
          'local_time', v_rule.local_time::text
        ),
        expires_at = now() + interval '30 minutes'
    where edit_session.id = v_session.id
    returning * into v_session;
  elsif p_action = 'edit_field' then
    if v_session.step <> 'edit_field'
       or v_n not in ('wallet', 'category', 'amount', 'frequency', 'schedule', 'note') then
      return jsonb_build_object('status', 'linked', 'step', v_session.step, 'error', 'Pilihan edit tidak valid.');
    end if;

    update public.integration_sessions as field_session
    set step = case when v_n in ('wallet', 'category', 'frequency', 'schedule') then v_n else v_n end,
        payload = v_session.payload || jsonb_build_object('editing', v_n),
        expires_at = now() + interval '30 minutes'
    where field_session.id = v_session.id
    returning * into v_session;
  elsif p_action = 'wallet' then
    if v_session.step <> 'wallet' then
      return jsonb_build_object('status', 'linked', 'step', v_session.step, 'error', 'Pilihan wallet tidak aktif.');
    end if;

    select wallet_source.*
      into v_wallet
    from public.wallets as wallet_source
    where wallet_source.id = nullif(v_session.payload->'wallets'->>v_n, '')::uuid
      and wallet_source.user_id = v_integration.user_id
      and wallet_source.status = 'active'
      and wallet_source.deleted_at is null;
    if not found then
      return jsonb_build_object('status', 'linked', 'step', 'wallet', 'error', 'Wallet tidak tersedia.');
    end if;

    update public.integration_sessions as wallet_session
    set step = case when v_session.payload->>'mode' = 'edit' then 'edit_field' else 'category' end,
        payload = v_session.payload
          || jsonb_build_object(
            'wallet_id', v_wallet.id::text,
            'wallet_name', v_wallet.name,
            'currency', v_wallet.currency::text
          ) - 'wallets',
        expires_at = now() + interval '30 minutes'
    where wallet_session.id = v_session.id
    returning * into v_session;
  elsif p_action = 'category' then
    if v_session.step <> 'category' then
      return jsonb_build_object('status', 'linked', 'step', v_session.step, 'error', 'Pilihan kategori tidak aktif.');
    end if;

    select category_source.*
      into v_category
    from public.categories as category_source
    where category_source.id = nullif(v_session.payload->'categories'->>v_n, '')::uuid
      and category_source.user_id = v_integration.user_id
      and category_source.type::text = v_session.payload->>'type'
      and category_source.status = 'active'
      and category_source.archived_at is null;
    if not found then
      return jsonb_build_object('status', 'linked', 'step', 'category', 'error', 'Kategori tidak tersedia.');
    end if;

    update public.integration_sessions as category_session
    set step = case when v_session.payload->>'mode' = 'edit' then 'edit_field' else 'amount' end,
        payload = v_session.payload
          || jsonb_build_object(
            'category_id', v_category.id::text,
            'category_name', v_category.name
          ) - 'categories',
        expires_at = now() + interval '30 minutes'
    where category_session.id = v_session.id
    returning * into v_session;
  elsif p_action = 'amount' then
    if v_session.step <> 'amount'
       or v_n !~ '^[0-9]+(\.[0-9]{1,4})?$'
       or v_n::numeric <= 0 then
      return jsonb_build_object('status', 'linked', 'step', 'amount', 'error', 'Masukkan nominal positif dengan maksimal 4 angka desimal.');
    end if;

    update public.integration_sessions as amount_session
    set step = case when v_session.payload->>'mode' = 'edit' then 'edit_field' else 'frequency' end,
        payload = v_session.payload || jsonb_build_object('amount', v_n::numeric),
        expires_at = now() + interval '30 minutes'
    where amount_session.id = v_session.id
    returning * into v_session;
  elsif p_action = 'frequency' then
    if v_session.step <> 'frequency' or v_n not in ('weekly', 'monthly') then
      return jsonb_build_object('status', 'linked', 'step', 'frequency', 'error', 'Pilih frekuensi yang tersedia.');
    end if;

    update public.integration_sessions as frequency_session
    set step = 'schedule_day',
        payload = v_session.payload || jsonb_build_object('frequency', v_n),
        expires_at = now() + interval '30 minutes'
    where frequency_session.id = v_session.id
    returning * into v_session;
  elsif p_action = 'weekday' then
    if v_session.step <> 'schedule_day' or v_n !~ '^[1-7]$' then
      return jsonb_build_object('status', 'linked', 'step', 'schedule_day', 'error', 'Pilih hari yang tersedia.');
    end if;

    v_date := (now() at time zone public.recurring_tz(v_integration.user_id))::date
      + ((v_n::int - extract(isodow from (now() at time zone public.recurring_tz(v_integration.user_id))::date)::int + 7) % 7);
    update public.integration_sessions as weekday_session
    set step = 'schedule_time',
        payload = v_session.payload || jsonb_build_object('start_date', v_date::text),
        expires_at = now() + interval '30 minutes'
    where weekday_session.id = v_session.id
    returning * into v_session;
  elsif p_action = 'monthday' then
    if v_session.step <> 'schedule_day' or v_n !~ '^([1-9]|[12][0-9]|3[01])$' then
      return jsonb_build_object('status', 'linked', 'step', 'schedule_day', 'error', 'Pilih tanggal 1 sampai 31.');
    end if;

    v_day := v_n::int;
    v_date := date_trunc('month', (now() at time zone public.recurring_tz(v_integration.user_id))::date)::date
      + least(
        v_day,
        extract(day from (date_trunc('month', (now() at time zone public.recurring_tz(v_integration.user_id))::date) + interval '1 month - 1 day'))::int
      ) - 1;
    if v_date < (now() at time zone public.recurring_tz(v_integration.user_id))::date then
      v_date := date_trunc('month', v_date + interval '1 month')::date
        + least(
          v_day,
          extract(day from (date_trunc('month', v_date + interval '1 month') + interval '1 month - 1 day'))::int
        ) - 1;
    end if;

    update public.integration_sessions as monthday_session
    set step = 'schedule_time',
        payload = v_session.payload || jsonb_build_object('start_date', v_date::text),
        expires_at = now() + interval '30 minutes'
    where monthday_session.id = v_session.id
    returning * into v_session;
  elsif p_action = 'time' then
    if v_session.step <> 'schedule_time' or v_n !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
      return jsonb_build_object('status', 'linked', 'step', 'schedule_time', 'error', 'Masukkan waktu 00:00 sampai 23:59.');
    end if;

    update public.integration_sessions as time_session
    set step = case when v_session.payload->>'mode' = 'edit' then 'edit_field' else 'note' end,
        payload = v_session.payload || jsonb_build_object('local_time', v_n),
        expires_at = now() + interval '30 minutes'
    where time_session.id = v_session.id
    returning * into v_session;
  elsif p_action in ('note', 'skip_note') then
    if v_session.step <> 'note' then
      return jsonb_build_object('status', 'linked', 'step', v_session.step, 'error', 'Langkah catatan tidak aktif.');
    end if;

    v_note := case when p_action = 'skip_note' then null else nullif(trim(v_n), '') end;
    if v_note is not null and char_length(v_note) > 500 then
      return jsonb_build_object('status', 'linked', 'step', 'note', 'error', 'Catatan maksimal 500 karakter.');
    end if;

    update public.integration_sessions as note_session
    set step = case when v_session.payload->>'mode' = 'edit' then 'edit_field' else 'confirm' end,
        payload = v_session.payload || jsonb_build_object('note', v_note),
        expires_at = now() + interval '30 minutes'
    where note_session.id = v_session.id
    returning * into v_session;
  elsif p_action = 'review' then
    if v_session.step <> 'edit_field' then
      return jsonb_build_object('status', 'linked', 'step', v_session.step, 'error', 'Sesi edit tidak aktif.');
    end if;

    update public.integration_sessions as review_session
    set step = 'confirm',
        expires_at = now() + interval '30 minutes'
    where review_session.id = v_session.id
    returning * into v_session;
  elsif p_action = 'confirm' then
    if v_session.step <> 'confirm' then
      return jsonb_build_object('status', 'linked', 'step', v_session.step, 'error', 'Konfirmasi tidak aktif atau sudah diproses.');
    end if;

    select wallet_source.*
      into v_wallet
    from public.wallets as wallet_source
    where wallet_source.id = (v_session.payload->>'wallet_id')::uuid
      and wallet_source.user_id = v_integration.user_id
      and wallet_source.status = 'active'
      and wallet_source.deleted_at is null;
    select category_source.*
      into v_category
    from public.categories as category_source
    where category_source.id = (v_session.payload->>'category_id')::uuid
      and category_source.user_id = v_integration.user_id
      and category_source.type::text = v_session.payload->>'type'
      and category_source.status = 'active'
      and category_source.archived_at is null;
    if not found
       or v_wallet.id is null
       or v_category.id is null
       or coalesce((v_session.payload->>'amount')::numeric, 0) <= 0
       or (v_session.payload->>'amount')::numeric <> round((v_session.payload->>'amount')::numeric, 4)
       or v_session.payload->>'frequency' not in ('weekly', 'monthly')
       or v_session.payload->>'start_date' is null
       or v_session.payload->>'local_time' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
      return jsonb_build_object('status', 'linked', 'step', 'confirm', 'error', 'Data jadwal tidak lagi valid. Periksa kembali pilihan Anda.');
    end if;

    if v_session.payload->>'mode' = 'create' then
      insert into public.recurring_transaction_rules(
        user_id, type, wallet_id, category_id, amount, note, frequency,
        start_date, next_due_at, local_time, timezone
      )
      values (
        v_integration.user_id,
        (v_session.payload->>'type')::public.category_type,
        v_wallet.id,
        v_category.id,
        (v_session.payload->>'amount')::numeric,
        nullif(v_session.payload->>'note', ''),
        (v_session.payload->>'frequency')::public.recurring_frequency,
        (v_session.payload->>'start_date')::date,
        public.recurring_due(
          (v_session.payload->>'start_date')::date,
          (v_session.payload->>'local_time')::time,
          public.recurring_tz(v_integration.user_id)
        ),
        (v_session.payload->>'local_time')::time,
        public.recurring_tz(v_integration.user_id)
      )
      returning id into v_rule_id;
    else
      v_rule_id := (v_session.payload->>'rule_id')::uuid;
      update public.recurring_transaction_rules as rule_target
      set type = (v_session.payload->>'type')::public.category_type,
          wallet_id = v_wallet.id,
          category_id = v_category.id,
          amount = (v_session.payload->>'amount')::numeric,
          note = nullif(v_session.payload->>'note', ''),
          frequency = (v_session.payload->>'frequency')::public.recurring_frequency,
          start_date = (v_session.payload->>'start_date')::date,
          local_time = (v_session.payload->>'local_time')::time,
          timezone = public.recurring_tz(v_integration.user_id),
          next_due_at = public.recurring_due(
            greatest(
              (v_session.payload->>'start_date')::date,
              (now() at time zone public.recurring_tz(v_integration.user_id))::date
            ),
            (v_session.payload->>'local_time')::time,
            public.recurring_tz(v_integration.user_id)
          ),
          last_error = null
      where rule_target.id = v_rule_id
        and rule_target.user_id = v_integration.user_id
        and rule_target.archived_at is null;
      if not found then
        return jsonb_build_object('status', 'linked', 'step', 'confirm', 'error', 'Jadwal rutin tidak tersedia.');
      end if;

      select recurring_source.*
        into v_rule
      from public.recurring_transaction_rules as recurring_source
      where recurring_source.id = v_rule_id
      for update;
      while v_rule.next_due_at <= now() loop
        v_rule.next_due_at := public.recurring_next(v_rule);
      end loop;
      update public.recurring_transaction_rules as recurring_target
      set next_due_at = v_rule.next_due_at
      where recurring_target.id = v_rule.id;
    end if;

    update public.integration_sessions as completed_session
    set status = 'completed',
        payload = v_session.payload || jsonb_build_object('rule_id', v_rule_id::text)
    where completed_session.id = v_session.id;

    return jsonb_build_object(
      'status', 'linked',
      'step', 'completed',
      'mode', v_session.payload->>'mode',
      'type', v_session.payload->>'type',
      'wallet', v_wallet.name,
      'category', v_category.name,
      'currency', v_wallet.currency::text,
      'amount', v_session.payload->>'amount'
    );
  elsif p_action = 'back' then
    if v_session.step = 'category' then
      update public.integration_sessions as category_back
      set step = 'wallet',
          payload = v_session.payload - 'wallet_id' - 'wallet_name' - 'currency'
      where category_back.id = v_session.id
      returning * into v_session;
    elsif v_session.step = 'amount' then
      update public.integration_sessions as amount_back
      set step = 'category',
          payload = v_session.payload - 'category_id' - 'category_name'
      where amount_back.id = v_session.id
      returning * into v_session;
    elsif v_session.step in ('frequency', 'schedule_day', 'schedule_time', 'note') then
      update public.integration_sessions as flow_back
      set step = case
        when v_session.step = 'frequency' then 'amount'
        when v_session.step = 'schedule_day' then 'frequency'
        when v_session.step = 'schedule_time' then 'schedule_day'
        else 'schedule_time'
      end
      where flow_back.id = v_session.id
      returning * into v_session;
    elsif v_session.step = 'confirm' then
      update public.integration_sessions as confirm_back
      set step = case when v_session.payload->>'mode' = 'edit' then 'edit_field' else 'note' end
      where confirm_back.id = v_session.id
      returning * into v_session;
    end if;
  end if;

  select session_lookup.*
    into v_session
  from public.integration_sessions as session_lookup
  where session_lookup.id = v_session.id;

  if v_session.step = 'wallet' then
    select coalesce(jsonb_object_agg(wallet_ref.row_num, wallet_ref.wallet_id), '{}'::jsonb)
      into v_refs
    from (
      select row_number() over (order by wallet_source.name)::text as row_num,
             wallet_source.id as wallet_id
      from public.wallets as wallet_source
      where wallet_source.user_id = v_integration.user_id
        and wallet_source.status = 'active'
        and wallet_source.deleted_at is null
    ) as wallet_ref;
    update public.integration_sessions as wallet_session
    set payload = v_session.payload || jsonb_build_object('wallets', v_refs)
    where wallet_session.id = v_session.id
    returning * into v_session;
  end if;

  if v_session.step = 'category' then
    select coalesce(jsonb_object_agg(category_ref.row_num, category_ref.category_id), '{}'::jsonb)
      into v_refs
    from (
      select row_number() over (order by category_source.name)::text as row_num,
             category_source.id as category_id
      from public.categories as category_source
      where category_source.user_id = v_integration.user_id
        and category_source.type::text = v_session.payload->>'type'
        and category_source.status = 'active'
        and category_source.archived_at is null
    ) as category_ref;
    update public.integration_sessions as category_session
    set payload = v_session.payload || jsonb_build_object('categories', v_refs)
    where category_session.id = v_session.id
    returning * into v_session;
  end if;

  return jsonb_build_object(
    'status', 'linked',
    'step', v_session.step,
    'mode', v_session.payload->>'mode',
    'type', v_session.payload->>'type',
    'wallet', v_session.payload->>'wallet_name',
    'category', v_session.payload->>'category_name',
    'currency', v_session.payload->>'currency',
    'amount', v_session.payload->>'amount',
    'note', v_session.payload->>'note',
    'frequency', v_session.payload->>'frequency',
    'start_date', v_session.payload->>'start_date',
    'local_time', v_session.payload->>'local_time',
    'timezone', public.recurring_tz(v_integration.user_id),
    'wallets', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'ref', wallet_ref.row_num,
          'name', wallet_ref.name,
          'currency', wallet_ref.currency
        )
        order by wallet_ref.name
      )
      from (
        select row_number() over (order by wallet_source.name)::text as row_num,
               wallet_source.name,
               wallet_source.currency::text as currency
        from public.wallets as wallet_source
        where wallet_source.user_id = v_integration.user_id
          and wallet_source.status = 'active'
          and wallet_source.deleted_at is null
      ) as wallet_ref
    ), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'ref', category_ref.row_num,
          'name', category_ref.name
        )
        order by category_ref.name
      )
      from (
        select row_number() over (order by category_source.name)::text as row_num,
               category_source.name
        from public.categories as category_source
        where category_source.user_id = v_integration.user_id
          and category_source.type::text = v_session.payload->>'type'
          and category_source.status = 'active'
          and category_source.archived_at is null
      ) as category_ref
    ), '[]'::jsonb)
  );
end;
$function$;

revoke all on function public.telegram_recurring_session(text, text, text, text) from public, anon, authenticated;
grant execute on function public.telegram_recurring_session(text, text, text, text) to service_role;

commit;
