# Plan: Replace AppSheet OCR-SalesApp with a Self-Hosted Webapp

## Context

The user runs `OCR-SalesApp-6151159` on AppSheet (real-estate sales CRM for Spice One Builders / One Group). AppSheet's logic layer (formulas, automations, validations) **cannot be modified via API** — only data CRUD on rows. AppSheet MCP servers exist (Zapier, Gumloop) but they expose only data, not logic. To gain code-level control over backend logic, custom workflows, and ultimately self-hosting, the only path is **rebuilding the app as a custom webapp**.

**Goal:** Migrate fully off AppSheet to a self-hosted Next.js + Supabase webapp, preserving all data and feature parity, but in **incremental phases**. The very first deliverable is a static **HTML prototype** to showcase the planned UX before committing to the full build.

**Constraints:**
- Solo build with Claude Code assistance
- Responsive web app (mobile field staff + desktop office staff)
- Self-hosted on user's own VPS at the end (Docker Compose)
- Keep AppSheet running as source-of-truth during Phase 2 (read-only mirror); cut over at end of Phase 3
- **First milestone is an HTML-only clickable prototype** — no backend, no database, just static pages with realistic sample data to validate the UX with stakeholders

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui | Best DX with Claude, mature ecosystem, mobile-friendly, easy SSR |
| Database | Postgres (via Supabase) | Real relational DB for the relational workflow; Supabase = Postgres + Auth + Storage + RLS bundled |
| Auth | Supabase Auth (email/password + Google) | Internal staff only; built-in, minimal code |
| File storage | Supabase Storage (buckets per category) | Aadhaar/PAN/document images; signed URLs gated by RLS |
| Tables UI | TanStack Table | Handles 1000+ row lists with sort/filter/virtualization |
| Deployment (dev + prod, single environment) | Self-hosted Supabase Docker Compose + Next.js Docker service on user's existing Hostinger VPS from day one, behind nginx + Let's Encrypt | VPS already provisioned (Hostinger KVM 2, Ubuntu 24.04, Mumbai, 72.61.170.222). Local dev runs the same `docker-compose.yml`. No managed-to-self-hosted migration needed. |
| Sync (Phase 1) | Node script using AppSheet REST API `Find` action, idempotent UPSERT to Postgres | API is now enabled; key validated |

---

## AppSheet API status

- API enabled at: AppSheet editor → Settings → Integrations → IN → Enable (verified 2026-05-03)
- App ID: `705afb9b-cd78-47a5-8dc3-b1ea00c0ed8b`
- Access Key: `<see local ~/Downloads/CLAUDE.md>`
- Endpoint: `POST https://api.appsheet.com/api/v2/apps/{appId}/tables/{tableName}/Action`
- Verified working: 19 tables probed successfully on 2026-05-03

---

## Source schema (verified via API on 2026-05-03)

### Active tables to migrate (17)

| AppSheet table | Rows | Cols | Postgres target | Notes |
|---|---:|---:|---|---|
| Add Broker | 35 | 13 | `brokers` | Aadhar/PAN/Other Image fields → Supabase Storage URLs |
| Name | 1174 | 48 | `customers` (rename from "Name") | Allottee profiles, supports joint bookings up to 3 names. Drop `Related *` fields. |
| Unit | 1045 | 31 | `units` | Master unit table (different from Approved Units) |
| Approved Units | 1205 | 5 | `approved_units` | Looks like a slice/snapshot — keep as separate table for Phase 1, evaluate as view in Phase 2 |
| Booking | 1211 | 57 | `bookings` | Core entity. FK → brokers, customers, units, payment_plans |
| Add Payment Plan | 13 | 47 | `payment_plans` + `payment_plan_installments` (Phase 2 split); flat for Phase 1 | Wide table flattens up to 11 installments per row |
| Add Demand Stage | 83 | 22 | `demand_stages` | Master installment stage definitions |
| Demand Made | 619 | 118 | `demands` + `demand_installments` (Phase 2 split); flat for Phase 1 | 11 installment slots flattened into 11×4 cols |
| New Demand Generator | 2 | 29 | `demand_generators` | Active workflow (replaces old empty `Demand Generator`) |
| Receipts Request | 21 | 42 | `receipts_requests` | Pending receipts |
| Receipts Made | 2904 | 43 | `receipts` | Issued receipts. FK → bookings via Unit ID + Name ID |
| Documents Made | 3266 | 176 | `documents` (Phase 1 mirror) → split in Phase 2 | Auto-generated docs: agreements, receipts. Wide because 8 receipt slots inline. |
| Document Submission | 146 | 11 | `document_submissions` | Uploaded doc registry (Vide No, Book No, Jild No) |
| Site Visit List | 9 | 10 | `site_visits` | Lead-capture stage |
| Demand Record | 3 | 11 | `demand_records` | History/log; mostly empty |
| Demand Calculation | 23 | 25 | **Postgres view** | Derivative; compute from base data |
| Outstanding | 973 | 8 | **Postgres view** | Derivative balance per allottee/unit |

### Skip (empty / deprecated)

- `Demand Generator` (0 rows, deprecated — superseded by `New Demand Generator`)
- `Document Request` (0 rows, unused)

### General mapping rules

- Spaces & special chars in column names → `snake_case` (e.g. `Aadhaar No.` → `aadhaar_no`, `Joint Booking?` → `is_joint_booking`)
- Drop all `Related <Table>` pseudo-columns — replaced by FK joins in Postgres
- Drop `_RowNumber` (AppSheet artifact)
- Image fields contain Drive paths like `My Drive/Project ERP/V2/OCR/Sales Images/...` — store as `<entity>_image_url` text columns; image migration script downloads from Drive and reuploads to Supabase Storage, replacing path with a Storage URL

---

## Project structure

```
appsheet-replacement/
├── app/                            # Next.js App Router
│   ├── (auth)/login/
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar nav (mobile drawer + desktop)
│   │   ├── page.tsx                # KPI dashboard
│   │   ├── bookings/               # List + detail
│   │   ├── customers/              # ex-"Name"
│   │   ├── units/
│   │   ├── brokers/
│   │   ├── demands/
│   │   ├── receipts/
│   │   ├── documents/
│   │   ├── outstanding/            # Postgres view
│   │   └── site-visits/
│   └── api/                        # Server actions / API routes
├── components/
│   ├── ui/                         # shadcn/ui primitives
│   └── data-table/                 # TanStack Table wrapper
├── lib/
│   ├── supabase/                   # browser-client.ts, server-client.ts
│   ├── db/queries.ts               # Typed query helpers
│   └── types.ts                    # Generated from supabase gen types
├── supabase/
│   ├── migrations/                 # SQL schema migrations
│   └── seed.sql                    # Postgres views (outstanding, demand_calculation)
├── scripts/
│   ├── sync-from-appsheet.ts       # AppSheet REST → Postgres (idempotent UPSERT)
│   ├── migrate-images.ts           # Drive → Supabase Storage
│   └── verify-sync.ts              # Row count + checksum diffs
├── docker-compose.yml              # Self-hosted Supabase + Next.js (Phase 4)
├── .env.example
└── package.json
```

---

## Phased delivery

### Phase 0 — HTML prototype for showcase (~2–3 days) **CURRENT FIRST STEP**

**Purpose:** Validate the proposed UI/UX with stakeholders before any backend work. Single static folder, opens in any browser, works offline, no build step required.

**Deliverable:** `prototype/` folder containing:

```
prototype/
├── index.html                  # Login screen (mock)
├── dashboard.html              # KPI home (commission paid/unpaid totals, outstanding totals, recent activity)
├── bookings.html               # Bookings list (TanStack-style table with sort/filter, mobile-collapsing)
├── booking-detail.html         # Single booking view — broker, customer, unit, payment plan, receipts, demands
├── customers.html              # Names/Allottees list
├── customer-detail.html        # Allottee profile with Aadhaar/PAN previews + joint booking section
├── brokers.html                # Add Broker list
├── units.html                  # Unit master + Approved Units toggle
├── demands.html                # Demands list with status pills
├── demand-detail.html          # Single demand with installment breakdown
├── receipts.html               # Receipts list
├── receipt-detail.html         # Single receipt
├── documents.html              # Documents Made list
├── outstanding.html            # Outstanding balance view
├── site-visits.html            # Site visit list
├── new-booking.html            # Create-booking form mockup
├── new-receipt.html            # Create-receipt form mockup
├── assets/
│   ├── styles.css              # Custom CSS (uses Tailwind via CDN)
│   ├── sidebar.js              # Mobile drawer toggle, nav highlighting
│   ├── data.js                 # Sample data extracted from real AppSheet API responses (anonymized)
│   └── tables.js               # Sort/filter/search on data tables
└── README.md                   # How to view, what's mocked vs real
```

**Tech choices for prototype:**
- Tailwind CSS via CDN — no build step
- Lucide icons via CDN
- shadcn/ui visual style replicated in plain CSS classes (so the look matches Phase 2+)
- Vanilla JS (no framework) — keeps the prototype trivial to host anywhere
- **Sample data:** real anonymized rows from the API probe (we have 1211 booking rows, etc., already cached in `/tmp/appsheet_probe/`). Anonymize names/phones/Aadhaar before committing.
- Mobile-first responsive — must look good on iPhone Safari and Chrome desktop

**Showcase requirements:**
- Clickable navigation (sidebar links work between pages)
- At least 3 sample rows visible per list page
- Mobile drawer toggle works
- One detail page per major entity is fully fleshed out (Bookings, Customers, Demands, Receipts)
- "Login" page is a static mock that links to dashboard on submit
- Forms have realistic field layouts but don't submit anywhere (or `console.log`)

**Verification:**
- `open prototype/index.html` in Chrome → click through every nav link → all pages render
- Resize browser to 375px (iPhone) — sidebar collapses to drawer, tables become card stacks
- Stakeholder review meeting — collect feedback before moving to Phase 1

### Phase 1 — Bootstrap real app + VPS hardening (~1.5 weeks)

**1a. VPS hardening (do FIRST before any deployment):**
   - Add SSH key to Hostinger via hPanel → Settings → SSH key
   - Disable password auth and root login in `/etc/ssh/sshd_config`; create `deploy` sudo user
   - Set Hostinger firewall: allow `22` (SSH), `80` (HTTP), `443` (HTTPS); block everything else
   - Install Docker + Docker Compose
   - Install nginx + certbot for Let's Encrypt SSL

**1b. Self-hosted Supabase on VPS:**
   - Clone official supabase/docker repo, configure `.env` with strong secrets
   - `docker compose up -d` — brings up Postgres + Studio + GoTrue + PostgREST + Storage + Realtime + Kong
   - Reverse-proxy Studio + Kong via nginx behind a subdomain (e.g. `studio.onegroup.in`, `api.onegroup.in`)

**1c. Next.js scaffold:**
1. Init Next.js 15 + TypeScript + Tailwind + shadcn/ui
2. Use the same `docker-compose.yml` locally for development (Postgres + minimum Supabase stack)
3. Write migrations for 17 tables (snake_case, FKs, indexes on `broker_id`, `unit_id`, `name_id`, `booking_key`, dates)
4. Implement `scripts/sync-from-appsheet.ts`:
   - Loop all 17 tables, call AppSheet `Find` action with `Selector` for incremental sync where possible
   - Map AppSheet columns → snake_case Postgres columns (config-driven mapping table)
   - Idempotent UPSERT keyed on AppSheet's primary keys (`Booking Key`, `Name ID`, `Unique ID`, etc.)
5. Implement `scripts/migrate-images.ts`:
   - Read Drive file paths from migrated rows
   - Download via Google Drive API (service account)
   - Upload to Supabase Storage buckets (`aadhar/`, `pan/`, `documents/`)
   - Update Postgres rows with Storage URLs
6. Run full sync; verify row counts match AppSheet

### Phase 2 — MVP read-only dashboard (~2–3 weeks) **DEPLOYABLE**

1. Supabase Auth (email/password)
2. RLS policies: authenticated users can `SELECT` everything
3. App shell: responsive sidebar (mobile drawer + desktop)
4. Per-entity list pages with TanStack Table — sort, filter, search:
   - Bookings, Customers, Units, Brokers, Demands, Receipts, Documents, Outstanding, Site Visits
5. Per-entity detail pages — read-only display of all fields, image previews via Supabase Storage signed URLs
6. KPI dashboard home: counts, commission paid/unpaid, outstanding totals
7. Postgres views for `outstanding_view` and `demand_calculation_view` (replicate AppSheet formulas in SQL)
8. Cron-scheduled sync (nightly via Supabase scheduled function or external cron)
9. Deploy preview to Vercel (or stay local) for staff to view
10. **Cutover decision point:** AppSheet still source-of-truth; webapp is mirror

### Phase 3 — Write capability + cutover (~3–4 weeks)

1. **Schema normalization:** split wide tables
   - `payment_plans` → `payment_plans` + `payment_plan_installments`
   - `demands` → `demands` + `demand_installments`
   - `documents` → `documents` + `document_receipts`
2. Write a one-time normalization migration script
3. Edit forms (shadcn/ui Form) for: Bookings, Customers, Brokers, Receipts, Demands, Site Visits
4. File upload to Supabase Storage from forms
5. RLS policies refined: edit permissions per role
6. Validation rules ported from AppSheet (replicate critical ones in TypeScript / Postgres CHECK constraints)
7. **Cutover:** stop AppSheet sync, point staff at webapp, retain AppSheet read-only as backup for 30 days
8. Decommission AppSheet integration

### Phase 4 — Automations (~2–3 weeks)

1. Port AppSheet automations (review the AppSheet "Bots" panel to enumerate them)
2. Demand generation workflow (probably the biggest)
3. Document generation (Receipt PDFs, Agreement PDFs — replicate from `Documents Made` template logic)
4. OCR pipeline if used (the app name suggests OCR is part of broker form capture — confirm scope)
5. Notifications (email/SMS triggers if any in current automations)

### Phase 5 — Production hardening (~2 days, much smaller now)

Most of the original Phase 5 work has been absorbed into Phase 1 (VPS already exists, stack already self-hosted from day one). Phase 5 is now just the *production polish*:

1. Custom domain on the VPS — point `app.onegroup.in` (or chosen domain) to `72.61.170.222` via A record
2. Let's Encrypt SSL via certbot for the production domain
3. Daily Postgres `pg_dump` cron + offsite copy (S3 / B2 / Hostinger snapshot, in addition to Hostinger's existing 2-snapshot backup)
4. Production-grade `.env` secrets rotation
5. Configure Hostinger firewall: only `22` (restricted to office IPs if possible), `80`, `443`
6. Set up basic uptime monitoring (e.g. UptimeRobot free tier) and Postgres slow-query log
7. Write a one-page runbook: how to SSH in, where logs live, how to restart services, how to restore from backup

---

## Critical files to create

- `supabase/migrations/0001_initial_schema.sql` — 17 tables with FK + indexes
- `supabase/seed.sql` — `outstanding_view`, `demand_calculation_view`
- `scripts/sync-from-appsheet.ts` — main sync engine, **reuse this as the migration script in Phase 4 (one-time final pull before cutover)**
- `scripts/migrate-images.ts`
- `lib/supabase/server-client.ts`, `lib/supabase/browser-client.ts`
- `lib/types.ts` — generated via `supabase gen types typescript`
- `docker-compose.yml` (Phase 4)

## Existing utilities to reuse

- `py-appsheet` library exists for AppSheet schema introspection ([PyPI](https://pypi.org/project/py-appsheet/)) — useful as reference for writing the Node sync script, though we'll write it in TypeScript directly using `fetch()` against the same REST API we already validated.

---

## Verification

### Phase 0 verification (HTML prototype)
- `open prototype/index.html` → click every sidebar link → no broken pages.
- Resize browser window to 375px wide → sidebar collapses to drawer; tables become readable card stacks.
- Lighthouse mobile audit ≥ 90 for Accessibility and Best Practices on `dashboard.html`.
- All 1000+ sample bookings paginate/scroll smoothly without freezing the browser (use a slice of real data).
- Stakeholder walks through the prototype in a meeting, gives written sign-off (or list of changes) before Phase 1 starts.

### Phase 1 verification
- Run `npm run sync` end-to-end; verify Postgres row counts match: brokers=35, customers=1174, units=1045, bookings=1211, demands=619, receipts=2904, documents=3266, outstanding=973, etc. (counts from API probe 2026-05-03).
- Spot-check 3 random `Booking` rows in Postgres vs the AppSheet UI for field-level accuracy.
- Verify all images for one Customer record load via Supabase Storage signed URL.

### Phase 2 verification
- All 9 list pages load under 2s on a mid-tier phone with 4G.
- Search "Bhutani" on customers returns the expected record (verified to exist in source data).
- Outstanding view matches AppSheet's Outstanding table values for 5 sample bookings.
- Auth: log in, see data; log out, redirected to login.
- Test on iPhone Safari + Chrome desktop + Android Chrome.

### Phase 3 verification
- Create a new Booking via form; row appears in Postgres with all FKs correctly resolved.
- Edit a Customer; image upload works; RLS prevents an unauthenticated session from writing.
- Run normalization migration on a copy of the DB; verify all `Demand Made` rows produce the expected `demands` + `demand_installments` rows (idempotent — running it twice is safe).

### Phase 5 verification
- `docker-compose up` on staging VPS produces working Supabase + Next.js stack.
- Postgres backup → restore round-trip succeeds.
- SSL cert auto-renews (test by running certbot dry-run).
- Daily backup cron writes to offsite location.

---

## Open questions to resolve during Phase 1

1. **Approved Units (1205) vs Unit (1045)**: Approved Units has more rows than Unit master — likely allocations across multiple bookings per unit. Inspect 5 sample rows of each to confirm exact relationship before deciding view-vs-table.
2. **OCR feature**: app name is "OCR-SalesApp" but OCR isn't visible in the table list. Probably an automation reading scanned broker forms. Confirm with user during Phase 4.
3. **Number of staff users** (drives RLS complexity and VPS sizing).
4. **Backup retention policy** (daily for N days? weekly archives?).

---

## Risks

- **Wide table normalization (Phase 3)** is the highest-risk migration step. Mitigate by writing the normalization script as fully idempotent and testable on a Postgres dump first.
- **Document generation (Phase 4)** likely uses AppSheet templates we can't directly read. Plan to study a few generated PDFs and re-implement layout in code (e.g. `pdfkit` / `react-pdf`).
- **Drive image migration**: 1000+ images; rate limits, missing files. Script must be resumable.
- **Self-hosted Supabase ops burden** post-Phase 5. User must be comfortable with Linux/Docker maintenance, or stay on managed Supabase indefinitely (also fine — it has a generous free tier).
- **Prototype expectation gap (Phase 0)**: stakeholders may expect the prototype to "work" beyond what's mocked. Be explicit in the prototype `README.md` about what is fake (data, forms, search) vs what is real (layout, navigation flow).
