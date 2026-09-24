begin;

-- 1. Unified function to evaluate and queue budget threshold notifications
-- Can be called:
--   a) From transaction trigger (after completed expense insert/update)
--   b) From budget trigger (after limit_amount or active state update)
create or replace function public.evaluate_and_queue_budget_notification(
  p_user_id uuid,
  p_budget_id uuid,
  p_category_id uuid,
  p_currency public.currency_code,
  p_period_start date,
  p_limit_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_spent numeric;
  v_progress numeric;
  v_threshold text;
  v_category_name text;
  v_integration public.user_integrations%rowtype;
  v_in_app_enabled boolean;
  v_telegram_enabled boolean;
begin
  if p_limit_amount is null or p_limit_amount <= 0 then
    return;
  end if;

  -- Calculate current settled spending for this budget's category and period
  select coalesce(sum(amount), 0) into v_spent
    from public.transactions
   where user_id = p_user_id
     and category_id = p_category_id
     and currency = p_currency
     and type = 'expense'
     and status = 'completed'
     and transfer_id is null
     and deleted_at is null
     and occurred_at >= p_period_start::timestamptz
     and occurred_at < (p_period_start + interval '1 month')::timestamptz;

  v_progress := v_spent / p_limit_amount;
  if v_progress >= 1 then
    v_threshold := 'budget_over_limit';
  elsif v_progress >= 0.8 then
    v_threshold := 'budget_near_limit';
  else
    return;
  end if;

  select name into v_category_name
    from public.categories
   where id = p_category_id
     and user_id = p_user_id;

  -- 1. Telegram delivery
  select * into v_integration
    from public.user_integrations
   where user_id = p_user_id
     and provider = 'telegram'
     and status = 'active'
     and deleted_at is null;

  if found then
    select enabled into v_telegram_enabled
      from public.notification_preferences
     where user_id = p_user_id
       and channel = 'telegram'
       and preference_key = v_threshold;

    if coalesce(v_telegram_enabled, false) then
      insert into public.telegram_budget_notification_events (
        user_id,
        integration_id,
        budget_id,
        period_start,
        threshold,
        payload,
        next_retry_at
      )
      values (
        p_user_id,
        v_integration.id,
        p_budget_id,
        p_period_start,
        v_threshold,
        jsonb_build_object(
          'category', coalesce(v_category_name, 'Kategori'),
          'spent', v_spent,
          'limit', p_limit_amount,
          'currency', p_currency::text,
          'progress', round(v_progress * 100, 1)
        ),
        timezone('utc', now())
      )
      on conflict (budget_id, period_start, threshold)
      where budget_id is not null
      do nothing;
    end if;
  end if;

  -- 2. In-app delivery
  select enabled into v_in_app_enabled
    from public.notification_preferences
   where user_id = p_user_id
     and channel = 'in_app'
     and preference_key = v_threshold;

  if coalesce(v_in_app_enabled, true) then
    insert into public.notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      dedupe_key
    ) values (
      p_user_id,
      v_threshold,
      case when v_threshold = 'budget_over_limit' then 'Budget exceeded' else 'Budget almost reached' end,
      case
        when v_threshold = 'budget_over_limit'
          then format('%s has exceeded its %s budget (%s%%).', coalesce(v_category_name, 'Category'), to_char(p_period_start, 'FMMonth'), round(v_progress * 100)::text)
        else
          format('%s has reached %s%% of its %s budget.', coalesce(v_category_name, 'Category'), round(v_progress * 100)::text, to_char(p_period_start, 'FMMonth'))
      end,
      jsonb_build_object(
        'budget_id', p_budget_id,
        'category_id', p_category_id,
        'category_name', coalesce(v_category_name, 'Category'),
        'spent', v_spent,
        'limit', p_limit_amount,
        'currency', p_currency::text,
        'progress', round(v_progress * 100, 1),
        'period_start', p_period_start
      ),
      format('%s:%s:%s', p_budget_id, p_period_start, v_threshold)
    )
    on conflict (user_id, dedupe_key) do nothing;
  end if;
end;
$$;

-- 2. Re-point transaction trigger function to the unified evaluator
create or replace function public.queue_telegram_budget_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_budget public.budgets%rowtype;
  v_period_start date;
begin
  if new.type <> 'expense' or new.status <> 'completed' or new.transfer_id is not null or new.deleted_at is not null then
    return new;
  end if;

  v_period_start := date_trunc('month', new.occurred_at at time zone 'UTC')::date;

  select * into v_budget
    from public.budgets
   where user_id = new.user_id
     and category_id = new.category_id
     and currency = new.currency
     and period_type = 'monthly'
     and period_start = v_period_start
     and archived_at is null;

  if not found then
    return new;
  end if;

  perform public.evaluate_and_queue_budget_notification(
    new.user_id,
    v_budget.id,
    new.category_id,
    new.currency,
    v_period_start,
    v_budget.limit_amount
  );

  return new;
end;
$$;

-- 3. Trigger on budgets table when limit_amount changes
create or replace function public.queue_budget_notification_on_budget_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Only re-evaluate if the budget is active and limit_amount has changed
  if new.archived_at is not null then
    return new;
  end if;

  if TG_OP = 'UPDATE' and old.limit_amount is not distinct from new.limit_amount then
    return new;
  end if;

  perform public.evaluate_and_queue_budget_notification(
    new.user_id,
    new.id,
    new.category_id,
    new.currency,
    new.period_start,
    new.limit_amount
  );

  return new;
end;
$$;

drop trigger if exists queue_budget_notification_after_budget_change on public.budgets;
create trigger queue_budget_notification_after_budget_change
  after insert or update of limit_amount on public.budgets
  for each row execute function public.queue_budget_notification_on_budget_change();

grant execute on function public.evaluate_and_queue_budget_notification(uuid, uuid, uuid, public.currency_code, date, numeric) to authenticated;
grant execute on function public.queue_budget_notification_on_budget_change() to authenticated;

commit;
