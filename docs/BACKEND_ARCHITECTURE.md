# Finexy Backend and Database Architecture

Status: implementation reference. Finexy now uses the Supabase/PostgreSQL
architecture described here: Supabase Auth owns sessions, PostgreSQL with RLS
owns persistent data, and Edge Functions provide Telegram, recurring worker,
notification worker, and guarded FX refresh boundaries. Migrations are
authoritative if this document differs from implementation.

## 1. Recommended stack

Recommend **Supabase + PostgreSQL**, using Supabase Auth, SQL migrations, Row Level Security (RLS), generated TypeScript types, and a small typed data-access layer in the React application. This is the best fit for Finexy's current stage because it provides a production-grade relational database and authentication boundary without requiring a separate API deployment before the domain model is proven.

| Option | Strengths | Costs and risks |
| --- | --- | --- |
| A. Supabase + PostgreSQL | PostgreSQL constraints and migrations, managed Auth, RLS close to the data, straightforward deployment, generated types, good fit for a frontend moving off typed mocks | Domain workflows must not be scattered across client calls; complex imports, recurring jobs, and integrations may later need server-side functions or a separate service |
| B. Node/TypeScript API + PostgreSQL | Maximum control over domain services, validation, jobs, integrations, audit logging, and deployment topology | More code and operations immediately; authentication, session handling, migrations, API contracts, and authorization all become application responsibilities |

Use Supabase initially, but keep domain boundaries explicit. Financial writes should go through validated database functions or a thin server-side service as soon as they involve multiple rows or invariants. If recurring transactions, bank imports, reconciliation, or queue-driven integrations become central, add a Node/TypeScript service without changing the PostgreSQL model.

## 2. Database entities

### Required entities

- **User/profile** — Supabase Auth owns identity and credentials. A `public.profiles` row keyed by `auth.users.id` stores display name, email presentation, avatar metadata, and application-level profile fields.
- **Wallet** — A financial account or payment source with a native currency, opening balance, status, and optional presentation/payment-source metadata.
- **Transaction** — A dated financial ledger event owned by a user and normally linked to one wallet and, when categorized, one category.
- **Category** — A user-owned or system-provided income/expense classification.
- **Budget** — A user's planned spending limit for an expense category and period.
- **UserSettings** — One row per user for currency, locale, formatting, appearance, entry preferences, and timezone.

### Supporting entities

- **CategoryRule** — A deterministic user-owned rule linked to a category. Store field, operator, value, priority, and enabled state; never store executable JavaScript or arbitrary expressions.
- **NotificationPreference** — One row per user and notification key for budget alerts, transaction notifications, spending alerts, and report summaries. Delivery channels can be added later.
- **Wallet payment-source metadata** — Keep `kind`, institution label, account mask, icon/color, and similar non-secret fields on `wallets` initially. Split into `wallet_payment_sources` only if one wallet can have multiple instruments or providers. Never store CVV, passwords, access tokens, or bank credentials.
- **WalletTransfer** — Recommended supporting aggregate for an atomic transfer between wallets. It links paired ledger transactions and gives cross-currency transfers, fees, idempotency, and audit history a stable home.
- **UserIntegration** — A generic provider connection owned by exactly one Finexy user. Telegram is the first provider; future providers can use the same boundary.
- **IntegrationLinkToken** — A short-lived, one-time, hashed linking challenge created by an authenticated web session.
- **IntegrationSession** — Temporary, expiring workflow state for a provider conversation. It is not financial source-of-truth data.
- **IntegrationEvent** — A small provider-delivery receipt used to make webhook processing idempotent. Retain only the metadata needed for deduplication and troubleshooting, not a second financial ledger.

Future-compatible, not part of the first migration: `recurring_transaction_rules`, import batches, exchange-rate snapshots, and audit events.

## 3. Relationships

```text
User
├── 1:1 UserSettings
├── 1:N Wallets
├── 1:N Categories
├── 1:N Transactions
├── 1:N Budgets
├── 1:N CategoryRules
├── 1:N NotificationPreferences
├── 1:N WalletTransfers
└── 1:N UserIntegrations

WalletTransfer 1:N Transactions (normally two legs)
UserIntegration 1:N IntegrationSessions (temporary)
UserIntegration 1:N IntegrationEvents (delivery receipts)
UserIntegration 1:N Notification deliveries (future)
IntegrationLinkToken N:1 User (pre-link challenge)
Transaction N:1 Wallet
Transaction N:1 Category (nullable for uncategorized or transfer legs)
Budget N:1 Category (expense categories only)
CategoryRule N:1 Category
```

Every tenant-owned row carries `user_id` even where it can be inferred through another relationship. Use foreign keys, composite ownership checks where appropriate, and RLS policies based on `auth.uid()` so a client cannot attach another user's wallet or category to a transaction.

## 4. Important fields and constraints

All mutable domain tables should have UUID primary keys, `created_at`, `updated_at`, and an appropriate `deleted_at` or `archived_at`. Use database `numeric`/decimal amounts, never floating-point money. Index `(user_id, occurred_at)`, `(user_id, wallet_id, occurred_at)`, `(user_id, category_id, occurred_at)`, budget periods, and external identifiers.

### Wallet

`id`, `user_id`, `name`, `kind` (`bank`, `cash`, `card`, `travel`, `savings`), `currency` (`USD`, `EUR`, `GBP`, `IDR` initially), `opening_balance`, `opening_balance_at`, `status`, `monthly_limit` (account-level limit, distinct from a category budget), `institution`, `account_mask`, and optional display metadata. `opening_balance` is the starting ledger position, not a replacement for transaction history.

### Transaction

`id`, `user_id`, `wallet_id`, nullable `category_id`, nullable `transfer_id`, `type` (`income`, `expense`, `transfer`), `status` (`pending`, `completed`, `canceled`), positive `amount`, `currency`, `occurred_at`, optional `posted_at`/`cleared_at`, `payee`, `description`, `note`, `reference`, `source`, and nullable provider `external_id`.

For ordinary transactions, currency must match the wallet's currency. Transfer legs may additionally carry `source_amount`, `destination_amount`, `exchange_rate`, and `fee_amount` when currencies differ. `in_progress` in the current UI should map to a deliberate API status such as `pending`; it should not become an ambiguous database state.

### Category

`id`, nullable `user_id` for system templates, `name`, `type` (`income` or `expense`), icon/display metadata, and `archived_at`. Enforce a case-insensitive uniqueness rule scoped to user and type. Categories should not be hard-deleted while referenced by historical transactions.

### Budget

`id`, `user_id`, `category_id`, `period_type` (`monthly` initially), `period_start`, `period_end` or a canonical month start, `limit_amount`, `currency`, `notes`, and `archived_at`. Enforce one active budget per user/category/period. Only expense categories may be budgeted.

### UserSettings and preferences

`user_id` (primary/foreign key), `default_currency`, `region`, `timezone`, `date_format`, `number_format`, `appearance`, `default_transaction_type`, `entry_mode`, `auto_categorize`, `merchant_suggestions`, and `confirm_before_delete`. Keep notification rows separate so they can later include channel, schedule, or delivery state.

## 5. Balance calculation strategy

The source of truth is the wallet opening balance plus signed, non-deleted transaction legs:

```text
balance = opening_balance
        + completed income
        - completed expense
        + completed transfer-in
        - completed transfer-out
```

Pending transactions are excluded from the default current balance. A future API may expose an `available_balance` that also subtracts pending expenses, but the distinction must be explicit. Canceled and soft-deleted transactions do not contribute. Do not store calculated balances in the first version; use SQL views/RPC queries or server-side query functions. Add balance snapshots only if transaction volume later makes recomputation materially expensive.

Balances remain native to each wallet currency. A cross-currency total is only valid after conversion using an identified FX rate and the user's reporting currency; until an FX source exists, return grouped balances rather than inventing conversions. IDR must retain `Rp` formatting in the API/UI adapter, while the database stores `IDR` as the code.

## 6. Wallet transfers

Do not represent a transfer as income or expense. Create one `wallet_transfers` row and two linked transaction legs in one atomic operation: an outgoing leg from the source wallet and an incoming leg to the destination wallet. Both legs share the same user and transfer ID, and neither is budgetable or included in income/expense reports.

Same-currency transfers can use the same amount. Cross-currency transfers require source and destination amounts plus the applied rate; fees should be represented explicitly so they can be reported as an expense only when that product decision is made. Enforce source/destination ownership, positive amounts, distinct wallets, idempotency/reference keys, and legal state transitions (`pending` -> `completed` or `canceled`). The current Wallets transfer modal remains a local simulation until this backend exists.

## 7. Budget calculation

For a user's timezone and a budget's monthly period, sum completed, non-deleted expense transactions with the same category and currency. Exclude income, transfers, canceled rows, and transactions outside the period. Pending expenses can be exposed as a separate forecast value, but must not silently change the committed spend total.

Return `spent`, `remaining`, `percentage`, and transaction count as derived values. Preserve Finexy's status semantics: below 80% `On Track`, 80% through below 100% `Near Limit`, and 100% or more `Over Budget`. Clamp only the visual progress width to 100%; retain the actual percentage in text.

## 8. Overview and Reports calculation

Overview and Reports should be read models, not duplicate financial tables. SQL views, parameterized RPC functions, or a typed report service can derive:

- total and per-currency balances;
- income, expenses, net cash flow, and savings rate;
- income-versus-expense time series;
- budget progress;
- category spending shares;
- recent transaction previews;
- liquidity and period summaries.

Use completed transactions by default and apply the user's timezone and reporting currency. `savings_rate` is derived as net cash flow divided by income when income is nonzero; it is never stored as a user-editable fact. Financial-health scores, surplus guidance, and peer comparisons should remain clearly labeled as heuristic/educational projections if retained; do not persist the current mock score as authoritative financial truth.

## 9. Authentication, ownership, and security

Use Supabase Auth for sessions and identity. Create a profile row on signup, with `profiles.id = auth.users.id`. Every read and write must be scoped to the authenticated user through RLS. Validate foreign-key ownership in the database, not only in React. Keep service-role credentials server-side and never expose them in Vite environment variables or browser bundles.

Do not implement password storage, credential handling, bank OAuth, API keys, or secret integration data in this phase. When real 2FA is required, prefer the auth provider's MFA flow and recovery policy rather than storing OTP secrets in `user_settings`. User-facing deletes should generally archive or soft-delete wallets, categories, budgets, rules, and transactions. Hard deletion is reserved for unreferenced drafts, import staging, or a deliberate account-deletion workflow with audit and retention rules.

## 10. Telegram Integration Architecture

Telegram is an additional interface to the same Finexy domain and PostgreSQL database. It must never maintain a separate wallet, category, transaction, balance, or budget store.

### Integration records

Use a provider-neutral `user_integrations` table with fields such as:

`id`, `user_id`, `provider`, `external_user_id`, `external_chat_id`, `status`, `linked_at`, `last_seen_at`, `created_at`, `updated_at`, and `deleted_at`.

For a generic integration table, store external identifiers as exact `text` values. This avoids JavaScript safe-integer loss and allows providers with non-numeric IDs; Telegram IDs should be preserved as their decimal string representation. If a Telegram-specific table is ever introduced, PostgreSQL `bigint` is also suitable, but it must still be serialized safely at the TypeScript boundary.

Recommended active-record constraints:

- unique `(user_id, provider)` for one active connection per provider, unless product requirements later allow several Telegram chats;
- unique `(provider, external_user_id)` where `deleted_at IS NULL`;
- unique `(provider, external_chat_id)` where `deleted_at IS NULL` for the initial private-chat-only bot;
- `provider` constrained to `telegram` initially, but modeled as an extensible value rather than a Telegram-only schema;
- `status` constrained to states such as `active`, `unlinked`, and `revoked`.

Do not use Telegram usernames for identity. They can change and are not an ownership key. The linked Finexy `user_id` is the only application owner of the integration.

### Secure account linking

The planned flow is:

1. An authenticated user selects **Connect Telegram** in Finexy Settings.
2. A trusted backend function creates a high-entropy, short-lived `IntegrationLinkToken` containing `user_id`, `provider`, `token_hash`, `expires_at`, `consumed_at`, and `created_at`.
3. The web UI shows the one-time code or deep-link payload. Plaintext is returned only to that authenticated request and is never stored.
4. The user sends `/link CODE` to the Finexy bot.
5. The webhook hashes the supplied code, atomically claims an unexpired and unconsumed token, verifies provider identity, then creates or safely replaces the user's active `UserIntegration`.
6. The bot confirms success without exposing the Finexy user's internal ID.

Link codes should expire quickly, be single-use, be rate-limited, and be consumed in one database transaction. A Telegram external identity that is already linked to a different active user must fail closed and require an explicit unlink/recovery flow; it must never silently move accounts. Unlinking revokes the integration and expires outstanding link tokens. Relinking creates a new challenge rather than reusing an old code.

### Webhook and Supabase boundary

The recommended MVP path is:

```text
Telegram Bot API
  -> HTTPS webhook
  -> Supabase Edge Function (trusted server-side code)
  -> shared domain/data operations
  -> PostgreSQL
```

Supabase Edge Functions are suitable for the webhook because Telegram delivery is HTTP-based and each command can be handled as a short, stateless request. The function should validate the request, resolve the linked integration, load or update the temporary session, call the same validated transaction/budget/balance operations used by the web application, and send a response through the Telegram Bot API. Long-running imports, scheduled summaries, and retry-heavy work should move to a queue or separate Node/TypeScript service later.

Configure Telegram's webhook `secret_token` as a server-side secret and verify the `X-Telegram-Bot-Api-Secret-Token` header before parsing or processing the update. Bot tokens, Supabase service-role keys, and any provider credentials belong only in Edge Function/deployment secrets. They must not be stored in `user_integrations`, exposed through Vite variables, or shipped to the browser. A service-role key may be used by the webhook function only in that trusted environment; all ordinary web requests continue to use the authenticated user's session and RLS.

The webhook must not accept `user_id` from Telegram commands, callback data, or message payloads. It derives the owner from the verified Telegram external identity and active `UserIntegration`, then passes that server-resolved owner through domain operations that re-check wallet/category ownership.

### Telegram-created transactions

An approved Telegram flow creates the ordinary `Transaction` entity, not a Telegram transaction table. The eventual record uses the normal `user_id`, `wallet_id`, `category_id`, `type`, positive `amount`, `currency`, `occurred_at`, `status`, and note/reference fields, with `source = 'telegram'` and a provider-scoped source reference or idempotency key.

The final confirmation should call the same domain operation as the web form. It must apply the same currency, category, wallet ownership, status, transfer exclusion, and balance rules. Telegram should not be able to create a transaction by submitting arbitrary internal IDs without server-side ownership validation.

### Conversation state

For the MVP, store temporary state in a small `integration_sessions` table rather than relying only on in-memory or edge-process storage. Edge Functions are stateless and may be retried or run on different instances; a short-lived database row makes a multi-step flow durable across those boundaries.

Suggested fields are `id`, `integration_id`, `flow`, `step`, `payload` (strictly limited `jsonb`), `expires_at`, `status`, `created_at`, and `updated_at`. Add a partial uniqueness rule for one active session per integration/flow where appropriate. The payload may hold a draft category choice, amount, wallet choice, note, and date, but not secrets. Any stored wallet/category IDs are treated as untrusted draft data and are revalidated at confirmation. Expired or completed sessions are ignored and periodically deleted/archived.

An ephemeral store could be considered later for very high message volume, but it would add infrastructure and weaker recovery semantics. PostgreSQL is the practical MVP choice because the project already depends on it and the state is small and temporary.

### Commands and buttons

The first command surface can include `/start`, `/link`, `/menu`, `/saldo`, `/budget`, and `/transaksi`. The menu can provide localized reply/inline actions such as **Pengeluaran**, **Pemasukan**, **Saldo**, **Budget**, and **Transaksi Terakhir**.

Callback data should use compact, versioned, stable action identifiers such as `v1:expense`, `v1:income`, `v1:confirm`, and a short server-issued session/action token. Do not put a raw `user_id` or sensitive payload in callback data, and do not assume callback data is authentic merely because it came from a button. The webhook resolves the integration and validates the current session/step before taking action.

### Notifications

Extend the existing `NotificationPreference` model to be channel-aware rather than creating Telegram-only preference rows. A practical shape is `(user_id, preference_key, channel, enabled)` with a unique constraint across those fields. Initially support `channel = 'telegram'` for budget-near-limit, budget-exceeded, optional transaction confirmation, and optional daily/weekly summary notifications. Existing web/in-app preferences can use other channels with the same model.

Telegram delivery requires an active `UserIntegration` and an opt-in preference. If reliable delivery history is needed, add a future `notification_deliveries` table with an idempotency key; it is not a financial record and should not duplicate notification preferences. Notifications should be generated from derived budget/transaction events, not from duplicated Telegram data.

### Security and duplicate delivery protection

- RLS lets normal users read and manage only their own `user_integrations`, link-token records, and sessions. A webhook Edge Function uses a tightly scoped trusted path or security-definer domain function; it does not bypass ownership checks in application code.
- Link tokens are hashed, short-lived, one-time, atomically consumed, and never linked by username.
- Telegram sender identity, integration status, session ownership, wallet IDs, category IDs, and budget IDs are all revalidated server-side.
- For every incoming Telegram update, record a provider-scoped `external_event_id`/Telegram `update_id` in `integration_events` with a unique `(provider, external_event_id)` constraint. If insertion reports a duplicate, return the prior result or acknowledge without repeating side effects.
- The final transaction commit also needs a unique provider-scoped idempotency key, for example an integration/session confirmation key. The database transaction should claim that key before inserting the financial record, so webhook retries cannot create duplicate expenses or income.
- Keep only minimal event metadata and a bounded retention period. Do not treat raw Telegram updates as a second source of financial truth.

Telegram therefore has an adapter and temporary workflow state, while the user, wallet, category, transaction, budget, and derived report rules remain shared Finexy domain behavior.

## 11. Mapping current mock data to future sources

| Current file | Future source | Notes |
| --- | --- | --- |
| `src/data/overview.ts` | Balance, transaction, budget, wallet, and category read models | `mockMetrics`, cash flow, category insight, and limit cards become derived queries. The current product-level aggregates need not equal the seven-row preview. `PaymentCardData` is UI-only until a non-secret wallet/payment model exists. |
| `src/data/transactions.ts` | `transactions`, `wallets`, and `categories` | The seven rows are a preview of a larger dataset. Display wallet labels and status values should be API DTO mapping, not database names. |
| `src/data/wallets.ts` | `wallets` plus wallet metadata columns/table | Opening balances and account masks map directly; currency options come from a constrained configuration, not fake wallet rows. |
| `src/data/budgets.ts` | `budgets` plus derived transaction usage | Monthly limits are stored; spent, averages, counts, and status are calculated. Its aggregate cap remains a query result. |
| `src/data/reports.ts` | Parameterized report query/view/service | Cash-flow points, expense shares, liquidity, and health context are projections; no `report_snapshots` table is required. |
| `src/data/categories.ts` | `categories`, `category_rules`, and aggregate queries | Counts, averages, caps, spent, coverage, and uncategorized totals are derived. Rule matching stays deterministic. |
| `src/data/settings.ts` | `user_settings` and `notification_preferences` | Profile identity maps to `profiles`; connected-account and 2FA fields remain demo-only until real providers are selected. |

## 12. Frontend types and backend DTOs

The focused domain types `Wallet`, `Transaction`, `Budget`, `FinanceCategory`, `CategoryRule`, and the settings preference shapes are good starting points for API contracts after replacing mock imports with adapters. They should be split into input, persisted, and response DTOs rather than used as direct database rows.

Keep presentation types UI-only: `MetricData`, `RecentActivity`, `CashFlowMonth`, `PaymentCardData`, chart-only report rows, status-badge variants, select options, symbols/flags, and display-formatted amounts. `ReportSnapshot` can remain a response DTO assembled by a report query, but it should not become a report table. The migration should introduce feature adapters such as `transactionsApi`, `walletsApi`, and `reportsApi` while preserving page-facing view models.

## 13. Proposed backend layout and implementation order

```text
supabase/
  migrations/
  seed.sql
  functions/                 # optional validated report/domain functions
  telegram/                  # optional webhook-specific function modules
src/
  api/                       # typed client and DTO adapters
  features/
    users/
    wallets/
    transactions/
    transfers/
    categories/
    budgets/
    reports/
    settings/
    integrations/
  lib/auth/
  lib/validation/
  types/api/
```

If a separate Node service becomes necessary, add `server/modules/{auth,users,wallets,transactions,transfers,categories,budgets,reports,settings}` with `db`, `policies`, and `shared` modules; keep PostgreSQL migrations authoritative.

Recommended order:

1. Create the Supabase project configuration and migrations, including enums, timestamps, indexes, profiles, settings, and RLS.
2. Implement Auth/user ownership, then Categories and Wallets with archive semantics.
3. Implement Transactions, validation, statuses, category assignment, and shared domain operations.
4. Implement atomic wallet transfers and ledger/idempotency tests.
5. Add Budget queries and threshold semantics.
6. Add Overview and Reports read models with native-currency behavior and explicit FX limitations.
7. Add Settings, channel-based notification preferences, and deterministic category rules.
8. Replace mock-data imports with feature adapters, starting with Settings/Categories, then Wallets/Transactions, Budgets, and finally Overview/Reports.
9. Add the generic integration schema, RLS policies, link-token flow, and webhook event deduplication.
10. Add Telegram account linking through a Supabase Edge Function.
11. Add Telegram transaction/balance/budget/recent-transaction flows through the shared domain layer.
12. Add opt-in Telegram notifications and summaries, then consider recurring/import/FX integrations.

This preserves the completed frontend while making transactions, wallet openings, and transfer legs the durable financial truth. No backend implementation is part of this phase.
