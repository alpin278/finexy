-- Split rows have their own owner-scoped RLS policy. Publish split-only
-- redistribution so other sessions revalidate category analytics.
alter publication supabase_realtime add table public.transaction_splits;
