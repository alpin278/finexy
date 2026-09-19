# Finexy Backend and Database Architecture

Status: planning proposal for the frontend-to-backend transition. This document does not implement a backend, database connection, authentication, or persistence.

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
└── 1:N WalletTransfers

WalletTransfer 1:N Transactions (normally two legs)
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

## 10. Mapping current mock data to future sources

| Current file | Future source | Notes |
| --- | --- | --- |
| `src/data/overview.ts` | Balance, transaction, budget, wallet, and category read models | `mockMetrics`, cash flow, category insight, and limit cards become derived queries. The current product-level aggregates need not equal the seven-row preview. `PaymentCardData` is UI-only until a non-secret wallet/payment model exists. |
| `src/data/transactions.ts` | `transactions`, `wallets`, and `categories` | The seven rows are a preview of a larger dataset. Display wallet labels and status values should be API DTO mapping, not database names. |
| `src/data/wallets.ts` | `wallets` plus wallet metadata columns/table | Opening balances and account masks map directly; currency options come from a constrained configuration, not fake wallet rows. |
| `src/data/budgets.ts` | `budgets` plus derived transaction usage | Monthly limits are stored; spent, averages, counts, and status are calculated. Its aggregate cap remains a query result. |
| `src/data/reports.ts` | Parameterized report query/view/service | Cash-flow points, expense shares, liquidity, and health context are projections; no `report_snapshots` table is required. |
| `src/data/categories.ts` | `categories`, `category_rules`, and aggregate queries | Counts, averages, caps, spent, coverage, and uncategorized totals are derived. Rule matching stays deterministic. |
| `src/data/settings.ts` | `user_settings` and `notification_preferences` | Profile identity maps to `profiles`; connected-account and 2FA fields remain demo-only until real providers are selected. |

## 11. Frontend types and backend DTOs

The focused domain types `Wallet`, `Transaction`, `Budget`, `FinanceCategory`, `CategoryRule`, and the settings preference shapes are good starting points for API contracts after replacing mock imports with adapters. They should be split into input, persisted, and response DTOs rather than used as direct database rows.

Keep presentation types UI-only: `MetricData`, `RecentActivity`, `CashFlowMonth`, `PaymentCardData`, chart-only report rows, status-badge variants, select options, symbols/flags, and display-formatted amounts. `ReportSnapshot` can remain a response DTO assembled by a report query, but it should not become a report table. The migration should introduce feature adapters such as `transactionsApi`, `walletsApi`, and `reportsApi` while preserving page-facing view models.

## 12. Proposed backend layout and implementation order

```text
supabase/
  migrations/
  seed.sql
  functions/                 # optional validated report/domain functions
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
  lib/auth/
  lib/validation/
  types/api/
```

If a separate Node service becomes necessary, add `server/modules/{auth,users,wallets,transactions,transfers,categories,budgets,reports,settings}` with `db`, `policies`, and `shared` modules; keep PostgreSQL migrations authoritative.

Recommended order:

1. Freeze the frontend contract map and define migrations, enums, timestamps, indexes, seed categories, profiles, settings, and RLS.
2. Implement authenticated profile/settings, category, and wallet reads/writes, including archive semantics.
3. Implement transaction CRUD, validation, ownership, statuses, and category assignment.
4. Implement atomic wallet transfers and ledger tests.
5. Add budget queries and threshold semantics.
6. Add Overview and Reports read models with native-currency behavior and explicit FX limitations.
7. Add deterministic category rules and notification preferences.
8. Replace one mock-data import at a time with feature adapters, starting with Settings/Categories, then Wallets/Transactions, Budgets, and finally Overview/Reports.
9. Add import/recurring/FX integrations only after the core ledger and RLS are covered by tests.

This preserves the completed frontend while making transactions, wallet openings, and transfer legs the durable financial truth. No backend implementation is part of this phase.
