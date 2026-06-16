# Project Memory — Siattu

Committed, repo-local memory for this project. Loaded each session via the
`@.claude/MEMORY.md` import in `CLAUDE.md`. Add durable, non-obvious facts here
(decisions, conventions, gotchas) — not things already obvious from the code.

## Design Principles (from BUILD_INSTRUCTIONS.md)

1. **DRY & reusable.** Optimize for maintainability and readability; never
   duplicate logic that can be shared.
2. **Service layer.** Backend logic lives in concise, single-purpose service
   classes under `lib/service/`. Keep each service narrow.
3. **Small units.** If a file/class is accumulating too much logic, split it
   into smaller files/classes. This feeds reusability.
4. **Dependency injection.** Inject collaborators where applicable (e.g.
   `AuthService` receives a `ServiceProviderService`).
5. **Responsive everywhere.** Every page must be responsive on all devices —
   use the Bootstrap grid, avoid fixed widths (max-width is fine).
6. **Bootstrap for all styling.** Use the installed Bootstrap 5 library for all
   styling. Do **not** use Tailwind for new UI even though it is present in the
   dependency tree.

## Established Conventions (discovered in the codebase)

- **API responses** use `apiSuccess` / `apiError` from `@/lib/api/response.ts`.
  Shape is `{ data }` on success or `{ error: { message } }` on failure.
- **Services** implement the generic `Service<T>` interface
  (`get` / `upsert` / `delete` / `list`) and use the shared Prisma singleton
  from `@/lib/prisma`.
- **Prisma client** is generated to `@/app/generated/prisma` (git-ignored).
- **Next.js 16 (modified).** Per `AGENTS.md`, APIs/conventions may differ from
  stock Next.js — read the relevant guide in `node_modules/next/dist/docs/`
  before writing framework code.
- **Router split.** Authenticated app UI lives in the **App Router** (`app/`),
  matching `app/layout.tsx` + `app/page.tsx`. The unauthenticated `signin` and
  `setup` screens live in the **Pages Router** (`pages/`).
- **UI design language** (match `pages/signin` and `pages/setup`): centered
  `card` with `shadow-sm`, `form-floating` inputs, `btn-primary` actions,
  `bg-light` background, `fw-semibold`/`fw-bold` headings, muted helper text.
- **Auth gating** is centralized in `proxy.ts` — Next.js 16 renamed Middleware to
  **Proxy**. It re-exports NextAuth's `auth` with a matcher covering every route
  except `setup`, `api`, and static assets. Enforcement requires the
  **`authorized({ auth })` callback** in `auth.ts` (returns `!!auth`) — without it
  the bare `auth` export does **not** redirect, and pages render with a null
  session. With it, unauthenticated requests redirect to `/signin`, so App Router
  pages always have a session (no per-page auth redirect needed).
  `session.user.name` carries the provider's full name (set in `authorize`).
- **API routes are NOT proxy-gated** (the matcher excludes `/api`). Every route
  handler must call `await auth()` itself and reject unauthenticated requests
  (`apiError("Unauthorized", 401)`). `session.user.id` holds the service
  provider's id (exposed via the `session` callback) — use it to scope/own data
  (e.g. a new customer's `serviceProviderId`).
- **UI interactivity** is driven by **React state + Bootstrap CSS classes**, not
  Bootstrap's JS (`components/Bootstrap.tsx` is intentionally unused). Reuse the
  generic `components/Modal.tsx` for any modal (state-controlled, Esc/backdrop
  close) instead of `data-bs-toggle`.
- **No Tailwind.** Tailwind was removed from `app/globals.css` because its JIT
  scanner generates utilities that collide with Bootstrap classes of the same
  name (e.g. a `className` containing `collapse` made Tailwind emit
  `.collapse { visibility: collapse }`, silently hiding Bootstrap's navbar menu).
  `globals.css` must stay Tailwind-free; style only with Bootstrap. (The
  `@tailwindcss/postcss` plugin remains in `postcss.config.mjs` but is inert with
  no `@import "tailwindcss"`; the tailwind devDeps can be uninstalled later.)

## Architectural Decisions

- **Money** is stored as integer **cents** everywhere; forms accept/display
  dollars and convert at the boundary.
- **Time tracking** = an `InvoiceEntry` with `startTime`/`endTime` (every entry
  also has a required **`date`**). For a timed entry (`startTime` set),
  `quantity` = elapsed hours **rounded to the nearest half hour, floored at 0.5 h**
  (via `billableHalfHours` in `lib/time.ts` — any tracked time under 30 min still
  bills 30 min) and **`amount`
  stores the hourly rate**, not the line total — the entry form's amount field
  *doubles* as a per-entry rate override (defaulting to the customer's
  `defaultEntryAmount`). `amount` is **always per-unit** (hourly rate for timed,
  unit price for non-timed). The billable **line total is derived** via
  **`entryLineTotal(e)`** (`lib/models/InvoiceEntry.ts`) = **`amount × quantity`**
  (rate × hours, or unit price × count). Use it everywhere amounts are summed/shown (table,
  dashboard, customer roll-ups, invoices, PDF) — you can **no longer
  `_sum(amount)` in SQL**; `ReportService` fetches + reduces instead.
- **Entry form** (`InvoiceEntryFormModal`): Date is always shown + required. A
  **Track time** checkbox toggles modes — checked → Start/End half-hour selects +
  the amount field becomes the hourly rate, Quantity hidden; unchecked →
  Start/End hidden, Quantity shown. **Start with no End creates/keeps a running
  timer** (open entry); the nav's Track Time button is just a shortcut for that.
- **Live timer** = the single "open" entry (`startTime` set, `endTime` null).
  `TimeTrackingService` enforces one at a time (`start`/create 409s if one runs;
  `stop` rounds elapsed, leaves `amount`/rate untouched). The nav Track Time
  button + mobile FAB and the dashboard in-progress banner reflect/stop it; the
  layout passes the open timer to `Nav`.
- **After any Prisma schema change** (`db push` + `generate`), **restart the dev
  server** — the client is cached on `globalThis` to survive HMR, so a
  long-running `next dev` keeps the **stale** client and new columns cause 500s
  until restart.
- **Invoice numbering** is a **per-customer sequence** seeded by the customer's
  `startingInvoiceNumber`; uniqueness is enforced on `(customerId, invoiceNumber)`
  (not globally).
- **Invoice status** is an `open` → `paid` toggle (string field). "Unpaid" =
  `open`.
- **PDF generation** uses **`@react-pdf/renderer`** (React components → PDF,
  rendered server-side; previewed inline). No headless browser. The PDF doc is
  `lib/pdf/InvoiceDocument.tsx`; `lib/pdf/renderInvoice.tsx` wraps it with
  `renderToBuffer`. The endpoint is `app/invoices/[id]/pdf/route.ts` — it
  `await auth()`s, fetches `InvoiceService.getDetail`, and returns
  `new Response(new Uint8Array(buf), { 'Content-Type': 'application/pdf' })`.
  **JSX can't live in a `route.ts`**, so the render helper is a separate `.tsx`.
  The invoice detail page embeds it in an `<iframe src="/invoices/:id/pdf?t=…">`
  (the `?t=Date.now()` cache-buster forces a fresh render each page load).
  **PDF layout** (`InvoiceDocument.tsx`, per BUILD_INSTRUCTIONS): `INVOICE #n`
  (left) + date (right), both bold/same size; **From** address left, **Bill To**
  right (right-aligned). Line items are split into **two per-type tables via the
  reusable `EntrySection`** — **"Billable Work"** (`type !== 'software'`) and
  **"Software/Licenses"** (`type === 'software'`, only rendered when non-empty),
  **each with its own Total** (no combined grand total on the PDF). Columns:
  Description / Qty / Rate / Amount. Only **react-pdf primitives** (`View`/`Text`)
  render — a stray `<div>` throws and 500s the endpoint.
- **Invoices** are created from a customer's **unbilled, non-running** entries via
  `InvoiceService.createFromEntries` in one **transaction**: it assigns the next
  per-customer number, creates the `Invoice`, and sets the entries' `invoiceId` +
  `billed=true`. Running timers (open entry) are rejected. Totals are derived with
  `sumEntryLineTotals` (no SQL `_sum`). Status toggle = PATCH `/api/invoices/[id]`
  with `{ status: 'open' | 'paid' }`. Every invoice API/page ownership-checks via
  `customer.serviceProviderId === session.user.id`.
- **`npm install` gotcha.** A **pre-existing** Storybook/SWC peer-dep conflict
  (`@swc/helpers`) blocks plain installs, and `--legacy-peer-deps` fails on a
  **phantom optional dep `@next/font@16.2.6`** (the modified Next declares it; it
  isn't on the public registry). Install new deps with **`npm install <pkg> --force`**.
- **Recurring entries** (`InvoiceEntrySchedule` = cron + non-timed entry template
  + customer). The runner is **in-process `node-cron`** started from
  **`instrumentation.ts`** `register()` (guarded by `NEXT_RUNTIME === 'nodejs'`
  and a `globalThis` flag so HMR can't double-start; **restart dev to load a new
  instrumentation hook**). It ticks **every minute** (`* * * * *`) calling
  `InvoiceEntryScheduleService.runDue(now)`, which for each active schedule fires
  when **`cronParser.prev() > (lastRunAt ?? createdAt)`** — so each occurrence
  fires once and a new schedule never back-fills past occurrences. Uses
  **`cron-parser` v5** (`CronExpressionParser.parse(cron,{currentDate}).prev()`)
  and **`node-cron` v4** (`schedule`, `validate`); both installed with `--force`.
  Schedule CRUD: **`/api/schedules`** (POST) + **`/api/schedules/[id]`**
  (PATCH/DELETE), ownership-scoped. The entry form's **"Make recurring"** option
  (new + non-timed only) creates the entry then POSTs a schedule. `CronField`
  (preset picker) is shared by the schedule modal and the entry form.
- **Invoice groups** (`InvoiceGroup` = `name` + `invoiceDescription`, customer-scoped).
  Entries and schedules carry an optional **`invoiceGroupId`**; a chosen group must
  belong to the **same customer** (services assert this). On an invoice, entries
  sharing a group **collapse to one line _within each type section_** (Billable Work /
  Software/Licenses stay separate) via the shared
  **`collapseEntriesIntoInvoiceLines`** + **`formatGroupRate`** in
  `lib/models/InvoiceGroup.ts` — used by **both** the on-screen invoice and the PDF
  (DRY). Collapsed line = group description, **summed Qty**, **summed Amount**, and a
  smart **Rate**: one rate shows plainly (`$10.00`), mixed rates show the
  **summed quantity** billed at each rate (`qty @ rate`, e.g. `2.5 @ $5.00` — not a
  count of entries) highest-first, **one per line** (newline-joined — react-pdf
  honors `\n`; the on-screen cell uses `white-space: pre-line`). The label is
  **snapshotted** onto each entry (`InvoiceEntry.invoiceGroupLabel`) in
  `InvoiceService.createFromEntries`, so renaming/editing a group never alters issued
  invoices. **Deletion is blocked whenever _anything_ references the group** (any
  entry — billed or not — or any schedule; enforced in `InvoiceGroupService.remove`,
  returns 409), so a group used on a past invoice stays undeletable (rename still
  works). CRUD: **`/api/invoice-groups`** (GET search by `customerId`+`q`, POST) +
  **`/api/invoice-groups/[id]`** (PATCH/DELETE). UI: an **Invoice Groups** customer
  tab (`CustomerInvoiceGroups`), and a customer-scoped **`InvoiceGroupTypeahead`**
  (mirrors `CustomerTypeahead`, with a "No group" option) on the entry + schedule
  forms — remount it via `key={customerId}` so changing customer clears the picker.
