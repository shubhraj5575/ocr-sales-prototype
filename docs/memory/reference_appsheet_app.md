---
name: AppSheet OCR-SalesApp source-of-truth references
description: Where to find the live AppSheet app, its data, and probe artifacts when working on the replacement
type: reference
originSessionId: b5fa6d7f-0b2f-46d4-b19e-b25c629f0546
---
**AppSheet editor (live source):** https://www.appsheet.com/Template/AppDef?appName=OCR-SalesApp-6151159  
**Google Sheet backend:** https://docs.google.com/spreadsheets/d/1mrAkLpBf4l-Glrzg3inM8uyrDvsvY2wJp_QxWPFwCs4 (private; needs sheet owner access)  
**AppSheet REST API:** `POST https://api.appsheet.com/api/v2/apps/{appId}/tables/{tableName}/Action` (App ID `705afb9b-cd78-47a5-8dc3-b1ea00c0ed8b`, key `<see local ~/Downloads/CLAUDE.md>` — `IN` integration was enabled 2026-05-03)

**Cached schema probe (volatile — under `/tmp`, may be cleaned by macOS):** `/tmp/appsheet_probe/<TableName>.json` — full row dumps for all 19 tables as captured on 2026-05-03. Re-run the probe (parallel curls in chat history) if `/tmp` was cleared. Anonymized JS-ready version is committed at `prototype/assets/data.js`.

**Approved implementation plan:** `/Users/shubhraj/.claude/plans/https-www-appsheet-com-template-appdef-a-lucky-newell.md` — phases 0–5 from HTML prototype to self-hosted VPS deployment.

**Live deliverables:**
- Phase 0 prototype: https://tech1onegroup.github.io/ocr-sales-prototype/
- Repo: https://github.com/tech1onegroup/ocr-sales-prototype
- Personal mirror: https://github.com/shubhraj5575/ocr-sales-prototype
