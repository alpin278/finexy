-- Phase 28 follow-up: use the persistent owner-scoped import map for runtime
-- relationship resolution so Supabase's static function checker can validate
-- the SECURITY DEFINER restore function.

begin;

create or replace function public.finexy_import_backup(p_backup jsonb, p_mode text default 'merge')
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_backup_key text;
  v_existing_summary jsonb;
  v_mode text := lower(trim(coalesce(p_mode, 'merge')));
  v_item jsonb;
  v_related jsonb;
  v_ref text;
  v_fp text;
  v_target_id uuid;
  v_source_fp text;
  v_wallet_id uuid;
  v_category_id uuid;
  v_transfer_id uuid;
  v_source_transaction_id uuid;
  v_destination_transaction_id uuid;
  v_source_transaction_ref text;
  v_destination_transaction_ref text;
  v_amount numeric;
  v_source_amount numeric;
  v_destination_amount numeric;
  v_exchange_rate numeric;
  v_fee_amount numeric;
  v_limit_amount numeric;
  v_period_start date;
  v_start_date date;
  v_end_date date;
  v_next_due_at timestamptz;
  v_occurred_at timestamptz;
  v_posted_at timestamptz;
  v_cleared_at timestamptz;
  v_local_time time;
  v_archived_at timestamptz;
  v_active boolean;
  v_json_type text;
  v_count_wallets integer := 0;
  v_count_categories integer := 0;
  v_count_category_rules integer := 0;
  v_count_transactions integer := 0;
  v_count_transfers integer := 0;
  v_count_budgets integer := 0;
  v_count_recurring integer := 0;
  v_summary jsonb;
begin
  if v_user is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if p_backup is null or jsonb_typeof(p_backup) <> 'object' then
    raise exception using errcode = '22023', message = 'Backup must be a JSON object.';
  end if;
  if p_backup->>'format' <> 'finexy-backup' then
    raise exception using errcode = '22023', message = 'Unsupported backup format.';
  end if;
  if coalesce(p_backup->>'version', '') !~ '^[0-9]+$' or (p_backup->>'version')::integer <> 1 then
    raise exception using errcode = '22023', message = 'Unsupported backup version.';
  end if;
  if v_mode not in ('merge', 'restore_empty') then
    raise exception using errcode = '22023', message = 'Import mode must be merge or restore_empty.';
  end if;
  if coalesce(p_backup->>'exported_at', '') = '' then
    raise exception using errcode = '22023', message = 'Backup export timestamp is required.';
  end if;
  begin
    perform (p_backup->>'exported_at')::timestamptz;
  exception when others then
    raise exception using errcode = '22023', message = 'Backup export timestamp is invalid.';
  end;

  v_backup_key := encode(extensions.digest(p_backup::text, 'sha256'), 'hex');
  select bi.summary into v_existing_summary
    from public.backup_imports bi
   where bi.user_id = v_user and bi.backup_key = v_backup_key;
  if v_existing_summary is not null then
    return v_existing_summary || jsonb_build_object('already_imported', true);
  end if;

  for v_json_type in select * from unnest(array['wallets','categories','category_rules','transactions','wallet_transfers','budgets','recurring_rules']) loop
    if p_backup->v_json_type is null then
      raise exception using errcode = '22023', message = format('Backup field %s is required.', v_json_type);
    end if;
    if jsonb_typeof(p_backup->v_json_type) <> 'array' then
      raise exception using errcode = '22023', message = format('Backup field %s must be an array.', v_json_type);
    end if;
  end loop;

  if v_mode = 'restore_empty' and (
    exists (select 1 from public.wallets where user_id = v_user and deleted_at is null)
    or exists (select 1 from public.categories where user_id = v_user)
    or exists (select 1 from public.transactions where user_id = v_user and deleted_at is null)
    or exists (select 1 from public.wallet_transfers where user_id = v_user and deleted_at is null)
    or exists (select 1 from public.budgets where user_id = v_user)
    or exists (select 1 from public.recurring_transaction_rules where user_id = v_user)
  ) then
    raise exception using errcode = '55000', message = 'Restore into an empty account requires no existing financial records.';
  end if;

  if v_mode = 'restore_empty' and jsonb_typeof(p_backup->'profile') = 'object' then
    update public.profiles
       set display_name = nullif(trim(p_backup->'profile'->>'display_name'), ''),
           avatar_url = nullif(trim(p_backup->'profile'->>'avatar_url'), ''),
           location = nullif(trim(p_backup->'profile'->>'location'), '')
     where id = v_user;
  end if;

  if v_mode = 'restore_empty' and jsonb_typeof(p_backup->'settings') = 'object' then
    if p_backup->'settings'->>'default_currency' not in ('USD','EUR','GBP','IDR')
       or p_backup->'settings'->>'default_transaction_type' not in ('income','expense')
       or p_backup->'settings'->>'appearance' not in ('light','dark','system')
       or p_backup->'settings'->>'entry_mode' not in ('quick','detailed') then
      raise exception using errcode = '22023', message = 'Backup settings contain unsupported enum values.';
    end if;
    insert into public.user_settings (
      user_id, default_currency, region, timezone, date_format, number_format,
      appearance, default_transaction_type, entry_mode, auto_categorize,
      merchant_suggestions, confirm_before_delete
    ) values (
      v_user,
      (p_backup->'settings'->>'default_currency')::public.currency_code,
      coalesce(p_backup->'settings'->>'region', 'en-US'),
      coalesce(p_backup->'settings'->>'timezone', 'UTC'),
      coalesce(p_backup->'settings'->>'date_format', 'MMM d, yyyy'),
      coalesce(p_backup->'settings'->>'number_format', '1,234.56'),
      p_backup->'settings'->>'appearance',
      (p_backup->'settings'->>'default_transaction_type')::public.category_type,
      p_backup->'settings'->>'entry_mode',
      coalesce((p_backup->'settings'->>'auto_categorize')::boolean, true),
      coalesce((p_backup->'settings'->>'merchant_suggestions')::boolean, true),
      coalesce((p_backup->'settings'->>'confirm_before_delete')::boolean, true)
    ) on conflict (user_id) do update set
      default_currency = excluded.default_currency,
      region = excluded.region,
      timezone = excluded.timezone,
      date_format = excluded.date_format,
      number_format = excluded.number_format,
      appearance = excluded.appearance,
      default_transaction_type = excluded.default_transaction_type,
      entry_mode = excluded.entry_mode,
      auto_categorize = excluded.auto_categorize,
      merchant_suggestions = excluded.merchant_suggestions,
      confirm_before_delete = excluded.confirm_before_delete;
  end if;

  if v_mode = 'restore_empty' and jsonb_typeof(p_backup->'notification_preferences') = 'array' then
    for v_item in select value from jsonb_array_elements(p_backup->'notification_preferences') as elements(value) loop
      if v_item->>'preference_key' is null or v_item->>'channel' not in ('in_app','email','telegram') or jsonb_typeof(v_item->'enabled') <> 'boolean' then
        raise exception using errcode = '22023', message = 'Notification preference is invalid.';
      end if;
      insert into public.notification_preferences (user_id, preference_key, channel, enabled)
      values (v_user, v_item->>'preference_key', (v_item->>'channel')::public.notification_channel, (v_item->>'enabled')::boolean)
      on conflict (user_id, preference_key, channel) do update set enabled = excluded.enabled;
    end loop;
  end if;

  for v_item in select value from jsonb_array_elements(p_backup->'wallets') as elements(value) loop
    v_ref := v_item->>'ref';
    if v_ref !~ '^wallet_[A-Za-z0-9_-]{1,150}$' then raise exception using errcode = '22023', message = 'Wallet reference is invalid.'; end if;
    v_fp := encode(extensions.digest(v_item::text, 'sha256'), 'hex');
    select m.target_id, m.source_fingerprint into v_target_id, v_source_fp from public.backup_record_maps m where m.user_id=v_user and m.entity_type='wallet' and m.source_ref=v_ref;
    if v_target_id is not null then
      if v_source_fp <> v_fp then raise exception using errcode = '22023', message = 'Wallet reference does not match its prior import.'; end if;
      continue;
    end if;
    if v_item->>'name' is null or v_item->>'currency' not in ('USD','EUR','GBP','IDR') or v_item->>'kind' not in ('bank','cash','card','travel','savings') or v_item->>'status' not in ('active','inactive') then
      raise exception using errcode = '22023', message = 'Wallet data is invalid.';
    end if;
    if coalesce(v_item->>'opening_balance','') !~ '^-?[0-9]+(\.[0-9]{1,4})?$' then raise exception using errcode = '22023', message = 'Wallet opening balance precision is invalid.'; end if;
    v_amount := (v_item->>'opening_balance')::numeric;
    if abs(v_amount) > 9999999999999999.9999 then raise exception using errcode = '22023', message = 'Wallet opening balance is out of range.'; end if;
    v_limit_amount := nullif(v_item->>'monthly_limit','')::numeric;
    if v_limit_amount is not null and (v_limit_amount < 0 or v_limit_amount > 9999999999999999.9999 or coalesce(v_item->>'monthly_limit','') !~ '^[0-9]+(\.[0-9]{1,4})?$') then raise exception using errcode = '22023', message = 'Wallet monthly limit is invalid.'; end if;
    begin v_occurred_at := (v_item->>'opening_balance_at')::timestamptz; exception when others then raise exception using errcode = '22023', message = 'Wallet opening date is invalid.'; end;
    insert into public.wallets (user_id, name, currency, opening_balance, opening_balance_at, kind, status, monthly_limit, institution, account_mask, icon_identifier, accent_identifier)
    values (v_user, v_item->>'name', (v_item->>'currency')::public.currency_code, v_amount, v_occurred_at, (v_item->>'kind')::public.wallet_kind, (v_item->>'status')::public.wallet_status, v_limit_amount, nullif(v_item->>'institution',''), nullif(v_item->>'account_mask',''), nullif(v_item->>'icon_identifier',''), nullif(v_item->>'accent_identifier',''))
    returning id into v_target_id;
    insert into public.backup_record_maps(user_id, entity_type, source_ref, source_fingerprint, target_id) values (v_user, 'wallet', v_ref, v_fp, v_target_id);
    v_count_wallets := v_count_wallets + 1;
  end loop;

  for v_item in select value from jsonb_array_elements(p_backup->'categories') as elements(value) loop
    v_ref := v_item->>'ref';
    if v_ref !~ '^category_[A-Za-z0-9_-]{1,150}$' then raise exception using errcode = '22023', message = 'Category reference is invalid.'; end if;
    v_fp := encode(extensions.digest(v_item::text, 'sha256'), 'hex');
    select m.target_id, m.source_fingerprint into v_target_id, v_source_fp from public.backup_record_maps m where m.user_id=v_user and m.entity_type='category' and m.source_ref=v_ref;
    if v_target_id is not null then
      if v_source_fp <> v_fp then raise exception using errcode = '22023', message = 'Category reference does not match its prior import.'; end if;
      continue;
    end if;
    if v_item->>'name' is null or v_item->>'type' not in ('income','expense') or v_item->>'status' not in ('active','inactive') then raise exception using errcode = '22023', message = 'Category data is invalid.'; end if;
    v_archived_at := nullif(v_item->>'archived_at','')::timestamptz;
    insert into public.categories (user_id, name, type, icon_identifier, accent_identifier, keywords, status, archived_at)
    values (v_user, v_item->>'name', (v_item->>'type')::public.category_type, nullif(v_item->>'icon_identifier',''), nullif(v_item->>'accent_identifier',''), coalesce(array(select jsonb_array_elements_text(v_item->'keywords')), '{}'::text[]), (v_item->>'status')::public.category_status, v_archived_at)
    returning id into v_target_id;
    insert into public.backup_record_maps(user_id, entity_type, source_ref, source_fingerprint, target_id) values (v_user, 'category', v_ref, v_fp, v_target_id);
    v_count_categories := v_count_categories + 1;
  end loop;

  for v_item in select value from jsonb_array_elements(p_backup->'category_rules') as elements(value) loop
    v_ref := v_item->>'ref';
    if v_ref !~ '^category_rule_[A-Za-z0-9_-]{1,150}$' or not exists (select 1 from public.backup_record_maps where user_id=v_user and entity_type='category' and source_ref=v_item->>'category_ref') then raise exception using errcode = '22023', message = 'Category rule relationship is invalid.'; end if;
    v_fp := encode(extensions.digest(v_item::text, 'sha256'), 'hex');
    select m.target_id, m.source_fingerprint into v_target_id, v_source_fp from public.backup_record_maps m where m.user_id=v_user and m.entity_type='category_rule' and m.source_ref=v_ref;
    if v_target_id is not null then
      if v_source_fp <> v_fp then raise exception using errcode = '22023', message = 'Category rule reference does not match its prior import.'; end if;
      continue;
    end if;
    if v_item->>'field' not in ('payee','description') or v_item->>'operator' not in ('contains','starts_with','exact_match') or coalesce(v_item->>'value','') = '' or coalesce(v_item->>'priority','') !~ '^[0-9]+$' or jsonb_typeof(v_item->'enabled') <> 'boolean' then raise exception using errcode = '22023', message = 'Category rule data is invalid.'; end if;
    select target_id into v_category_id from public.backup_record_maps where user_id=v_user and entity_type='category' and source_ref=v_item->>'category_ref';
    insert into public.category_rules (user_id, category_id, field, operator, value, priority, enabled, label)
    values (v_user, v_category_id, (v_item->>'field')::public.category_rule_field, (v_item->>'operator')::public.rule_operator, v_item->>'value', (v_item->>'priority')::integer, (v_item->>'enabled')::boolean, nullif(v_item->>'label',''))
    returning id into v_target_id;
    insert into public.backup_record_maps(user_id, entity_type, source_ref, source_fingerprint, target_id) values (v_user, 'category_rule', v_ref, v_fp, v_target_id);
    v_count_category_rules := v_count_category_rules + 1;
  end loop;

  for v_item in select value from jsonb_array_elements(p_backup->'transactions') as elements(value) where value->>'type' <> 'transfer' loop
    v_ref := v_item->>'ref';
    if v_ref !~ '^transaction_[A-Za-z0-9_-]{1,150}$' or not exists (select 1 from public.backup_record_maps where user_id=v_user and entity_type='wallet' and source_ref=v_item->>'wallet_ref') or not exists (select 1 from public.backup_record_maps where user_id=v_user and entity_type='category' and source_ref=v_item->>'category_ref') then raise exception using errcode = '22023', message = 'Transaction relationship is invalid.'; end if;
    v_fp := encode(extensions.digest(v_item::text, 'sha256'), 'hex');
    select m.target_id, m.source_fingerprint into v_target_id, v_source_fp from public.backup_record_maps m where m.user_id=v_user and m.entity_type='transaction' and m.source_ref=v_ref;
    if v_target_id is not null then
      if v_source_fp <> v_fp then raise exception using errcode = '22023', message = 'Transaction reference does not match its prior import.'; end if;
      continue;
    end if;
    if v_item->>'type' not in ('income','expense') or v_item->>'currency' not in ('USD','EUR','GBP','IDR') or v_item->>'status' not in ('pending','completed','canceled') or v_item->>'source' not in ('web','telegram','import','api','recurring') or coalesce(v_item->>'amount','') !~ '^[0-9]+(\.[0-9]{1,4})?$' then raise exception using errcode = '22023', message = 'Transaction data is invalid.'; end if;
    v_amount := (v_item->>'amount')::numeric;
    if v_amount <= 0 or v_amount > 9999999999999999.9999 then raise exception using errcode = '22023', message = 'Transaction amount is out of range.'; end if;
    select target_id into v_wallet_id from public.backup_record_maps where user_id=v_user and entity_type='wallet' and source_ref=v_item->>'wallet_ref';
    select target_id into v_category_id from public.backup_record_maps where user_id=v_user and entity_type='category' and source_ref=v_item->>'category_ref';
    if not exists (select 1 from public.wallets where id=v_wallet_id and user_id=v_user and currency=(v_item->>'currency')::public.currency_code) then raise exception using errcode = '22023', message = 'Transaction wallet currency does not match.'; end if;
    begin v_occurred_at := (v_item->>'occurred_at')::timestamptz; v_posted_at := nullif(v_item->>'posted_at','')::timestamptz; v_cleared_at := nullif(v_item->>'cleared_at','')::timestamptz; exception when others then raise exception using errcode = '22023', message = 'Transaction date is invalid.'; end;
    insert into public.transactions (user_id, wallet_id, category_id, type, amount, currency, payee, description, note, occurred_at, posted_at, cleared_at, status, source, reference)
    values (v_user, v_wallet_id, v_category_id, (v_item->>'type')::public.transaction_type, v_amount, (v_item->>'currency')::public.currency_code, nullif(v_item->>'payee',''), nullif(v_item->>'description',''), nullif(v_item->>'note',''), v_occurred_at, v_posted_at, v_cleared_at, (v_item->>'status')::public.transaction_status, (v_item->>'source')::public.transaction_source, nullif(v_item->>'reference',''))
    returning id into v_target_id;
    insert into public.backup_record_maps(user_id, entity_type, source_ref, source_fingerprint, target_id) values (v_user, 'transaction', v_ref, v_fp, v_target_id);
    v_count_transactions := v_count_transactions + 1;
  end loop;

  for v_item in select value from jsonb_array_elements(p_backup->'wallet_transfers') as elements(value) loop
    v_source_transaction_id := null;
    v_destination_transaction_id := null;
    v_ref := v_item->>'ref';
    if v_ref !~ '^transfer_[A-Za-z0-9_-]{1,150}$' or not exists (select 1 from public.backup_record_maps where user_id=v_user and entity_type='wallet' and source_ref=v_item->>'source_wallet_ref') or not exists (select 1 from public.backup_record_maps where user_id=v_user and entity_type='wallet' and source_ref=v_item->>'destination_wallet_ref') then raise exception using errcode = '22023', message = 'Transfer relationship is invalid.'; end if;
    v_fp := encode(extensions.digest(v_item::text, 'sha256'), 'hex');
    select m.target_id, m.source_fingerprint into v_target_id, v_source_fp from public.backup_record_maps m where m.user_id=v_user and m.entity_type='transfer' and m.source_ref=v_ref;
    if v_target_id is not null then
      if v_source_fp <> v_fp then raise exception using errcode = '22023', message = 'Transfer reference does not match its prior import.'; end if;
      continue;
    end if;
    if v_item->>'status' not in ('pending','completed','canceled') or v_item->>'source' not in ('web','telegram','import','api','recurring') or coalesce(v_item->>'source_amount','') !~ '^[0-9]+(\.[0-9]{1,4})?$' or coalesce(v_item->>'destination_amount','') !~ '^[0-9]+(\.[0-9]{1,4})?$' or coalesce(v_item->>'fee_amount','') !~ '^[0-9]+(\.[0-9]{1,4})?$' then raise exception using errcode = '22023', message = 'Transfer data is invalid.'; end if;
    v_source_amount := (v_item->>'source_amount')::numeric; v_destination_amount := (v_item->>'destination_amount')::numeric; v_fee_amount := (v_item->>'fee_amount')::numeric; v_exchange_rate := nullif(v_item->>'exchange_rate','')::numeric;
    if v_source_amount <= 0 or v_destination_amount <= 0 or v_fee_amount < 0 or (v_exchange_rate is not null and v_exchange_rate <= 0) then raise exception using errcode = '22023', message = 'Transfer amounts are invalid.'; end if;
    select target_id into v_wallet_id from public.backup_record_maps where user_id=v_user and entity_type='wallet' and source_ref=v_item->>'source_wallet_ref';
    select target_id into v_category_id from public.backup_record_maps where user_id=v_user and entity_type='wallet' and source_ref=v_item->>'destination_wallet_ref';
    v_source_transaction_ref := nullif(v_item->>'source_transaction_ref','');
    v_destination_transaction_ref := nullif(v_item->>'destination_transaction_ref','');
    if v_item->>'status' = 'completed' and (v_source_transaction_ref is null or v_destination_transaction_ref is null) then raise exception using errcode = '22023', message = 'Completed transfer must contain both ledger legs.'; end if;
    if v_source_transaction_ref is not null then
      select value into v_related from jsonb_array_elements(p_backup->'transactions') as elements(value) where value->>'ref'=v_source_transaction_ref;
      if v_related is null or v_related->>'type' <> 'transfer' or v_related->>'transfer_ref' <> v_ref or v_related->>'transfer_leg' <> 'outbound' then raise exception using errcode = '22023', message = 'Outbound transfer leg is invalid.'; end if;
    end if;
    if v_destination_transaction_ref is not null then
      select value into v_related from jsonb_array_elements(p_backup->'transactions') as elements(value) where value->>'ref'=v_destination_transaction_ref;
      if v_related is null or v_related->>'type' <> 'transfer' or v_related->>'transfer_ref' <> v_ref or v_related->>'transfer_leg' <> 'inbound' then raise exception using errcode = '22023', message = 'Inbound transfer leg is invalid.'; end if;
    end if;
    insert into public.wallet_transfers (user_id, source_wallet_id, destination_wallet_id, source_amount, destination_amount, exchange_rate, fee_amount, status, source, reference)
    values (v_user, v_wallet_id, v_category_id, v_source_amount, v_destination_amount, v_exchange_rate, v_fee_amount, 'pending', (v_item->>'source')::public.transaction_source, nullif(v_item->>'reference',''))
    returning id into v_transfer_id;
    insert into public.backup_record_maps(user_id, entity_type, source_ref, source_fingerprint, target_id) values (v_user, 'transfer', v_ref, v_fp, v_transfer_id);

    if v_source_transaction_ref is not null then
      v_related := (select value from jsonb_array_elements(p_backup->'transactions') as elements(value) where value->>'ref'=v_source_transaction_ref);
      if v_related->>'currency' not in ('USD','EUR','GBP','IDR') or coalesce(v_related->>'amount','') !~ '^[0-9]+(\.[0-9]{1,4})?$' then raise exception using errcode = '22023', message = 'Outbound transfer amount or currency is invalid.'; end if;
      v_amount := (v_related->>'amount')::numeric;
      begin v_occurred_at := (v_related->>'occurred_at')::timestamptz; v_posted_at := nullif(v_related->>'posted_at','')::timestamptz; v_cleared_at := nullif(v_related->>'cleared_at','')::timestamptz; exception when others then raise exception using errcode = '22023', message = 'Outbound transfer date is invalid.'; end;
      insert into public.transactions (user_id, wallet_id, transfer_id, type, transfer_leg, amount, currency, payee, description, note, occurred_at, posted_at, cleared_at, status, source, reference)
      values (v_user, v_wallet_id, v_transfer_id, 'transfer', 'outbound', v_amount, (v_related->>'currency')::public.currency_code, nullif(v_related->>'payee',''), nullif(v_related->>'description',''), nullif(v_related->>'note',''), v_occurred_at, v_posted_at, v_cleared_at, (v_related->>'status')::public.transaction_status, (v_related->>'source')::public.transaction_source, nullif(v_related->>'reference',''))
      returning id into v_source_transaction_id;
      v_fp := encode(extensions.digest(v_related::text, 'sha256'), 'hex');
      insert into public.backup_record_maps(user_id, entity_type, source_ref, source_fingerprint, target_id) values (v_user, 'transaction', v_source_transaction_ref, v_fp, v_source_transaction_id);
    end if;
    if v_destination_transaction_ref is not null then
      v_related := (select value from jsonb_array_elements(p_backup->'transactions') as elements(value) where value->>'ref'=v_destination_transaction_ref);
      if v_related->>'currency' not in ('USD','EUR','GBP','IDR') or coalesce(v_related->>'amount','') !~ '^[0-9]+(\.[0-9]{1,4})?$' then raise exception using errcode = '22023', message = 'Inbound transfer amount or currency is invalid.'; end if;
      v_amount := (v_related->>'amount')::numeric;
      begin v_occurred_at := (v_related->>'occurred_at')::timestamptz; v_posted_at := nullif(v_related->>'posted_at','')::timestamptz; v_cleared_at := nullif(v_related->>'cleared_at','')::timestamptz; exception when others then raise exception using errcode = '22023', message = 'Inbound transfer date is invalid.'; end;
      insert into public.transactions (user_id, wallet_id, transfer_id, type, transfer_leg, amount, currency, payee, description, note, occurred_at, posted_at, cleared_at, status, source, reference)
      values (v_user, v_category_id, v_transfer_id, 'transfer', 'inbound', v_amount, (v_related->>'currency')::public.currency_code, nullif(v_related->>'payee',''), nullif(v_related->>'description',''), nullif(v_related->>'note',''), v_occurred_at, v_posted_at, v_cleared_at, (v_related->>'status')::public.transaction_status, (v_related->>'source')::public.transaction_source, nullif(v_related->>'reference',''))
      returning id into v_destination_transaction_id;
      v_fp := encode(extensions.digest(v_related::text, 'sha256'), 'hex');
      insert into public.backup_record_maps(user_id, entity_type, source_ref, source_fingerprint, target_id) values (v_user, 'transaction', v_destination_transaction_ref, v_fp, v_destination_transaction_id);
    end if;
    update public.wallet_transfers
       set source_transaction_id=v_source_transaction_id, destination_transaction_id=v_destination_transaction_id, status=(v_item->>'status')::public.transfer_status
     where id=v_transfer_id and user_id=v_user;
    v_count_transfers := v_count_transfers + 1;
    v_count_transactions := v_count_transactions + case when v_source_transaction_ref is not null then 1 else 0 end + case when v_destination_transaction_ref is not null then 1 else 0 end;
  end loop;

  if exists (
    select 1 from jsonb_array_elements(p_backup->'transactions') as elements(value)
    where value->>'type'='transfer' and not exists (select 1 from public.backup_record_maps where user_id=v_user and entity_type='transaction' and source_ref=value->>'ref')
  ) then
    raise exception using errcode = '22023', message = 'Every transfer ledger leg must belong to an imported transfer.';
  end if;

  for v_item in select value from jsonb_array_elements(p_backup->'budgets') as elements(value) loop
    v_ref := v_item->>'ref';
    if v_ref !~ '^budget_[A-Za-z0-9_-]{1,150}$' or not exists (select 1 from public.backup_record_maps where user_id=v_user and entity_type='category' and source_ref=v_item->>'category_ref') then raise exception using errcode = '22023', message = 'Budget relationship is invalid.'; end if;
    v_fp := encode(extensions.digest(v_item::text, 'sha256'), 'hex');
    select m.target_id, m.source_fingerprint into v_target_id, v_source_fp from public.backup_record_maps m where m.user_id=v_user and m.entity_type='budget' and m.source_ref=v_ref;
    if v_target_id is not null then
      if v_source_fp <> v_fp then raise exception using errcode = '22023', message = 'Budget reference does not match its prior import.'; end if;
      continue;
    end if;
    if v_item->>'period_type' <> 'monthly' or v_item->>'currency' not in ('USD','EUR','GBP','IDR') or coalesce(v_item->>'limit_amount','') !~ '^[0-9]+(\.[0-9]{1,4})?$' then raise exception using errcode = '22023', message = 'Budget data is invalid.'; end if;
    v_limit_amount := (v_item->>'limit_amount')::numeric; v_period_start := (v_item->>'period_start')::date;
    if v_limit_amount <= 0 or v_limit_amount > 9999999999999999.9999 or v_period_start <> date_trunc('month', v_period_start::timestamp)::date then raise exception using errcode = '22023', message = 'Budget amount or period is invalid.'; end if;
    select target_id into v_category_id from public.backup_record_maps where user_id=v_user and entity_type='category' and source_ref=v_item->>'category_ref';
    v_archived_at := nullif(v_item->>'archived_at','')::timestamptz;
    select id into v_target_id from public.budgets where user_id=v_user and category_id=v_category_id and period_type='monthly' and period_start=v_period_start and archived_at is null and v_archived_at is null limit 1;
    if v_target_id is null then
      insert into public.budgets (user_id, category_id, period_type, period_start, limit_amount, currency, notes, archived_at)
      values (v_user, v_category_id, 'monthly', v_period_start, v_limit_amount, (v_item->>'currency')::public.currency_code, nullif(v_item->>'notes',''), v_archived_at)
      returning id into v_target_id;
      v_count_budgets := v_count_budgets + 1;
    end if;
    insert into public.backup_record_maps(user_id, entity_type, source_ref, source_fingerprint, target_id) values (v_user, 'budget', v_ref, v_fp, v_target_id);
  end loop;

  for v_item in select value from jsonb_array_elements(p_backup->'recurring_rules') as elements(value) loop
    v_ref := v_item->>'ref';
    if v_ref !~ '^recurring_rule_[A-Za-z0-9_-]{1,150}$' or not exists (select 1 from public.backup_record_maps where user_id=v_user and entity_type='wallet' and source_ref=v_item->>'wallet_ref') or not exists (select 1 from public.backup_record_maps where user_id=v_user and entity_type='category' and source_ref=v_item->>'category_ref') then raise exception using errcode = '22023', message = 'Recurring rule relationship is invalid.'; end if;
    v_fp := encode(extensions.digest(v_item::text, 'sha256'), 'hex');
    select m.target_id, m.source_fingerprint into v_target_id, v_source_fp from public.backup_record_maps m where m.user_id=v_user and m.entity_type='recurring_rule' and m.source_ref=v_ref;
    if v_target_id is not null then
      if v_source_fp <> v_fp then raise exception using errcode = '22023', message = 'Recurring rule reference does not match its prior import.'; end if;
      continue;
    end if;
    if v_item->>'type' not in ('income','expense') or v_item->>'frequency' not in ('weekly','monthly') or coalesce(v_item->>'amount','') !~ '^[0-9]+(\.[0-9]{1,4})?$' or coalesce(v_item->>'active','') not in ('true','false') then raise exception using errcode = '22023', message = 'Recurring rule data is invalid.'; end if;
    v_amount := (v_item->>'amount')::numeric; v_start_date := (v_item->>'start_date')::date; v_end_date := nullif(v_item->>'end_date','')::date; v_next_due_at := (v_item->>'next_due_at')::timestamptz; v_local_time := (v_item->>'local_time')::time;
    if v_amount <= 0 or v_amount > 9999999999999999.9999 or (v_end_date is not null and v_end_date < v_start_date) then raise exception using errcode = '22023', message = 'Recurring rule amount or dates are invalid.'; end if;
    select target_id into v_wallet_id from public.backup_record_maps where user_id=v_user and entity_type='wallet' and source_ref=v_item->>'wallet_ref';
    select target_id into v_category_id from public.backup_record_maps where user_id=v_user and entity_type='category' and source_ref=v_item->>'category_ref';
    v_archived_at := nullif(v_item->>'archived_at','')::timestamptz; v_active := (v_item->>'active')::boolean and v_archived_at is null;
    insert into public.recurring_transaction_rules (user_id, type, wallet_id, category_id, amount, note, frequency, start_date, end_date, next_due_at, local_time, timezone, active, archived_at)
    values (v_user, (v_item->>'type')::public.category_type, v_wallet_id, v_category_id, v_amount, nullif(v_item->>'note',''), (v_item->>'frequency')::public.recurring_frequency, v_start_date, v_end_date, v_next_due_at, v_local_time, coalesce(nullif(v_item->>'timezone',''), 'UTC'), v_active, v_archived_at)
    returning id into v_target_id;
    if v_active then
      update public.recurring_transaction_rules r set next_due_at = public.recurring_next(r) where r.id=v_target_id and r.next_due_at <= now();
      while exists (select 1 from public.recurring_transaction_rules where id=v_target_id and next_due_at <= now() and active) loop
        update public.recurring_transaction_rules r set next_due_at = public.recurring_next(r) where r.id=v_target_id;
      end loop;
      update public.recurring_transaction_rules set active=false where id=v_target_id and end_date is not null and (next_due_at at time zone timezone)::date > end_date;
    end if;
    insert into public.backup_record_maps(user_id, entity_type, source_ref, source_fingerprint, target_id) values (v_user, 'recurring_rule', v_ref, v_fp, v_target_id);
    v_count_recurring := v_count_recurring + 1;
  end loop;

  v_summary := jsonb_build_object(
    'format', 'finexy-backup', 'version', 1, 'mode', v_mode, 'already_imported', false,
    'wallets', v_count_wallets, 'categories', v_count_categories,
    'category_rules', v_count_category_rules, 'transactions', v_count_transactions,
    'transfers', v_count_transfers, 'budgets', v_count_budgets,
    'recurring_rules', v_count_recurring
  );
  insert into public.backup_imports (user_id, backup_key, backup_version, mode, summary)
  values (v_user, v_backup_key, 1, v_mode, v_summary);
  return v_summary;
end;
$$;

revoke all on function public.finexy_import_backup(jsonb, text) from public, anon;
grant execute on function public.finexy_import_backup(jsonb, text) to authenticated;

commit;
