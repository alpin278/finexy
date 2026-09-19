# Finexy — Agent Instructions

## Project

Finexy is a personal-finance web application.

Current stage:
- Frontend implementation complete
- Typed mock data
- Local React state
- Backend foundation: Supabase + PostgreSQL migrations
- Supabase Auth owns authentication
- PostgreSQL with Row Level Security is the source of persistent data
- Persistent frontend integration is not connected yet
- No real financial integrations yet

Stack:
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React
- Recharts

Project root:
`C:\Users\alfin\Desktop\project\finexy`

---

## Product Direction

Finexy is a personal finance tracker / money management application.

Core domains:
- Overview
- Transactions
- Wallets
- Budgets
- Reports
- Categories
- Settings

The frontend implementation is complete and must remain stable during the backend
migration. The backend target is Supabase + PostgreSQL: Supabase Auth owns
authentication, and PostgreSQL with RLS is the source of persistent data. Database
changes must use versioned SQL migrations. Service-role secrets are server-side
only and must never be exposed to the frontend. Telegram is planned but not
implemented yet; do not add bot or webhook behavior unless explicitly requested.

The frontend remains backed by typed mock data and local React state until a later
integration phase. Do not prematurely connect existing pages to Supabase.

---

## Navigation

Primary navigation:
- Overview
- Transactions
- Wallets
- Budgets
- Reports

Utility routes:
- Categories
- Settings

Routes:
- `/` -> `/overview`
- `/overview`
- `/transactions`
- `/wallets`
- `/budgets`
- `/reports`
- `/categories`
- `/settings`

Do not change the information architecture unless explicitly requested.

---

## Figma Source of Truth

Figma:
`https://www.figma.com/slides/UgqDYZWAmBj1dpOkTYz0s0`

Known frames:
- `Finexy Desktop Financial Dashboard`
- `Finexy - Overview Dashboard`
- `Finexy - Transactions Management & Add Transaction`
- `Finexy - Reports & Analytics`
- `Finexy - Categories Management`
- `Finexy - Settings & Preferences`

No dedicated standalone Figma frame exists for:
- Wallets
- Budgets

Rules:
- If a dedicated Figma frame exists, use it as the primary visual reference.
- If no dedicated frame exists, derive the page from the closest Finexy screen and existing design system.
- Do not invent an unrelated visual language.
- Do not claim pixel-perfect matching unless actual rendered comparison was performed.

---

## Design System

Primary palette:
- Page background: `#F2F2F0`
- App surface: `#FAFAF8`
- Card: `#FFFFFF`
- Primary text: `#171714`
- Secondary text: `#777771`
- Border: `#ECECE8`
- Orange accent: `#FF5A36`
- Dark: `#22221C`
- Success: `#55B88B`
- Danger: `#E95E5E`
- Warning: `#E8CF56`

Prefer existing semantic tokens/classes from:
- `src/lib/theme.ts`
- `src/index.css`

Reuse existing primitives before creating new ones.

Shared primitives include:
- Button
- IconButton
- Card
- Badge
- StatusBadge
- Input
- SearchInput
- Select
- Checkbox
- Tabs
- ProgressBar
- Table
- Modal
- Avatar
- Tooltip

Do not duplicate primitives without a clear reason.

---

## Architecture Rules

Before modifying shared types/components:
1. inspect the current implementation
2. inspect consumers
3. preserve existing behavior unless the task explicitly requires change

Avoid duplicate domain models.

### Wallet
Represents a financial account/payment source. Wallet monthly limits are wallet/account concepts.

### Transaction
Represents an income or expense event.

### Category
Represents transaction classification.

### Budget
Represents planned spending for a category. A Budget is not the same as a Wallet limit.

### Reports
Use report-specific aggregate data/types.

Do not create one giant universal finance type. Prefer focused feature types when appropriate.

---

## Frontend State Rules

For the current stage:
- use local React state
- use typed mock data
- keep larger mock datasets outside page components
- preserve this frontend boundary while the database foundation is being added

Do not add unless explicitly requested:
- Redux
- Zustand
- global finance Context
- backend APIs
- persistence
- auth state
- database clients

Cross-page local mutations are not required yet. Real data integration will happen later.

---

## Mock Data Rules

Some Figma values are product-level mock aggregates.

Do not force them to reconcile with small preview datasets.

Examples:
- Transactions visible rows are only a preview dataset
- Budget aggregates are separate mock data
- Reports analytics are separate aggregate mock data
- Category counts may represent a larger mock dataset than visible cards

If values intentionally differ:
- document the distinction
- do not pretend one dataset was derived from another
- do not fabricate hidden data just to reconcile totals

---

## Budget Status Semantics

Use consistently:
- `< 80%` -> `On Track`
- `>= 80% and < 100%` -> `Near Limit`
- `>= 100%` -> `Over Budget`

For over-budget progress:
- clamp visual width to 100%
- keep actual percentage text

Reference:
- Shopping & Goods = `1750 / 1500 = 116.7%`
- use `116.7%`, not `116.6%`

Do not create conflicting threshold logic between Budgets and Categories.

---

## Currency

Known wallet currencies:
- USD
- EUR
- GBP
- IDR

IDR must display with `Rp`, not `$`.
Do not assume every value is USD.
Avoid a heavy i18n system unless explicitly requested.

---

## Personal Finance Terminology

Finexy is primarily personal finance.

Prefer:
- Income
- Expenses
- Inflow
- Outflow
- Net Cash Flow
- Savings Rate
- Balance
- Budget
- Spending

Avoid unnecessary enterprise terminology unless required by the Figma reference.

---

## Prototype Boundaries

Prototype-only behavior must remain clearly prototype-only.

### Wallet Transfer
Local simulation only. No real transfer behavior.

### Re-index Transactions
Mock only. Do not claim real AI classification occurred.

### Category Rules
Keep simple and deterministic. No arbitrary JavaScript execution or executable rule language.

### Reports
Mock financial-health indicators are not scientifically validated scoring.

### Surplus / Allocation
No real investing actions or personalized investment recommendations.

Neutral informational prototype actions are acceptable.

---

## CodeGraph MCP

CodeGraph was installed globally on this Windows machine before Finexy was created.

Known installation locations include:
- `C:\Users\alfin\.codegraph`
- `C:\Users\alfin\AppData\Roaming\npm\node_modules\@colbymchenry\codegraph`
- global command shims under `C:\Users\alfin\AppData\Roaming\npm`

Important:
- Do NOT determine CodeGraph availability from the presence or absence of a `.codegraph` folder inside the Finexy repository.
- Do NOT say CodeGraph is unavailable merely because the repo has no local `.codegraph` directory.
- Inspect the actual CodeGraph MCP tools exposed in the current Codex session.

At the start of substantial work:
1. inspect available CodeGraph MCP tools
2. use the exposed MCP capabilities when useful

If an indexing/init operation is exposed:
- use it appropriately

If only `codegraph_explore` is exposed and Finexy is still unindexed:
- state that briefly
- use manual dependency tracing

Do not invent:
- MCP operations
- indexing commands
- CLI commands
- local CodeGraph setup

Do not run arbitrary CodeGraph CLI commands merely to compensate for missing MCP capabilities unless the user explicitly requests CLI-based setup.

---

## Before Editing

For substantial tasks:
- `git status`
- inspect recent `git log`
- inspect relevant source files
- inspect relevant consumers before shared changes

Do not code blindly.

---

## Scope Discipline

Implement only the requested phase/task.
Do not automatically start the next phase.

Do not redesign completed pages unless:
- explicitly requested
- a confirmed regression requires a minimal fix
- a shared primitive requires correction

Avoid unrelated cleanup and large refactors.

---

## Browser QA

Prefer installed Chrome with lightweight headless/CDP/WebSocket control.

If a browser bridge is already known to fail:
- do not repeatedly retry the exact same failing path

Do not install Playwright/Puppeteer only for screenshots unless explicitly requested.

Default QA widths:
- Desktop: `1280px`
- Tablet: `1024px`
- Mobile: `390px`

At exact 390px:
- verify no body/document horizontal overflow
- check `scrollWidth === 390` when applicable

Screenshots:
- save outside the repository
- do not stage or commit

Do not claim visual or interaction QA passed unless actually executed.

---

## Responsive Rules

Desktop:
- preserve Finexy density and hierarchy
- avoid excessive whitespace

Tablet:
- allow cards and controls to wrap naturally
- preserve chart/table readability

Mobile:
- single-column where appropriate
- no clipped currency values
- no body-level horizontal overflow
- controls remain reachable
- modals fit viewport
- chips/labels wrap cleanly

Internal table scrolling is acceptable where necessary.

---

## Charts

Use Recharts already installed.
Do not add another chart library unless explicitly requested.
Customize charts to match Finexy.
Avoid default Recharts styling.

If animation breaks screenshots:
- disable animation where appropriate

Important chart data should also exist as readable text nearby.

---

## Accessibility

Maintain:
- form labels
- modal titles
- accessible button names
- `aria-label` for icon-only buttons
- visible focus styles
- keyboard-accessible controls
- textual status labels
- no color-only meaning
- accessible progress values
- Escape-to-close where supported
- destructive action confirmation

Charts should have nearby textual summaries/legends.

---

## Build / Lint

Before finishing:
- `npm.cmd run build`
- `npm.cmd run lint`

Require:
- zero TypeScript build errors
- successful production build
- no new lint errors

Known existing warnings may remain:
- AppRouter Fast Refresh warning
- Vite large-bundle warning

Do not optimize bundle size during unrelated feature work.

---

## Git Rules

Before commit:
- `git status`
- `git diff`

Do not stage:
- screenshots
- Chrome profiles
- browser temp files
- unrelated generated files

Do not amend previous phase commits unless explicitly requested.

Use meaningful commits:
- `feat(<scope>): ...`
- `fix(<scope>): ...`

If a QA phase requires no code changes:
- do not create an empty commit

---

## Completed Frontend Areas

Current frontend implementations include:
- Overview
- Transactions
- Wallets
- Budgets
- Reports
- Categories
- Settings

Treat completed areas as protected unless the requested task targets them.

Always inspect the current repository rather than assuming this file is perfectly current.

---

## Future Integration Direction

After the database foundation:
- authentication wiring through Supabase Auth
- persistent CRUD and feature adapters
- final frontend integration
- Overview/dashboard refinement
- real cross-page data relationships
- Telegram account linking, bot, and webhook work

Expected future data flow:

Transactions
-> Wallet balances
-> Budget usage
-> Overview metrics
-> Reports analytics

Do not implement this integration prematurely.

---

## Completion Report

Keep completion reports concise.

Include:
1. what changed
2. QA actually executed
3. build result
4. lint result
5. files changed
6. commit hash if created
7. remaining limitations

STOP after the requested task and wait for the next instruction.
