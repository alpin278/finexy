-- Authenticated Realtime authorization continues to use each table's existing
-- owner RLS policy. This only publishes canonical financial source changes.
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.wallet_transfers;
alter publication supabase_realtime add table public.wallets;
alter publication supabase_realtime add table public.budgets;
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.category_rules;
alter publication supabase_realtime add table public.recurring_transaction_rules;
alter publication supabase_realtime add table public.user_settings;
