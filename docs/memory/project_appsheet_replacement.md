---
name: AppSheet OCR-SalesApp replacement project
description: The user is migrating off AppSheet to a self-hosted Next.js + Supabase webapp; current state, infrastructure available, and key constraints
type: project
originSessionId: b5fa6d7f-0b2f-46d4-b19e-b25c629f0546
---
User is replacing the AppSheet app `OCR-SalesApp-6151159` (real-estate sales CRM, 19 tables, ~10k rows total) with a custom self-hosted Next.js + Supabase webapp. AppSheet's logic layer cannot be edited via API, which forces the rebuild.

**Why:** Code-level control over backend logic and ultimate self-hosting on user's own infrastructure.

**How to apply:** When working on this codebase, default to the approved phased plan at `/Users/shubhraj/.claude/plans/https-www-appsheet-com-template-appdef-a-lucky-newell.md`. Don't re-debate stack choices — Next.js 15 + Supabase + Postgres + Docker on VPS is locked.

**Infrastructure user already has (confirmed 2026-05-03):**
- AppSheet API enabled on the source app (App ID `705afb9b-cd78-47a5-8dc3-b1ea00c0ed8b`, key `<see local ~/Downloads/CLAUDE.md>`)
- GitHub: personal account `shubhraj5575` + company account `tech1onegroup` (use the latter for canonical company-owned repos; both have admin scopes)
- Hostinger account (plan type still TBD — ask for hPanel screenshot when sizing the deployment)
- Supabase account (don't recommend signup — they have one)

**Phase 0 deliverable LIVE:** Static HTML prototype at https://tech1onegroup.github.io/ocr-sales-prototype/ (repo: https://github.com/tech1onegroup/ocr-sales-prototype). Mirror at https://github.com/shubhraj5575/ocr-sales-prototype. Local source: `/Users/shubhraj/Downloads/appsheet/prototype/`.

**Schema reality check from API probe:**
- 19 tables, 17 active (skip empty `Demand Generator`, `Document Request`)
- Wide denormalized tables: `Demand Made` (118 cols), `Documents Made` (176 cols), `Add Payment Plan` (47 cols) — flatten 1-to-many installments. Will need normalization in Phase 3, kept flat for Phase 1 mirror.
- Derivative-only tables: `Outstanding`, `Demand Calculation` — implement as Postgres views, not migrated rows.
- Source-of-truth during migration is still the live Google Sheet (`1mrAkLpBf4l-Glrzg3inM8uyrDvsvY2wJp_QxWPFwCs4`); cutover happens at end of Phase 3.
