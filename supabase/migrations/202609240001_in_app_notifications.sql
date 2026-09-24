begin;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (char_length(trim(type)) > 0),
  title text not null check (char_length(trim(title)) > 0),
  message text not null check (char_length(trim(message)) > 0),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  read_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  dedupe_key text null,
  constraint notifications_user_dedupe_unique unique (user_id, dedupe_key)
);

create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

create policy notifications_owner_select on public.notifications
  for select using (auth.uid() = user_id);

create policy notifications_owner_update on public.notifications
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy notifications_owner_delete on public.notifications
  for delete using (auth.uid() = user_id);

revoke insert on public.notifications from anon, authenticated;
grant select, update, delete on public.notifications to authenticated;

alter publication supabase_realtime add table public.notifications;

-- Seed default in-app preferences for existing profiles
insert into public.notification_preferences (user_id, preference_key, channel, enabled)
select id, 'budget_near_limit', 'in_app', true
from public.profiles
on conflict (user_id, preference_key, channel) do nothing;

insert into public.notification_preferences (user_id, preference_key, channel, enabled)
select id, 'budget_over_limit', 'in_app', true
from public.profiles
on conflict (user_id, preference_key, channel) do nothing;

create or replace function public.queue_telegram_budget_notification()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_budget public.budgets%rowtype;
  v_integration public.user_integrations%rowtype;
  v_spent numeric;
  v_progress numeric;
  v_threshold text;
  v_category_name text;
  v_period_start date;
  v_in_app_enabled boolean;
  v_telegram_enabled boolean;
begin
  if new.type <> 'expense' or new.status <> 'completed' or new.transfer_id is not null or new.deleted_at is not null then
    return new;
  end if;

  v_period_start := date_trunc('month', new.occurred_at at time zone 'UTC')::date;
  select * into v_budget
    from public.budgets
   where user_id = new.user_id and category_id = new.category_id and currency = new.currency
     and period_type = 'monthly' and period_start = v_period_start and archived_at is null;
  if not found then return new; end if;

  select coalesce(sum(amount), 0) into v_spent
    from public.transactions
   where user_id = new.user_id and category_id = new.category_id and currency = new.currency
     and type = 'expense' and status = 'completed' and transfer_id is null and deleted_at is null
     and occurred_at >= v_period_start::timestamptz
     and occurred_at < (v_period_start + interval '1 month')::timestamptz;
  v_progress := v_spent / v_budget.limit_amount;
  if v_progress >= 1 then v_threshold := 'budget_over_limit';
  elsif v_progress >= 0.8 then v_threshold := 'budget_near_limit';
  else return new;
  end if;

  select name into v_category_name from public.categories where id = new.category_id and user_id = new.user_id;

  -- 1. Telegram delivery
  select * into v_integration from public.user_integrations
   where user_id = new.user_id and provider = 'telegram' and status = 'active' and deleted_at is null;
  if found then
    select enabled into v_telegram_enabled from public.notification_preferences
     where user_id = new.user_id and channel = 'telegram' and preference_key = v_threshold;
    if coalesce(v_telegram_enabled, false) then
      insert into public.telegram_budget_notification_events (user_id, integration_id, budget_id, period_start, threshold, payload)
      values (new.user_id, v_integration.id, v_budget.id, v_period_start, v_threshold,
        jsonb_build_object('category', coalesce(v_category_name, 'Kategori'), 'spent', v_spent, 'limit', v_budget.limit_amount, 'currency', new.currency::text, 'progress', round(v_progress * 100, 1)))
      on conflict (budget_id, period_start, threshold) where budget_id is not null do nothing;
    end if;
  end if;

  -- 2. In-app delivery
  select enabled into v_in_app_enabled from public.notification_preferences
   where user_id = new.user_id and channel = 'in_app' and preference_key = v_threshold;
  if coalesce(v_in_app_enabled, true) then
    insert into public.notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      dedupe_key
    ) values (
      new.user_id,
      v_threshold,
      case when v_threshold = 'budget_over_limit' then 'Budget exceeded' else 'Budget almost reached' end,
      case
        when v_threshold = 'budget_over_limit'
          then format('%s has exceeded its %s budget (%s%%).', coalesce(v_category_name, 'Category'), to_char(v_period_start, 'FMMonth'), round(v_progress * 100)::text)
        else
          format('%s has reached %s%% of its %s budget.', coalesce(v_category_name, 'Category'), round(v_progress * 100)::text, to_char(v_period_start, 'FMMonth'))
      end,
      jsonb_build_object(
        'budget_id', v_budget.id,
        'category_id', new.category_id,
        'category_name', coalesce(v_category_name, 'Category'),
        'spent', v_spent,
        'limit', v_budget.limit_amount,
        'currency', new.currency::text,
        'progress', round(v_progress * 100, 1),
        'period_start', v_period_start
      ),
      format('%s:%s:%s', v_budget.id, v_period_start, v_threshold)
    )
    on conflict (user_id, dedupe_key) do nothing;
  end if;

  return new;
end;
$$;

commit;
