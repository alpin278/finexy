begin;

create table public.telegram_budget_notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  integration_id uuid not null references public.user_integrations(id) on delete cascade,
  budget_id uuid not null references public.budgets(id) on delete cascade,
  period_start date not null,
  threshold text not null check (threshold in ('budget_near_limit', 'budget_over_limit')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'sending', 'delivered')),
  attempts integer not null default 0 check (attempts >= 0),
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint telegram_budget_notification_events_unique unique (budget_id, period_start, threshold)
);

create index telegram_budget_notification_events_pending_idx
  on public.telegram_budget_notification_events (integration_id, status, created_at)
  where status in ('pending', 'sending');

create trigger telegram_budget_notification_events_set_updated_at
before update on public.telegram_budget_notification_events
for each row execute function public.set_updated_at();

alter table public.telegram_budget_notification_events enable row level security;

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

  select * into v_integration from public.user_integrations
   where user_id = new.user_id and provider = 'telegram' and status = 'active' and deleted_at is null;
  if not found then return new; end if;
  if not exists (
    select 1 from public.notification_preferences
     where user_id = new.user_id and channel = 'telegram' and preference_key = v_threshold and enabled
  ) then return new; end if;

  select name into v_category_name from public.categories where id = new.category_id and user_id = new.user_id;
  insert into public.telegram_budget_notification_events (user_id, integration_id, budget_id, period_start, threshold, payload)
  values (new.user_id, v_integration.id, v_budget.id, v_period_start, v_threshold,
    jsonb_build_object('category', coalesce(v_category_name, 'Kategori'), 'spent', v_spent, 'limit', v_budget.limit_amount, 'currency', new.currency::text, 'progress', round(v_progress * 100, 1)))
  on conflict (budget_id, period_start, threshold) do nothing;
  return new;
end;
$$;

create trigger queue_telegram_budget_notification_after_expense
  after insert on public.transactions
  for each row execute function public.queue_telegram_budget_notification();

create or replace function public.claim_telegram_budget_notification(p_telegram_user_id text, p_telegram_chat_id text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_integration public.user_integrations%rowtype; v_event public.telegram_budget_notification_events%rowtype;
begin
  if p_telegram_user_id !~ '^[0-9]+$' or p_telegram_chat_id !~ '^-?[0-9]+$' then return null; end if;
  select * into v_integration from public.user_integrations where provider = 'telegram' and external_user_id = p_telegram_user_id and external_chat_id = p_telegram_chat_id and status = 'active' and deleted_at is null;
  if not found then return null; end if;
  select * into v_event from public.telegram_budget_notification_events
   where integration_id = v_integration.id and (status = 'pending' or (status = 'sending' and last_attempt_at < now() - interval '5 minutes'))
   order by created_at for update skip locked limit 1;
  if not found then return null; end if;
  update public.telegram_budget_notification_events set status = 'sending', attempts = attempts + 1, last_attempt_at = now() where id = v_event.id;
  return v_event.payload || jsonb_build_object('notification_id', v_event.id::text, 'threshold', v_event.threshold);
end;
$$;

create or replace function public.complete_telegram_budget_notification(p_telegram_user_id text, p_telegram_chat_id text, p_notification_id uuid, p_delivered boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_integration public.user_integrations%rowtype;
begin
  if p_telegram_user_id !~ '^[0-9]+$' or p_telegram_chat_id !~ '^-?[0-9]+$' then return; end if;
  select * into v_integration from public.user_integrations where provider = 'telegram' and external_user_id = p_telegram_user_id and external_chat_id = p_telegram_chat_id and status = 'active' and deleted_at is null;
  if not found then return; end if;
  update public.telegram_budget_notification_events
     set status = case when p_delivered then 'delivered' else 'pending' end,
         delivered_at = case when p_delivered then now() else null end
   where id = p_notification_id and integration_id = v_integration.id and status = 'sending';
end;
$$;

revoke all on table public.telegram_budget_notification_events from public, anon, authenticated;
revoke all on function public.claim_telegram_budget_notification(text, text) from public, anon, authenticated;
revoke all on function public.complete_telegram_budget_notification(text, text, uuid, boolean) from public, anon, authenticated;
grant execute on function public.claim_telegram_budget_notification(text, text) to service_role;
grant execute on function public.complete_telegram_budget_notification(text, text, uuid, boolean) to service_role;

commit;