-- Phase 25A: add the recurring ledger source before it is referenced by rules or transactions.
alter type public.transaction_source add value if not exists 'recurring';
