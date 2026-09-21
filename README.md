# Finexy

Finexy is a personal-finance web application built with React, TypeScript,
Vite, Supabase Auth, PostgreSQL, Row Level Security, and Supabase Edge
Functions.

## Local setup

Create `.env.local` with browser-safe values only:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Never put service-role keys, Telegram secrets, worker secrets, or passwords in
Vite variables. Edge Functions receive their secrets from the Supabase project.

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
```

## Database and Edge Functions

Versioned SQL in `supabase/migrations/` is authoritative. Apply pending
migrations only after review:

```powershell
npx.cmd supabase migration list
npx.cmd supabase db push
npx.cmd supabase functions deploy refresh-fx-rates
```

Deployed functions include `telegram-webhook`, notification and recurring
workers, and `refresh-fx-rates`. Worker endpoints require configured server-side
secret headers; FX refresh requires an authenticated user.

## QA

```powershell
node --experimental-strip-types scripts/phase29b6-transaction-history.test.ts
node --experimental-strip-types scripts/phase30-split-model.test.ts
node --experimental-strip-types scripts/phase31-import-parser.test.ts
node scripts/phase32-fx-tests.mjs
```

Remote disposable-account checks use ignored `.auth-test.local`; it must never
be committed or printed. `phase30-remote-e2e.mjs` covers split/backup/realtime;
`phase31-remote-e2e.mjs` covers bank import.

## Backup format

Current `finexy-backup` exports are Backup v2: split allocations are included,
while parent transactions remain canonical cash-flow rows. Import remains
backward-compatible with v1.

## v1 limitations

- Wallet transfers are same-currency only.
- FX is a guarded on-demand cache; scheduled refresh is not configured.
  Historical Reports are not converted.
- Bank imports use generic CSV mapping; no bank/Open Banking, PDF, or OCR import.
- Telegram supports normal income/expense and supported transfers, not splits.
