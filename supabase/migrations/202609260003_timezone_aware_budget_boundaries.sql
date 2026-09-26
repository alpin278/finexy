begin;

-- Keep budget threshold notifications aligned with the user's financial
-- calendar. The stored occurred_at value remains an absolute timestamptz;
-- only the month boundary used for evaluation is localized.
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
  v_timezone text;
  v_period_start_at timestamptz;
  v_period_end_at timestamptz;
begin
  if p_limit_amount is null or p_limit_amount <= 0 then
    return;
  end if;

  v_timezone := public.recurring_tz(p_user_id);
  v_period_start_at := p_period_start::timestamp at time zone v_timezone;
  v_period_end_at := (p_period_start + interval '1 month')::timestamp at time zone v_timezone;

  select coalesce(sum(amount), 0) into v_spent
    from public.transactions
   where user_id = p_user_id
     and category_id = p_category_id
     and currency = p_currency
     and type = 'expense'
     and status = 'completed'
     and transfer_id is null
     and deleted_at is null
     and occurred_at >= v_period_start_at
     and occurred_at < v_period_end_at;

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
        user_id, integration_id, budget_id, period_start, threshold, payload, next_retry_at
      ) values (
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

  select enabled into v_in_app_enabled
    from public.notification_preferences
   where user_id = p_user_id
     and channel = 'in_app'
     and preference_key = v_threshold;

  if coalesce(v_in_app_enabled, true) then
    insert into public.notifications (
      user_id, type, title, message, metadata, dedupe_key
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

create or replace function public.queue_telegram_budget_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_budget public.budgets%rowtype;
  v_period_start date;
  v_timezone text;
begin
  if new.type <> 'expense' or new.status <> 'completed' or new.transfer_id is not null or new.deleted_at is not null then
    return new;
  end if;

  v_timezone := public.recurring_tz(new.user_id);
  v_period_start := date_trunc('month', new.occurred_at at time zone v_timezone)::date;

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

commit;
