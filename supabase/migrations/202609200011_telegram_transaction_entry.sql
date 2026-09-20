begin;

create or replace function public.telegram_transaction_session(p_telegram_user_id text, p_telegram_chat_id text, p_action text, p_value text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_integration public.user_integrations%rowtype; v_session public.integration_sessions%rowtype; v_wallet public.wallets%rowtype; v_category public.categories%rowtype; v_amount numeric; v_note text; v_transaction_id uuid; v_mode text; v_step text; v_payload jsonb;
begin
  if p_telegram_user_id !~ '^[0-9]+$' or p_telegram_chat_id !~ '^-?[0-9]+$' or p_action not in ('start_expense','start_income','wallet','category','amount','note','skip_note','confirm','cancel','back','state') then return jsonb_build_object('status','unlinked'); end if;
  select * into v_integration from public.user_integrations where provider = 'telegram' and external_user_id = p_telegram_user_id and external_chat_id = p_telegram_chat_id and status = 'active' and deleted_at is null;
  if not found then return jsonb_build_object('status','unlinked'); end if;
  if p_action in ('start_expense','start_income') then
    update public.integration_sessions set status = 'canceled', deleted_at = now() where integration_id = v_integration.id and flow = 'telegram_transaction' and status = 'active' and deleted_at is null;
    insert into public.integration_sessions (user_id,integration_id,flow,step,payload,expires_at) values (v_integration.user_id,v_integration.id,'telegram_transaction','wallet',jsonb_build_object('mode',case when p_action = 'start_expense' then 'expense' else 'income' end),now()+interval '30 minutes') returning * into v_session;
  else
    select * into v_session from public.integration_sessions where integration_id = v_integration.id and flow = 'telegram_transaction' and status = 'active' and deleted_at is null and expires_at > now() for update;
    if not found then return jsonb_build_object('status','linked','step','none'); end if;
    if p_action = 'cancel' then update public.integration_sessions set status = 'canceled', deleted_at = now() where id = v_session.id; return jsonb_build_object('status','linked','step','canceled'); end if;
    v_mode := v_session.payload->>'mode';
    if p_action = 'wallet' then
      if v_session.step <> 'wallet' or p_value !~ '^[0-9a-fA-F-]{36}$' then return jsonb_build_object('status','linked','step',v_session.step,'error','Pilihan wallet tidak valid.'); end if;
      select * into v_wallet from public.wallets where id = p_value::uuid and user_id = v_integration.user_id and status = 'active' and deleted_at is null;
      if not found then return jsonb_build_object('status','linked','step','wallet','error','Wallet tidak tersedia.'); end if;
      update public.integration_sessions set step = 'category', payload = v_session.payload || jsonb_build_object('wallet_id',v_wallet.id::text,'wallet_name',v_wallet.name,'currency',v_wallet.currency::text), expires_at = now()+interval '30 minutes' where id = v_session.id returning * into v_session;
    elsif p_action = 'category' then
      if v_session.step <> 'category' or p_value !~ '^[0-9a-fA-F-]{36}$' then return jsonb_build_object('status','linked','step',v_session.step,'error','Pilihan kategori tidak valid.'); end if;
      select * into v_category from public.categories where id = p_value::uuid and user_id = v_integration.user_id and type::text = v_mode and status = 'active' and archived_at is null;
      if not found then return jsonb_build_object('status','linked','step','category','error','Kategori tidak tersedia.'); end if;
      update public.integration_sessions set step = 'amount', payload = v_session.payload || jsonb_build_object('category_id',v_category.id::text,'category_name',v_category.name), expires_at = now()+interval '30 minutes' where id = v_session.id returning * into v_session;
    elsif p_action = 'amount' then
      if v_session.step <> 'amount' or coalesce(p_value,'') !~ '^[0-9]+(\.[0-9]{1,4})?$' then return jsonb_build_object('status','linked','step','amount','error','Masukkan nominal positif dengan maksimal 4 angka desimal.'); end if;
      v_amount := p_value::numeric; if v_amount <= 0 then return jsonb_build_object('status','linked','step','amount','error','Nominal harus lebih dari nol.'); end if;
      update public.integration_sessions set step = 'note', payload = v_session.payload || jsonb_build_object('amount',v_amount), expires_at = now()+interval '30 minutes' where id = v_session.id returning * into v_session;
    elsif p_action in ('note','skip_note') then
      if v_session.step <> 'note' then return jsonb_build_object('status','linked','step',v_session.step,'error','Langkah catatan tidak aktif.'); end if;
      v_note := case when p_action = 'skip_note' then null else nullif(trim(coalesce(p_value,'')),'') end;
      if v_note is not null and char_length(v_note) > 500 then return jsonb_build_object('status','linked','step','note','error','Catatan maksimal 500 karakter.'); end if;
      update public.integration_sessions set step = 'confirm', payload = v_session.payload || jsonb_build_object('note',v_note), expires_at = now()+interval '30 minutes' where id = v_session.id returning * into v_session;
    elsif p_action = 'back' then
      if v_session.step = 'category' then update public.integration_sessions set step='wallet', payload = v_session.payload - 'wallet_id' - 'wallet_name' - 'currency' where id=v_session.id returning * into v_session;
      elsif v_session.step = 'amount' then update public.integration_sessions set step='category', payload = v_session.payload - 'category_id' - 'category_name' where id=v_session.id returning * into v_session;
      elsif v_session.step = 'note' then update public.integration_sessions set step='amount', payload = v_session.payload - 'amount' where id=v_session.id returning * into v_session;
      elsif v_session.step = 'confirm' then update public.integration_sessions set step='note', payload = v_session.payload - 'note' where id=v_session.id returning * into v_session; end if;
    elsif p_action = 'confirm' then
      if v_session.step <> 'confirm' then return jsonb_build_object('status','linked','step',v_session.step,'error','Konfirmasi tidak aktif.'); end if;
      select * into v_wallet from public.wallets where id = (v_session.payload->>'wallet_id')::uuid and user_id = v_integration.user_id and status='active' and deleted_at is null;
      select * into v_category from public.categories where id = (v_session.payload->>'category_id')::uuid and user_id = v_integration.user_id and type::text = v_mode and status='active' and archived_at is null;
      if not found or v_wallet.id is null then return jsonb_build_object('status','linked','step','confirm','error','Wallet atau kategori tidak lagi tersedia.'); end if;
      insert into public.transactions (user_id,wallet_id,category_id,type,amount,currency,description,note,occurred_at,status,source,idempotency_key) values (v_integration.user_id,v_wallet.id,v_category.id,v_mode::public.transaction_type,(v_session.payload->>'amount')::numeric,v_wallet.currency,'Pencatatan Telegram',nullif(v_session.payload->>'note',''),now(),'completed','telegram','telegram:transaction:'||v_session.id::text) on conflict (user_id,source,idempotency_key) where deleted_at is null do nothing returning id into v_transaction_id;
      if v_transaction_id is null then select id into v_transaction_id from public.transactions where user_id=v_integration.user_id and source='telegram' and idempotency_key='telegram:transaction:'||v_session.id::text and deleted_at is null; end if;
      update public.integration_sessions set status='completed', payload=v_session.payload || jsonb_build_object('transaction_id',v_transaction_id::text) where id=v_session.id;
      return jsonb_build_object('status','linked','step','completed','transaction_id',v_transaction_id::text,'mode',v_mode,'wallet_name',v_wallet.name,'category_name',v_category.name,'amount',v_session.payload->>'amount','currency',v_wallet.currency::text);
    end if;
  end if;
  select * into v_session from public.integration_sessions where integration_id=v_integration.id and flow='telegram_transaction' and status='active' and deleted_at is null;
  if not found then return jsonb_build_object('status','linked','step','none'); end if;
  return jsonb_build_object('status','linked','step',v_session.step,'mode',v_session.payload->>'mode','wallet_name',v_session.payload->>'wallet_name','category_name',v_session.payload->>'category_name','amount',v_session.payload->>'amount','currency',v_session.payload->>'currency','note',v_session.payload->>'note','wallets',coalesce((select jsonb_agg(jsonb_build_object('id',id::text,'name',name,'currency',currency::text) order by name) from public.wallets where user_id=v_integration.user_id and status='active' and deleted_at is null),'[]'::jsonb),'categories',coalesce((select jsonb_agg(jsonb_build_object('id',id::text,'name',name) order by name) from public.categories where user_id=v_integration.user_id and type::text=v_session.payload->>'mode' and status='active' and archived_at is null),'[]'::jsonb));
end;
$$;
revoke all on function public.telegram_transaction_session(text,text,text,text) from public, anon, authenticated;
grant execute on function public.telegram_transaction_session(text,text,text,text) to service_role;
commit;