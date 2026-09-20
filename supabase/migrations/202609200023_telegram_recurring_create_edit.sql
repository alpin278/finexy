begin;

-- Phase 25B.1: session-scoped Telegram create/edit flow.  Database validation is
-- deliberately repeated at confirmation time; callback values are only references.
create or replace function public.telegram_recurring_session(p_telegram_user_id text,p_telegram_chat_id text,p_action text,p_value text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare i public.user_integrations%rowtype; s public.integration_sessions%rowtype; r public.recurring_transaction_rules%rowtype;
  w public.wallets%rowtype; c public.categories%rowtype; refs jsonb; n text:=coalesce(p_value,'');
  v_date date; v_day int; v_time time; v_amount numeric; v_note text; v_ref text; v_rule_id uuid;
begin
  if p_telegram_user_id !~ '^[0-9]+$' or p_telegram_chat_id !~ '^-?[0-9]+$' then return jsonb_build_object('status','unlinked'); end if;
  select * into i from public.user_integrations where provider='telegram' and external_user_id=p_telegram_user_id and external_chat_id=p_telegram_chat_id and status='active' and deleted_at is null;
  if not found then return jsonb_build_object('status','unlinked'); end if;

  if p_action='list' then
    select coalesce(jsonb_object_agg(rn,id),'{}'::jsonb) into refs from (select row_number() over(order by next_due_at)::text rn,id from public.recurring_transaction_rules where user_id=i.user_id and archived_at is null) q;
    update public.integration_sessions set status='canceled',deleted_at=now() where integration_id=i.id and flow='telegram_recurring' and status='active' and deleted_at is null;
    insert into public.integration_sessions(user_id,integration_id,flow,step,payload,expires_at) values(i.user_id,i.id,'telegram_recurring','list',jsonb_build_object('rules',refs),now()+interval '30 minutes') returning * into s;
    return jsonb_build_object('status','linked','step','list','rules',coalesce((select jsonb_agg(jsonb_build_object('ref',q.rn,'type',q.type::text,'amount',q.amount,'currency',q.currency,'wallet',q.wallet,'category',q.category,'frequency',q.frequency::text,'next_due',q.next_due_at,'active',q.active)) from (select row_number() over(order by x.next_due_at)::text rn,x.type,x.amount,w.currency,w.name wallet,c.name category,x.frequency,x.next_due_at,x.active from public.recurring_transaction_rules x join public.wallets w on w.id=x.wallet_id join public.categories c on c.id=x.category_id where x.user_id=i.user_id and x.archived_at is null) q),'[]'::jsonb));
  end if;

  select * into s from public.integration_sessions where integration_id=i.id and flow='telegram_recurring' and status='active' and deleted_at is null and expires_at>now() for update;
  if not found then return jsonb_build_object('status','linked','step','none'); end if;
  if p_action='cancel' then update public.integration_sessions set status='canceled',deleted_at=now() where id=s.id; return jsonb_build_object('status','linked','step','canceled'); end if;

  if p_action in ('start_expense','start_income') then
    update public.integration_sessions set step='wallet',payload=jsonb_build_object('mode','create','type',case when p_action='start_expense' then 'expense' else 'income' end),expires_at=now()+interval '30 minutes' where id=s.id returning * into s;
  elsif p_action='edit' then
    v_rule_id:=nullif(s.payload->'rules'->>n,'')::uuid;
    select * into r from public.recurring_transaction_rules where id=v_rule_id and user_id=i.user_id and archived_at is null;
    if not found then return jsonb_build_object('status','linked','step','list','error','Pilihan rutin tidak tersedia.'); end if;
    update public.integration_sessions set step='edit_field',payload=jsonb_build_object('mode','edit','rule_id',r.id::text,'type',r.type::text,'wallet_id',r.wallet_id::text,'category_id',r.category_id::text,'amount',r.amount,'note',r.note,'frequency',r.frequency::text,'start_date',r.start_date::text,'local_time',r.local_time::text),expires_at=now()+interval '30 minutes' where id=s.id returning * into s;
  elsif p_action='edit_field' then
    if s.step<>'edit_field' or n not in ('wallet','category','amount','frequency','schedule','note') then return jsonb_build_object('status','linked','step',s.step,'error','Pilihan edit tidak valid.'); end if;
    update public.integration_sessions set step=case when n in ('wallet','category','frequency','schedule') then n else n end,payload=s.payload||jsonb_build_object('editing',n),expires_at=now()+interval '30 minutes' where id=s.id returning * into s;
  elsif p_action='wallet' then
    if s.step<>'wallet' then return jsonb_build_object('status','linked','step',s.step,'error','Pilihan wallet tidak aktif.'); end if;
    select * into w from public.wallets where id=nullif(s.payload->'wallets'->>n,'')::uuid and user_id=i.user_id and status='active' and deleted_at is null;
    if not found then return jsonb_build_object('status','linked','step','wallet','error','Wallet tidak tersedia.'); end if;
    update public.integration_sessions set step=case when s.payload->>'mode'='edit' then 'edit_field' else 'category' end,payload=s.payload||jsonb_build_object('wallet_id',w.id::text,'wallet_name',w.name,'currency',w.currency::text)-'wallets',expires_at=now()+interval '30 minutes' where id=s.id returning * into s;
  elsif p_action='category' then
    if s.step<>'category' then return jsonb_build_object('status','linked','step',s.step,'error','Pilihan kategori tidak aktif.'); end if;
    select * into c from public.categories where id=nullif(s.payload->'categories'->>n,'')::uuid and user_id=i.user_id and type::text=s.payload->>'type' and status='active' and archived_at is null;
    if not found then return jsonb_build_object('status','linked','step','category','error','Kategori tidak tersedia.'); end if;
    update public.integration_sessions set step=case when s.payload->>'mode'='edit' then 'edit_field' else 'amount' end,payload=s.payload||jsonb_build_object('category_id',c.id::text,'category_name',c.name)-'categories',expires_at=now()+interval '30 minutes' where id=s.id returning * into s;
  elsif p_action='amount' then
    if s.step<>'amount' or n !~ '^[0-9]+(\.[0-9]{1,4})?$' or n::numeric<=0 then return jsonb_build_object('status','linked','step','amount','error','Masukkan nominal positif dengan maksimal 4 angka desimal.'); end if;
    update public.integration_sessions set step=case when s.payload->>'mode'='edit' then 'edit_field' else 'frequency' end,payload=s.payload||jsonb_build_object('amount',n::numeric),expires_at=now()+interval '30 minutes' where id=s.id returning * into s;
  elsif p_action='frequency' then
    if s.step<>'frequency' or n not in ('weekly','monthly') then return jsonb_build_object('status','linked','step','frequency','error','Pilih frekuensi yang tersedia.'); end if;
    update public.integration_sessions set step='schedule_day',payload=s.payload||jsonb_build_object('frequency',n),expires_at=now()+interval '30 minutes' where id=s.id returning * into s;
  elsif p_action='weekday' then
    if s.step<>'schedule_day' or n !~ '^[1-7]$' then return jsonb_build_object('status','linked','step','schedule_day','error','Pilih hari yang tersedia.'); end if;
    v_date:=(now() at time zone public.recurring_tz(i.user_id))::date + ((n::int-extract(isodow from (now() at time zone public.recurring_tz(i.user_id))::date)::int+7)%7);
    update public.integration_sessions set step='schedule_time',payload=s.payload||jsonb_build_object('start_date',v_date::text),expires_at=now()+interval '30 minutes' where id=s.id returning * into s;
  elsif p_action='monthday' then
    if s.step<>'schedule_day' or n !~ '^([1-9]|[12][0-9]|3[01])$' then return jsonb_build_object('status','linked','step','schedule_day','error','Pilih tanggal 1 sampai 31.'); end if;
    v_day:=n::int; v_date:=date_trunc('month',(now() at time zone public.recurring_tz(i.user_id))::date)::date + least(v_day,extract(day from (date_trunc('month',(now() at time zone public.recurring_tz(i.user_id))::date)+interval '1 month - 1 day'))::int)-1;
    if v_date < (now() at time zone public.recurring_tz(i.user_id))::date then v_date:=date_trunc('month',v_date+interval '1 month')::date+least(v_day,extract(day from (date_trunc('month',v_date+interval '1 month')+interval '1 month - 1 day'))::int)-1; end if;
    update public.integration_sessions set step='schedule_time',payload=s.payload||jsonb_build_object('start_date',v_date::text),expires_at=now()+interval '30 minutes' where id=s.id returning * into s;
  elsif p_action='time' then
    if s.step<>'schedule_time' or n !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then return jsonb_build_object('status','linked','step','schedule_time','error','Masukkan waktu 00:00 sampai 23:59.'); end if;
    update public.integration_sessions set step=case when s.payload->>'mode'='edit' then 'edit_field' else 'note' end,payload=s.payload||jsonb_build_object('local_time',n),expires_at=now()+interval '30 minutes' where id=s.id returning * into s;
  elsif p_action in ('note','skip_note') then
    if s.step<>'note' then return jsonb_build_object('status','linked','step',s.step,'error','Langkah catatan tidak aktif.'); end if;
    v_note:=case when p_action='skip_note' then null else nullif(trim(n),'') end; if v_note is not null and char_length(v_note)>500 then return jsonb_build_object('status','linked','step','note','error','Catatan maksimal 500 karakter.'); end if;
    update public.integration_sessions set step=case when s.payload->>'mode'='edit' then 'edit_field' else 'confirm' end,payload=s.payload||jsonb_build_object('note',v_note),expires_at=now()+interval '30 minutes' where id=s.id returning * into s;
  elsif p_action='review' then
    if s.step<>'edit_field' then return jsonb_build_object('status','linked','step',s.step,'error','Sesi edit tidak aktif.'); end if;
    update public.integration_sessions set step='confirm',expires_at=now()+interval '30 minutes' where id=s.id returning * into s;
  elsif p_action='confirm' then
    if s.step<>'confirm' then return jsonb_build_object('status','linked','step',s.step,'error','Konfirmasi tidak aktif atau sudah diproses.'); end if;
    select * into w from public.wallets where id=(s.payload->>'wallet_id')::uuid and user_id=i.user_id and status='active' and deleted_at is null;
    select * into c from public.categories where id=(s.payload->>'category_id')::uuid and user_id=i.user_id and type::text=s.payload->>'type' and status='active' and archived_at is null;
    if not found or w.id is null or c.id is null or coalesce((s.payload->>'amount')::numeric,0)<=0 or (s.payload->>'amount')::numeric<>round((s.payload->>'amount')::numeric,4) or s.payload->>'frequency' not in ('weekly','monthly') or s.payload->>'start_date' is null or s.payload->>'local_time' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then return jsonb_build_object('status','linked','step','confirm','error','Data jadwal tidak lagi valid. Periksa kembali pilihan Anda.'); end if;
    if s.payload->>'mode'='create' then insert into public.recurring_transaction_rules(user_id,type,wallet_id,category_id,amount,note,frequency,start_date,next_due_at,local_time,timezone) values(i.user_id,(s.payload->>'type')::public.category_type,w.id,c.id,(s.payload->>'amount')::numeric,nullif(s.payload->>'note',''),(s.payload->>'frequency')::public.recurring_frequency,(s.payload->>'start_date')::date,public.recurring_due((s.payload->>'start_date')::date,(s.payload->>'local_time')::time,public.recurring_tz(i.user_id)),(s.payload->>'local_time')::time,public.recurring_tz(i.user_id)) returning id into v_rule_id;
    else v_rule_id:=(s.payload->>'rule_id')::uuid; update public.recurring_transaction_rules set type=(s.payload->>'type')::public.category_type,wallet_id=w.id,category_id=c.id,amount=(s.payload->>'amount')::numeric,note=nullif(s.payload->>'note',''),frequency=(s.payload->>'frequency')::public.recurring_frequency,start_date=(s.payload->>'start_date')::date,local_time=(s.payload->>'local_time')::time,timezone=public.recurring_tz(i.user_id),next_due_at=public.recurring_due(greatest((s.payload->>'start_date')::date,(now() at time zone public.recurring_tz(i.user_id))::date),(s.payload->>'local_time')::time,public.recurring_tz(i.user_id)),last_error=null where id=v_rule_id and user_id=i.user_id and archived_at is null; if not found then return jsonb_build_object('status','linked','step','confirm','error','Jadwal rutin tidak tersedia.'); end if; select * into r from public.recurring_transaction_rules where id=v_rule_id for update; while r.next_due_at<=now() loop r.next_due_at:=public.recurring_next(r); end loop; update public.recurring_transaction_rules set next_due_at=r.next_due_at where id=r.id; end if;
    update public.integration_sessions set status='completed',payload=s.payload||jsonb_build_object('rule_id',v_rule_id::text) where id=s.id;
    return jsonb_build_object('status','linked','step','completed','mode',s.payload->>'mode','type',s.payload->>'type','wallet',w.name,'category',c.name,'currency',w.currency::text,'amount',s.payload->>'amount');
  elsif p_action='back' then
    if s.step='category' then update public.integration_sessions set step='wallet',payload=s.payload-'wallet_id'-'wallet_name'-'currency' where id=s.id returning * into s;
    elsif s.step='amount' then update public.integration_sessions set step='category',payload=s.payload-'category_id'-'category_name' where id=s.id returning * into s;
    elsif s.step in ('frequency','schedule_day','schedule_time','note') then update public.integration_sessions set step=case when s.step='frequency' then 'amount' when s.step='schedule_day' then 'frequency' when s.step='schedule_time' then 'schedule_day' else 'schedule_time' end where id=s.id returning * into s;
    elsif s.step='confirm' then update public.integration_sessions set step=case when s.payload->>'mode'='edit' then 'edit_field' else 'note' end where id=s.id returning * into s; end if;
  end if;

  select * into s from public.integration_sessions where id=s.id;
  if s.step='wallet' then select coalesce(jsonb_object_agg(rn,id),'{}'::jsonb) into refs from (select row_number()over(order by name)::text rn,id from public.wallets where user_id=i.user_id and status='active' and deleted_at is null)q; update public.integration_sessions set payload=s.payload||jsonb_build_object('wallets',refs) where id=s.id returning * into s; end if;
  if s.step='category' then select coalesce(jsonb_object_agg(rn,id),'{}'::jsonb) into refs from (select row_number()over(order by name)::text rn,id from public.categories where user_id=i.user_id and type::text=s.payload->>'type' and status='active' and archived_at is null)q; update public.integration_sessions set payload=s.payload||jsonb_build_object('categories',refs) where id=s.id returning * into s; end if;
  return jsonb_build_object('status','linked','step',s.step,'mode',s.payload->>'mode','type',s.payload->>'type','wallet',s.payload->>'wallet_name','category',s.payload->>'category_name','currency',s.payload->>'currency','amount',s.payload->>'amount','note',s.payload->>'note','frequency',s.payload->>'frequency','start_date',s.payload->>'start_date','local_time',s.payload->>'local_time','timezone',public.recurring_tz(i.user_id),'wallets',coalesce((select jsonb_agg(jsonb_build_object('ref',rn,'name',name,'currency',currency) order by name) from (select row_number()over(order by name)::text rn,name,currency::text currency from public.wallets where user_id=i.user_id and status='active' and deleted_at is null)q),'[]'::jsonb),'categories',coalesce((select jsonb_agg(jsonb_build_object('ref',rn,'name',name) order by name) from (select row_number()over(order by name)::text rn,name from public.categories where user_id=i.user_id and type::text=s.payload->>'type' and status='active' and archived_at is null)q),'[]'::jsonb));
end $$;
revoke all on function public.telegram_recurring_session(text,text,text,text) from public,anon,authenticated;
grant execute on function public.telegram_recurring_session(text,text,text,text) to service_role;
commit;
