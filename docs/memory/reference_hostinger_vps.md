---
name: Hostinger VPS for One Group production
description: VPS specs, login, IP, and security state — used as both dev parity target and production host
type: reference
originSessionId: b5fa6d7f-0b2f-46d4-b19e-b25c629f0546
---
User has a **Hostinger KVM 2 VPS** already provisioned (confirmed 2026-05-04 via hPanel screenshot). This is the **production target from day one** — no managed Supabase migration needed; we self-host the entire stack here.

**Specs:**
- Plan: KVM 2 (typically 2 vCPU · 8 GB RAM · 100 GB NVMe)
- OS: Ubuntu 24.04 LTS
- IP: `72.61.170.222`
- SSH: `ssh root@72.61.170.222` (password-only initially; user must add SSH key)
- Hostname: `srv1297912.hstgr.cloud`
- Location: India · Mumbai (great for staff in Haryana — low latency)
- Bandwidth: 8 TB / month
- Hostinger snapshots: 2 active (auto-managed)
- hPanel URL: `https://hpanel.hostinger.com/vps/1297912/overview`
- hPanel account: `apoorv@onecity.in` (managed via impersonate-mode by tech2@onecity.in)

**Security state (as of 2026-05-04 — must harden before deploying anything sensitive):**
- Firewall rules: `0` (wide open — needs to be locked to 22/80/443)
- SSH key: not configured ("Manage" link in hPanel)
- Root SSH: enabled
- Malware scanner: not installed (skip — Hostinger upsell)

**How to apply:**
- Don't SSH into this box without **explicit user permission per turn** — it's shared production infra. Confirm before each session.
- When deploying: use `docker-compose.yml` that mirrors local dev, run `docker compose up -d`, reverse-proxy via nginx + Let's Encrypt.
- Don't hardcode the IP into the app; use a domain (e.g. subdomain on `onegroup.in`) so DNS can move if Hostinger reassigns.
- Hostinger Mumbai is GDPR/Indian-data-locality friendly; mention this when discussing compliance with the user.
