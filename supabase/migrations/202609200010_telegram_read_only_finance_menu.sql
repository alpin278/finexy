begin;

create or replace function public.get_telegram_finance_snapshot(p_telegram_user_id text, p_telegram_chat_id text, p_action text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user_id uuid; v_period_start date := date_trunc('month', timezone('utc', now()))::date;
begin
  if p_telegram_user_id !~ '^[0-9]+$' or p_telegram_chat_id !~ '^-?[0-9]+$' or p_action not in ('menu', 'wallets', 'budgets', 'transactions') then return jsonb_build_object('status', 'unlinked'); end if;
  select user_id into v_user_id from public.user_integrations where provider = 'telegram' and external_user_id = p_telegram_user_id and external_chat_id = p_telegram_chat_id and status = 'active' and deleted_at is null;
  if v_user_id is null then return jsonb_build_object('status', 'unlinked'); end if;
  if p_action = 'wallets' then
    return jsonb_build_object('status', 'linked', 'wallets', coalesce((select jsonb_agg(jsonb_build_object('name', q.name, 'currency', q.currency, 'balance', q.balance) order by q.name) from (
      select w.name, w.currency, w.opening_balance + coalesce(sum(case when t.type = 'income' then t.amount when t.type = 'expense' then -t.amount when t.type = 'transfer' and t.transfer_leg = 'inbound' then t.amount when t.type = 'transfer' and t.transfer_leg = 'outbound' then -t.amount else 0 end), 0) as balance
      from public.wallets w left join public.transactions t on t.wallet_id = w.id and t.user_id = v_user_id and t.status = 'completed' and t.deleted_at is null
      where w.user_id = v_user_id and w.status = 'active' and w.deleted_at is null group by w.id, w.name, w.currency, w.opening_balance
    ) q), '[]'::jsonb));
  end if;
  if p_action = 'budgets' then
    return jsonb_build_object('status', 'linked', 'period_start', v_period_start, 'budgets', coalesce((select jsonb_agg(jsonb_build_object('category', q.category_name, 'currency', q.currency, 'spent', q.spent, 'limit', q.limit_amount, 'remaining', q.limit_amount - q.spent, 'progress', q.spent / q.limit_amount, 'status', case when q.spent >= q.limit_amount then 'over_budget' when q.spent >= q.limit_amount * 0.8 then 'near_limit' else 'on_track' end) order by q.category_name) from (
      select coalesce(c.name, 'Tanpa kategori') as category_name, b.currency, b.limit_amount, coalesce(sum(t.amount) filter (where t.type = 'expense' and t.status = 'completed' and t.deleted_at is null and t.transfer_id is null and t.currency = b.currency and t.occurred_at >= b.period_start and t.occurred_at < b.period_start + interval '1 month'), 0) as spent
      from public.budgets b join public.categories c on c.id = b.category_id and c.user_id = v_user_id left join public.transactions t on t.category_id = b.category_id and t.user_id = v_user_id
      where b.user_id = v_user_id and b.period_type = 'monthly' and b.period_start = v_period_start and b.archived_at is null group by b.id, c.name, b.currency, b.limit_amount
    ) q), '[]'::jsonb));
  end if;
  return jsonb_build_object('status', 'linked', 'transactions', coalesce((select jsonb_agg(jsonb_build_object('type', q.type, 'amount', q.amount, 'currency', q.currency, 'category', q.category_name, 'wallet', q.wallet_name, 'occurred_at', q.occurred_at) order by q.occurred_at desc) from (
    select t.type, t.amount, t.currency, case when t.type = 'transfer' then 'Transfer' else coalesce(c.name, 'Tanpa kategori') end as category_name, w.name as wallet_name, t.occurred_at
    from public.transactions t join public.wallets w on w.id = t.wallet_id and w.user_id = v_user_id left join public.categories c on c.id = t.category_id and c.user_id = v_user_id
    where t.user_id = v_user_id and t.deleted_at is null order by t.occurred_at desc limit 8
  ) q), '[]'::jsonb));
end;
$$;

revoke all on function public.get_telegram_finance_snapshot(text, text, text) from public, anon, authenticated;
grant execute on function public.get_telegram_finance_snapshot(text, text, text) to service_role;

commit;
