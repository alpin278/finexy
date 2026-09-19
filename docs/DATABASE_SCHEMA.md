# Finexy Database Schema

Phase 11 establishes the Supabase/PostgreSQL foundation. The versioned SQL
migrations under `supabase/migrations/` are authoritative; this file is a concise
implementation reference and does not replace `docs/BACKEND_ARCHITECTURE.md`.

## Persistent tables

- `profiles` — application profile keyed one-to-one to `auth.users.id`.
- `user_settings` — one row per user for currency, locale, timezone, formatting,
  appearance, and transaction-entry preferences.
- `wallets` — owned financial accounts with native currency, opening balance,
  type, status, optional monthly limit, and non-secret masked payment metadata.
- `categories` — owned or system-template income/expense categories with display
  identifiers and optional keyword metadata.
- `category_rules` — owned, deterministic payee/description rules using only
  `contains`, `starts_with`, or `exact_match`.
- `transactions` — positive ledger amounts linked to an owned wallet and
  optionally a category or transfer leg. `in_progress` UI data maps to
  `pending` in the database.
- `wallet_transfers` — transfer aggregate with source/destination wallets,
  amounts, optional exchange rate/fee, idempotency key, and paired transaction
  leg references.
- `budgets` — active monthly category limits. Spent, remaining, percentage, and
  status are derived from transactions.
- `notification_preferences` — channel-aware preferences for `in_app`, `email`,
  and planned `telegram` delivery.
- `user_integrations` — provider-neutral external identity links, currently
  constrained to the planned Telegram provider.
- `integration_link_tokens` — one-time token hashes with expiry and consumed
  state; plaintext link tokens are never stored.
- `integration_sessions` — expiring, bounded JSON workflow state for future
  provider conversations.
- `integration_events` — provider event receipts and idempotency metadata for
  future webhook deduplication.

## Money representation

Money uses PostgreSQL `numeric(20,4)`, never floating point. The four fractional
places intentionally avoid assuming that every supported currency has two decimal
places; currency-specific display/minor-unit rules remain an application concern.
Exchange rates use `numeric(30,12)`. Supported currency codes are `USD`, `EUR`,
`GBP`, and `IDR`; the database stores `IDR` as the code and does not store a
formatted currency symbol.

Calculated wallet balances, budget usage, overview totals, savings rate, category
percentages, and report aggregates are not persisted as source-of-truth values.

## Ownership and deletion

Every user-owned table carries `user_id` and has RLS policies based on
`auth.uid()`. Composite ownership foreign keys prevent attaching another user's
wallet, category, transfer, or integration to a record. Wallets, transactions,
rules, and integrations use `deleted_at`; categories and budgets use
`archived_at`. Hard deletion of referenced wallets/categories is restricted.

Telegram tables are schema-only in this phase. No bot, webhook, provider token,
service-role key, or other credential is stored in the repository.
